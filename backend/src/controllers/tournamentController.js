import { z } from 'zod';
import prisma from '../db.js';

const tournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required').trim(),
  description: z.string().optional().or(z.literal('')),
  format: z.enum(['SWISS', 'SINGLE_ELIMINATION']).default('SWISS'),
  status: z.enum(['DRAFT', 'UPCOMING', 'IN_PROGRESS', 'COMPLETED']).default('DRAFT'),
  visibility: z.enum(['PUBLIC', 'UNPUBLISHED']).default('PUBLIC'),
  roundsCount: z.number().int().min(1).max(20).default(5),
  timeControlMinutes: z.number().int().min(1).max(180).default(10),
  incrementSeconds: z.number().int().min(0).max(60).default(0),
  scoringRules: z.any().optional(),
  tieBreakRules: z.any().optional(),
  playerIds: z.array(z.string()).optional(),
});

const tournamentUpdateSchema = tournamentSchema.partial().extend({
  championId: z.string().optional().nullable(),
});

// GET /api/tournaments (Public)
export const getTournaments = async (req, res) => {
  try {
    const { status, format, search } = req.query;

    const where = {
      visibility: 'PUBLIC',
    };

    if (status) where.status = status;
    if (format) where.format = format;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            participants: true,
            rounds: true,
            matches: true,
          },
        },
      },
    });

    return res.json(tournaments);
  } catch (err) {
    console.error('Error fetching tournaments:', err);
    return res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
};

// GET /api/admin/tournaments (Admin - includes unpublished and drafts)
export const getAllAdminTournaments = async (req, res) => {
  try {
    const { status, format, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (format) where.format = format;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            participants: true,
            rounds: true,
            matches: true,
          },
        },
      },
    });

    return res.json(tournaments);
  } catch (err) {
    console.error('Error fetching admin tournaments:', err);
    return res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
};

// GET /api/tournaments/:id (Public & Admin detail)
export const getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            player: {
              select: {
                id: true,
                fullName: true,
                username: true,
                rating: true,
                club: true,
                status: true,
              },
            },
          },
          orderBy: [{ seed: 'asc' }, { initialRating: 'desc' }],
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            matches: {
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

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    return res.json(tournament);
  } catch (err) {
    console.error('Error fetching tournament by id:', err);
    return res.status(500).json({ error: 'Failed to fetch tournament details' });
  }
};

// POST /api/admin/tournaments (Admin create)
export const createTournament = async (req, res) => {
  try {
    const parseResult = tournamentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const {
      name,
      description,
      format,
      status,
      visibility,
      roundsCount,
      timeControlMinutes,
      incrementSeconds,
      scoringRules,
      tieBreakRules,
      playerIds,
    } = parseResult.data;

    // Use transaction to create tournament and add initial participants if provided
    const result = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.create({
        data: {
          name,
          description: description || null,
          format,
          status,
          visibility,
          roundsCount,
          timeControlMinutes,
          incrementSeconds,
          scoringRules: scoringRules ? JSON.stringify(scoringRules) : JSON.stringify({ win: 1, draw: 0.5, loss: 0, bye: 1 }),
          tieBreakRules: tieBreakRules ? JSON.stringify(tieBreakRules) : JSON.stringify(['buchholz', 'sonneborn_berger', 'head_to_head']),
        },
      });

      if (playerIds && playerIds.length > 0) {
        // Fetch players to get their ratings for seeding
        const players = await tx.player.findMany({
          where: { id: { in: playerIds }, status: 'ACTIVE' },
          orderBy: { rating: 'desc' },
        });

        // Insert unique participants with seeding
        for (let i = 0; i < players.length; i++) {
          await tx.tournamentParticipant.create({
            data: {
              tournamentId: tournament.id,
              playerId: players[i].id,
              seed: i + 1,
              initialRating: players[i].rating,
              status: 'ACTIVE',
            },
          });
        }
      }

      return tournament;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error creating tournament:', err);
    return res.status(500).json({ error: 'Failed to create tournament' });
  }
};

