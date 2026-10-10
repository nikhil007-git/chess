import prisma from '../db.js';
import { calculateBracketSize, generateSeedOrder } from './bracketEngine.js';

/**
 * Generate full Single Elimination Bracket with rounds, matches, linkages, and byes.
 */
export async function generateBracketForTournament(tournamentId) {
  return await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: { player: true },
          orderBy: [{ seed: 'asc' }, { initialRating: 'desc' }],
        },
      },
    });

    if (!tournament) throw new Error('Tournament not found');
    if (tournament.format !== 'SINGLE_ELIMINATION') {
      throw new Error('Tournament format is not Single Elimination');
    }
    if (tournament.participants.length < 2) {
      throw new Error('At least 2 participants required to generate a bracket');
    }

    // Check if bracket is already generated
    const existingRounds = await tx.round.count({ where: { tournamentId } });
    if (existingRounds > 0) {
      throw new Error('Bracket rounds already generated for this tournament');
    }

    const participantCount = tournament.participants.length;
    const bracketSize = calculateBracketSize(participantCount);
    const totalRounds = Math.log2(bracketSize);

    // Seed map: seed number (1-indexed) -> Participant
    const seedMap = new Map();
    tournament.participants.forEach((p, idx) => {
      seedMap.set(idx + 1, p);
    });

    const seedOrder = generateSeedOrder(bracketSize);

    // 1. Create all Round entities first
    const createdRounds = [];
    for (let r = 1; r <= totalRounds; r++) {
      const round = await tx.round.create({
        data: {
          tournamentId,
          roundNumber: r,
          status: r === 1 ? 'IN_PROGRESS' : 'PENDING',
          pairingAlgorithmVersion: 'SingleElim-1.0',
        },
      });
      createdRounds.push(round);
    }

    // 2. Create match slots backwards or layer-by-layer to set up linkages
    // In round r, number of matches is bracketSize / (2^r)
    // We store matchesByRound[roundNumber] = array of match objects
    const matchesByRound = {};

    // Create matches from final round down to round 1
    for (let r = totalRounds; r >= 1; r--) {
      const matchCount = bracketSize / Math.pow(2, r);
      matchesByRound[r] = [];

      for (let m = 0; m < matchCount; m++) {
        let nextMatchId = null;
        let nextSlot = null;

        if (r < totalRounds) {
          // Link to parent match in next round
          const nextRoundMatches = matchesByRound[r + 1];
          const parentIndex = Math.floor(m / 2);
          nextMatchId = nextRoundMatches[parentIndex].id;
          nextSlot = m % 2 === 0 ? 'WHITE' : 'BLACK';
        }

        const match = await tx.match.create({
          data: {
            tournamentId,
            roundId: createdRounds[r - 1].id,
            boardNumber: m + 1,
            timeControlMinutes: tournament.timeControlMinutes,
            incrementSeconds: tournament.incrementSeconds,
            whiteTimeRemaining: tournament.timeControlMinutes * 60,
            blackTimeRemaining: tournament.timeControlMinutes * 60,
            status: r === 1 ? 'SCHEDULED' : 'SCHEDULED',
            nextMatchId,
            nextSlot,
          },
        });

        matchesByRound[r].push(match);
      }
    }

    // 3. Populate Round 1 matches with seeded players and handle byes
    const round1Matches = matchesByRound[1];
    const byeMatchesToAdvance = [];

    for (let i = 0; i < round1Matches.length; i++) {
      const whiteSeed = seedOrder[i * 2];
      const blackSeed = seedOrder[i * 2 + 1];

      const whiteParticipant = seedMap.get(whiteSeed);
      const blackParticipant = seedMap.get(blackSeed);

      const whitePlayerId = whiteParticipant ? whiteParticipant.playerId : null;
      const blackPlayerId = blackParticipant ? blackParticipant.playerId : null;

      let status = 'SCHEDULED';
      let result = null;
      let winnerId = null;

      // Handle BYE: if one player exists and opponent is null
      if (whitePlayerId && !blackPlayerId) {
        status = 'COMPLETED';
        result = 'BYE';
        winnerId = whitePlayerId;
      } else if (!whitePlayerId && blackPlayerId) {
        status = 'COMPLETED';
        result = 'BYE';
        winnerId = blackPlayerId;
      } else if (whitePlayerId && blackPlayerId) {
        status = 'READY';
      }

      const updatedMatch = await tx.match.update({
        where: { id: round1Matches[i].id },
        data: {
          whitePlayerId,
          blackPlayerId,
          status,
          result,
          winnerId,
        },
      });

      if (result === 'BYE') {
        byeMatchesToAdvance.push(updatedMatch);
      }
    }

    // 4. Advance BYE winners to Round 2
    for (const bm of byeMatchesToAdvance) {
      if (bm.nextMatchId && bm.winnerId) {
        const updateData = {};
        if (bm.nextSlot === 'WHITE') {
          updateData.whitePlayerId = bm.winnerId;
        } else {
          updateData.blackPlayerId = bm.winnerId;
        }

        const nextM = await tx.match.update({
          where: { id: bm.nextMatchId },
          data: updateData,
        });

        // If next match now has both players, mark as READY
        if (nextM.whitePlayerId && nextM.blackPlayerId) {
          await tx.match.update({
            where: { id: nextM.id },
            data: { status: 'READY' },
          });
        }
      }
    }

    // Update tournament status to IN_PROGRESS
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS' },
    });

    return {
      bracketSize,
      totalRounds,
      rounds: createdRounds,
    };
  });
}

