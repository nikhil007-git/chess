import { z } from 'zod';
import prisma from '../db.js';
import { generateBracketForTournament, advanceKnockoutWinner } from '../services/bracketService.js';
import { generateSwissRoundForTournament, getTournamentStandings } from '../services/swissService.js';
import { getAuthoritativeClockState, executeClockAction } from '../services/clockService.js';

const resultSchema = z.object({
  result: z.enum(['WHITE_WIN', 'BLACK_WIN', 'DRAW', 'WHITE_FORFEIT', 'BLACK_FORFEIT', 'BYE']),
  winnerId: z.string().optional().nullable(),
  tiebreakResolution: z.string().optional().nullable(),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

// GET /api/tournaments/:id/standings (Public Swiss standings)
export const getStandingsHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getTournamentStandings(id);
    return res.json(data);
  } catch (err) {
    console.error('Error fetching standings:', err);
    return res.status(404).json({ error: err.message || 'Failed to fetch standings' });
  }
};

// GET /api/tournaments/:id/pairings (Public pairings and round results)
export const getPairingsHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            matches: {
              orderBy: { boardNumber: 'asc' },
              include: {
                whitePlayer: { select: { id: true, fullName: true, rating: true } },
                blackPlayer: { select: { id: true, fullName: true, rating: true } },
                winner: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    return res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        roundsCount: tournament.roundsCount,
      },
      rounds: tournament.rounds,
    });
  } catch (err) {
    console.error('Error fetching pairings:', err);
    return res.status(500).json({ error: 'Failed to fetch pairings' });
  }
};

// GET /api/tournaments/:id/bracket (Public & Admin bracket data)
export const getTournamentBracket = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            matches: {
              orderBy: { boardNumber: 'asc' },
              include: {
                whitePlayer: { select: { id: true, fullName: true, rating: true } },
                blackPlayer: { select: { id: true, fullName: true, rating: true } },
                winner: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    return res.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        championId: tournament.championId,
      },
      rounds: tournament.rounds,
    });
  } catch (err) {
    console.error('Error fetching tournament bracket:', err);
    return res.status(500).json({ error: 'Failed to fetch bracket' });
  }
};

// POST /api/admin/tournaments/:id/rounds (Generate round or bracket)
export const generateRoundsHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    if (tournament.format === 'SINGLE_ELIMINATION') {
      const result = await generateBracketForTournament(id);
      return res.json({ message: 'Single Elimination bracket generated successfully', result });
    } else {
      const result = await generateSwissRoundForTournament(id);
      return res.json({ message: `Round ${result.round.roundNumber} generated successfully`, result });
    }
  } catch (err) {
    console.error('Error generating rounds/bracket:', err);
    return res.status(400).json({ error: err.message || 'Failed to generate round' });
  }
};

// POST /api/admin/matches/:id/result (Submit result & advance winner)
export const submitMatchResult = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = resultSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: { tournament: true },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    if (match.tournament.format === 'SINGLE_ELIMINATION') {
      const updated = await advanceKnockoutWinner(id, {
        result: parseResult.data.result,
        winnerId: parseResult.data.winnerId,
        actor: req.session.admin?.username || 'ADMIN',
        notes: parseResult.data.notes,
        tiebreakResolution: parseResult.data.tiebreakResolution,
      });
      return res.json({ message: 'Result recorded and knockout winner advanced successfully', match: updated });
    } else {
      let winnerId = parseResult.data.winnerId;
      if (!winnerId) {
        if (parseResult.data.result === 'WHITE_WIN') winnerId = match.whitePlayerId;
        else if (parseResult.data.result === 'BLACK_WIN') winnerId = match.blackPlayerId;
      }

      const updated = await prisma.match.update({
        where: { id },
        data: {
          result: parseResult.data.result,
          winnerId,
          status: 'COMPLETED',
          clockStatus: 'STOPPED',
          notes: parseResult.data.notes,
        },
      });

      return res.json({ message: 'Result recorded successfully', match: updated });
    }
  } catch (err) {
    console.error('Error submitting match result:', err);
    return res.status(400).json({ error: err.message || 'Failed to submit result' });
  }
};

