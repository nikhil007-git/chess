import prisma from '../db.js';
import { calculateSwissStandings, generateNextSwissRound } from './swissEngine.js';

/**
 * Generate Next Swiss Round with matches and clock states
 */
export async function generateSwissRoundForTournament(tournamentId) {
  return await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: { player: true },
          where: { status: 'ACTIVE' },
          orderBy: [{ seed: 'asc' }, { initialRating: 'desc' }],
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: { matches: true },
        },
      },
    });

    if (!tournament) throw new Error('Tournament not found');
    if (tournament.format !== 'SWISS') throw new Error('Tournament format is not Swiss');
    if (tournament.participants.length < 2) {
      throw new Error('At least 2 participants required to generate Swiss rounds');
    }

    const currentRounds = tournament.rounds;
    const nextRoundNumber = currentRounds.length + 1;

    if (nextRoundNumber > tournament.roundsCount) {
      throw new Error(`Tournament round limit reached (${tournament.roundsCount} rounds maximum)`);
    }

    // Verify all matches in previous round are finished (PRD 6.2)
    if (currentRounds.length > 0) {
      const lastRound = currentRounds[currentRounds.length - 1];
      const unfinishedMatches = lastRound.matches.filter((m) => m.status !== 'COMPLETED');
      if (unfinishedMatches.length > 0) {
        throw new Error(`Cannot generate Round ${nextRoundNumber}: Round ${lastRound.roundNumber} has ${unfinishedMatches.length} unfinished match(es)`);
      }
    }

    // Get all completed past matches
    const pastMatches = await tx.match.findMany({
      where: { tournamentId, status: 'COMPLETED' },
    });

    // Run Swiss pairing algorithm
    const pairs = generateNextSwissRound(tournament.participants, pastMatches, nextRoundNumber);

    // Create Round entity
    const round = await tx.round.create({
      data: {
        tournamentId,
        roundNumber: nextRoundNumber,
        status: 'IN_PROGRESS',
        pairingAlgorithmVersion: 'FIDE-Swiss-1.0',
        publishedAt: new Date(),
      },
    });

    // Create Matches for this round
    const createdMatches = [];
    let boardNum = 1;

    for (const p of pairs) {
      let status = 'READY';
      let result = null;
      let winnerId = null;

      if (p.isBye) {
        status = 'COMPLETED';
        result = 'BYE';
        winnerId = p.whitePlayerId;
      }

      const match = await tx.match.create({
        data: {
          tournamentId,
          roundId: round.id,
          boardNumber: boardNum++,
          whitePlayerId: p.whitePlayerId,
          blackPlayerId: p.blackPlayerId,
          status,
          result,
          winnerId,
          timeControlMinutes: tournament.timeControlMinutes,
          incrementSeconds: tournament.incrementSeconds,
          whiteTimeRemaining: tournament.timeControlMinutes * 60,
          blackTimeRemaining: tournament.timeControlMinutes * 60,
        },
      });

      createdMatches.push(match);
    }

    // Update tournament status to IN_PROGRESS if upcoming
    if (tournament.status === 'UPCOMING' || tournament.status === 'DRAFT') {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return {
      round,
      matches: createdMatches,
    };
  });
}

/**
 * Fetch authoritative standings for tournament
 */
export async function getTournamentStandings(tournamentId) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      participants: {
        include: { player: true },
        orderBy: [{ seed: 'asc' }, { initialRating: 'desc' }],
      },
    },
  });

  if (!tournament) throw new Error('Tournament not found');

  const matches = await prisma.match.findMany({
    where: { tournamentId, status: 'COMPLETED' },
  });

  const standings = calculateSwissStandings(tournament.participants, matches);

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format,
      status: tournament.status,
      roundsCount: tournament.roundsCount,
    },
    standings,
  };
}