/**
 * Idempotent winner advancement with ACID transaction & Draw handling (PRD 7 & 7.1)
 */
export async function advanceKnockoutWinner(matchId, { result, winnerId, actor = 'ADMIN', notes = '', tiebreakResolution = null }) {
  return await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!match) throw new Error('Match not found');

    // Knockout Draw validation (PRD 7.1)
    if (result === 'DRAW') {
      if (!winnerId) {
        throw new Error('Knockout draw requires an explicit winner resolved via rapid/blitz playoff or Armageddon before advancement');
      }
      if (!tiebreakResolution) {
        throw new Error('Please specify the playoff/tiebreak method (e.g., "Rapid Playoff", "Blitz Playoff", "Armageddon")');
      }
    }

    // Determine winnerId based on standard result if not explicitly set
    let finalWinnerId = winnerId;
    if (!finalWinnerId) {
      if (result === 'WHITE_WIN' || result === 'BLACK_FORFEIT') {
        finalWinnerId = match.whitePlayerId;
      } else if (result === 'BLACK_WIN' || result === 'WHITE_FORFEIT') {
        finalWinnerId = match.blackPlayerId;
      }
    }

    if (!finalWinnerId && result !== 'CANCELLED') {
      throw new Error('Cannot determine winner for advancement');
    }

    // 1. Update Match record
    const updatedMatch = await tx.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        result,
        winnerId: finalWinnerId,
        clockStatus: 'STOPPED',
        notes: notes ? `${match.notes ? match.notes + '\n' : ''}${notes}` : match.notes,
      },
    });

    // 2. Create Audit Log / Match Event
    await tx.matchEvent.create({
      data: {
        matchId: match.id,
        tournamentId: match.tournamentId,
        actor,
        eventType: 'RESULT_CONFIRMED',
        details: tiebreakResolution ? `Result: ${result}. Resolution: ${tiebreakResolution}` : `Result: ${result}`,
        beforeValue: JSON.stringify({ status: match.status, result: match.result, winnerId: match.winnerId }),
        afterValue: JSON.stringify({ status: 'COMPLETED', result, winnerId: finalWinnerId }),
      },
    });

    // 3. Advance to next round if nextMatchId exists
    if (match.nextMatchId && finalWinnerId) {
      const nextMatchUpdate = {};
      if (match.nextSlot === 'WHITE') {
        nextMatchUpdate.whitePlayerId = finalWinnerId;
      } else {
        nextMatchUpdate.blackPlayerId = finalWinnerId;
      }

      const nextMatch = await tx.match.update({
        where: { id: match.nextMatchId },
        data: nextMatchUpdate,
      });

      // If both players are known, set next match to READY
      if (nextMatch.whitePlayerId && nextMatch.blackPlayerId) {
        await tx.match.update({
          where: { id: nextMatch.id },
          data: { status: 'READY' },
        });
      }
    } else if (!match.nextMatchId && finalWinnerId) {
      // This was the FINAL match! Finalize tournament and crown champion
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: {
          status: 'COMPLETED',
          championId: finalWinnerId,
        },
      });

      await tx.matchEvent.create({
        data: {
          tournamentId: match.tournamentId,
          actor,
          eventType: 'TOURNAMENT_FINALIZED',
          details: `Champion crowned: ${finalWinnerId}`,
        },
      });
    }

    return updatedMatch;
  });
}