// PATCH /api/admin/tournaments/:id (Admin update)
export const updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = tournamentUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    // Prevent incompatible rule changes if tournament has already started
    if (tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') {
      if (req.body.format && req.body.format !== tournament.format) {
        return res.status(400).json({ error: 'Cannot change format after tournament has started' });
      }
    }

    const updateData = { ...parseResult.data };
    delete updateData.playerIds;

    if (updateData.scoringRules && typeof updateData.scoringRules === 'object') {
      updateData.scoringRules = JSON.stringify(updateData.scoringRules);
    }
    if (updateData.tieBreakRules && typeof updateData.tieBreakRules === 'object') {
      updateData.tieBreakRules = JSON.stringify(updateData.tieBreakRules);
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error updating tournament:', err);
    return res.status(500).json({ error: 'Failed to update tournament' });
  }
};

// POST /api/admin/tournaments/:id/participants (Add/Select players)
export const addParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { playerIds } = req.body;

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      return res.status(400).json({ error: 'playerIds array is required' });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot add participants to completed tournament' });
    }

    // Filter out already registered players to prevent duplicates
    const existingPlayerIds = new Set(tournament.participants.map((p) => p.playerId));
    const newPlayerIds = playerIds.filter((pid) => !existingPlayerIds.has(pid));

    if (newPlayerIds.length === 0) {
      return res.json({ message: 'All selected players are already registered in this tournament' });
    }

    const playersToAdd = await prisma.player.findMany({
      where: { id: { in: newPlayerIds }, status: 'ACTIVE' },
      orderBy: { rating: 'desc' },
    });

    let currentSeed = tournament.participants.length;

    await prisma.$transaction(async (tx) => {
      for (const p of playersToAdd) {
        currentSeed++;
        await tx.tournamentParticipant.create({
          data: {
            tournamentId: id,
            playerId: p.id,
            seed: currentSeed,
            initialRating: p.rating,
            status: 'ACTIVE',
          },
        });
      }
    });

    return res.json({
      message: `Successfully added ${playersToAdd.length} participant(s)`,
      addedCount: playersToAdd.length,
    });
  } catch (err) {
    console.error('Error adding participants:', err);
    return res.status(500).json({ error: 'Failed to add participants' });
  }
};

// DELETE /api/admin/tournaments/:id/participants/:playerId (Remove participant)
export const removeParticipant = async (req, res) => {
  try {
    const { id, playerId } = req.params;

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (tournament?.status === 'IN_PROGRESS' || tournament?.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot remove participant from an ongoing or completed tournament' });
    }

    await prisma.tournamentParticipant.delete({
      where: {
        tournamentId_playerId: {
          tournamentId: id,
          playerId,
        },
      },
    });

    return res.json({ message: 'Participant removed successfully' });
  } catch (err) {
    console.error('Error removing participant:', err);
    return res.status(500).json({ error: 'Failed to remove participant' });
  }
};

// POST /api/admin/tournaments/:id/finalize (Finalize tournament)
export const finalizeTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { championId } = req.body;

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        championId: championId || undefined,
      },
    });

    return res.json({ message: 'Tournament finalized successfully', tournament: updated });
  } catch (err) {
    console.error('Error finalizing tournament:', err);
    return res.status(500).json({ error: 'Failed to finalize tournament' });
  }
};

// GET /api/admin/dashboard-stats (Dashboard stats summary)
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalTournaments,
      activeTournaments,
      upcomingTournaments,
      completedTournaments,
      totalPlayers,
      matchesInProgress,
      matchesAwaitingResults,
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.tournament.count({ where: { status: 'UPCOMING' } }),
      prisma.tournament.count({ where: { status: 'COMPLETED' } }),
      prisma.player.count({ where: { status: 'ACTIVE' } }),
      prisma.match.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.match.count({ where: { status: 'AWAITING_ADJUDICATION' } }),
    ]);

    return res.json({
      totalTournaments,
      activeTournaments,
      upcomingTournaments,
      completedTournaments,
      totalPlayers,
      matchesInProgress,
      matchesAwaitingResults,
    });
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
};