// PATCH /api/admin/matches/:id/result (PRD 9.3: Correct confirmed result with audit log & downstream adjustment)
export const correctMatchResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, winnerId, reason } = req.body;

    if (!result) return res.status(400).json({ error: 'New result outcome is required' });

    const actor = req.session.admin?.username || 'ADMIN';

    const corrected = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id },
        include: { tournament: true },
      });
      if (!match) throw new Error('Match not found');

      const oldResult = match.result;
      const oldWinnerId = match.winnerId;

      let newWinnerId = winnerId;
      if (!newWinnerId) {
        if (result === 'WHITE_WIN') newWinnerId = match.whitePlayerId;
        else if (result === 'BLACK_WIN') newWinnerId = match.blackPlayerId;
      }

      // Update match
      const updatedMatch = await tx.match.update({
        where: { id },
        data: {
          result,
          winnerId: newWinnerId,
          status: 'COMPLETED',
        },
      });

      // Audit Log
      await tx.matchEvent.create({
        data: {
          matchId: match.id,
          tournamentId: match.tournamentId,
          actor,
          eventType: 'RESULT_CORRECTED',
          details: reason || 'Administrative result correction',
          beforeValue: JSON.stringify({ result: oldResult, winnerId: oldWinnerId }),
          afterValue: JSON.stringify({ result, winnerId: newWinnerId }),
        },
      });

      // If knockout match, propagate new winner to nextMatch slot
      if (match.tournament.format === 'SINGLE_ELIMINATION' && match.nextMatchId && newWinnerId) {
        const slotUpdate = {};
        if (match.nextSlot === 'WHITE') {
          slotUpdate.whitePlayerId = newWinnerId;
        } else {
          slotUpdate.blackPlayerId = newWinnerId;
        }

        await tx.match.update({
          where: { id: match.nextMatchId },
          data: slotUpdate,
        });
      }

      return updatedMatch;
    });

    return res.json({ message: 'Match result successfully corrected with audit trail', match: corrected });
  } catch (err) {
    console.error('Error correcting match result:', err);
    return res.status(400).json({ error: err.message || 'Failed to correct match result' });
  }
};

// GET /api/matches/:id (Public match and authoritative clock state)
export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
        round: true,
        whitePlayer: true,
        blackPlayer: true,
        winner: true,
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!match) return res.status(404).json({ error: 'Match not found' });

    const authoritativeClock = getAuthoritativeClockState(match);

    return res.json({
      ...match,
      authoritativeClock,
    });
  } catch (err) {
    console.error('Error getting match:', err);
    return res.status(500).json({ error: 'Failed to fetch match' });
  }
};

// GET /api/admin/matches (Admin list of all matches across tournaments)
export const getAllAdminMatches = async (req, res) => {
  try {
    const { tournamentId, status } = req.query;
    const where = {};
    if (tournamentId) where.tournamentId = tournamentId;
    if (status) where.status = status;

    const matches = await prisma.match.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        tournament: { select: { id: true, name: true, format: true } },
        round: { select: { id: true, roundNumber: true } },
        whitePlayer: { select: { id: true, fullName: true, rating: true } },
        blackPlayer: { select: { id: true, fullName: true, rating: true } },
        winner: { select: { id: true, fullName: true } },
      },
      take: 50,
    });

    return res.json(matches);
  } catch (err) {
    console.error('Error fetching admin matches:', err);
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

// POST /api/matches/:id/move (Play legal move & auto switch clock)
export const playMoveHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { fen, san, isCheckmate, isDraw } = req.body;

    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status === 'COMPLETED') return res.status(400).json({ error: 'Match is already completed' });

    if (match.clockStatus === 'STOPPED') {
      await executeClockAction(id, 'START', {}, 'SYSTEM');
    } else {
      await executeClockAction(id, 'SWITCH', {}, 'SYSTEM');
    }

    const currentHistory = match.movesHistory ? JSON.parse(match.movesHistory) : [];
    currentHistory.push({ san, timestamp: new Date().toISOString() });

    let status = match.status;
    let result = match.result;
    let winnerId = match.winnerId;

    if (isCheckmate) {
      status = 'COMPLETED';
      winnerId = match.activePlayer === 'WHITE' ? match.whitePlayerId : match.blackPlayerId;
      result = match.activePlayer === 'WHITE' ? 'WHITE_WIN' : 'BLACK_WIN';
    } else if (isDraw) {
      status = 'COMPLETED';
      result = 'DRAW';
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        currentFen: fen,
        movesHistory: JSON.stringify(currentHistory),
        status,
        result,
        winnerId,
      },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    return res.json({
      message: 'Move recorded successfully',
      match: updated,
      authoritativeClock: getAuthoritativeClockState(updated),
    });
  } catch (err) {
    console.error('Error playing move:', err);
    return res.status(400).json({ error: err.message || 'Failed to play move' });
  }
};

// POST /api/admin/matches/:id/clock (Admin clock control)
export const controlClockHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, whiteSeconds, blackSeconds, reason } = req.body;

    if (!action) return res.status(400).json({ error: 'Action is required' });

    const result = await executeClockAction(
      id,
      action,
      { whiteSeconds, blackSeconds, reason },
      req.session.admin?.username || 'ADMIN'
    );

    return res.json({
      message: `Clock action ${action} executed successfully`,
      ...result,
    });
  } catch (err) {
    console.error('Error executing clock action:', err);
    return res.status(400).json({ error: err.message || 'Failed to control clock' });
  }
};

// POST /api/admin/matches/:id/start (Admin start match shortcut)
export const startMatchHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeClockAction(id, 'START', {}, req.session.admin?.username || 'ADMIN');
    return res.json({ message: 'Match started', ...result });
  } catch (err) {
    console.error('Error starting match:', err);
    return res.status(400).json({ error: err.message || 'Failed to start match' });
  }
};
