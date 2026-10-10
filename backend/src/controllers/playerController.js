import { z } from 'zod';
import prisma from '../db.js';

const playerSchema = z.object({
  fullName: z.string().min(1, 'Player name is required').trim(),
  collegeId: z.string().trim().optional().or(z.literal('')),
  username: z.string().trim().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  rating: z.number().int().min(0, 'Rating cannot be negative').default(1200),
  club: z.string().trim().optional().or(z.literal('')),
});

const playerUpdateSchema = playerSchema.partial().extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

// GET /api/players (Public)
export const getPlayers = async (req, res) => {
  try {
    const { search, status, sort = 'rating', order = 'desc' } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = 'ACTIVE'; // default public view shows active players
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { collegeId: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { club: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {};
    if (sort === 'fullName' || sort === 'name') {
      orderBy.fullName = order === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.rating = order === 'asc' ? 'asc' : 'desc';
    }

    const players = await prisma.player.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            participants: true,
            wonMatches: true,
          },
        },
      },
    });

    return res.json(players);
  } catch (err) {
    console.error('Error fetching players:', err);
    return res.status(500).json({ error: 'Failed to fetch players' });
  }
};

// GET /api/players/all (Admin - includes archived)
export const getAllAdminPlayers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { collegeId: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { club: { contains: search, mode: 'insensitive' } },
      ];
    }

    const players = await prisma.player.findMany({
      where,
      orderBy: { rating: 'desc' },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    return res.json(players);
  } catch (err) {
    console.error('Error fetching admin players:', err);
    return res.status(500).json({ error: 'Failed to fetch admin players' });
  }
};

// GET /api/players/:id (Public player profile & history)
export const getPlayerById = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                format: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        whiteMatches: {
          where: { status: 'COMPLETED' },
          include: {
            blackPlayer: { select: { id: true, fullName: true, rating: true } },
            tournament: { select: { id: true, name: true } },
          },
        },
        blackMatches: {
          where: { status: 'COMPLETED' },
          include: {
            whitePlayer: { select: { id: true, fullName: true, rating: true } },
            tournament: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Calculate match statistics
    const allMatches = [
      ...player.whiteMatches.map((m) => ({ ...m, playerColor: 'WHITE' })),
      ...player.blackMatches.map((m) => ({ ...m, playerColor: 'BLACK' })),
    ];

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const m of allMatches) {
      if (m.result === 'DRAW') {
        draws++;
      } else if (m.winnerId === player.id) {
        wins++;
      } else if (m.winnerId) {
        losses++;
      }
    }

    return res.json({
      player: {
        id: player.id,
        fullName: player.fullName,
        collegeId: player.collegeId,
        username: player.username,
        email: player.email,
        rating: player.rating,
        club: player.club,
        status: player.status,
        createdAt: player.createdAt,
      },
      stats: {
        totalMatches: allMatches.length,
        wins,
        losses,
        draws,
        winRate: allMatches.length > 0 ? ((wins / allMatches.length) * 100).toFixed(1) + '%' : '0%',
      },
      tournaments: player.participants.map((p) => p.tournament),
      recentMatches: allMatches.slice(0, 10),
    });
  } catch (err) {
    console.error('Error fetching player by id:', err);
    return res.status(500).json({ error: 'Failed to fetch player profile' });
  }
};

// POST /api/admin/players (Admin)
export const createPlayer = async (req, res) => {
  try {
    const parseResult = playerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { fullName, collegeId, username, email, rating, club } = parseResult.data;

    // Check unique collegeId if provided
    if (collegeId) {
      const existing = await prisma.player.findUnique({ where: { collegeId } });
      if (existing) return res.status(409).json({ error: 'College ID is already registered' });
    }

    // Check unique username or email if provided
    if (username) {
      const existing = await prisma.player.findUnique({ where: { username } });
      if (existing) return res.status(409).json({ error: 'Username already in use' });
    }
    if (email) {
      const existing = await prisma.player.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    const player = await prisma.player.create({
      data: {
        fullName,
        collegeId: collegeId || null,
        username: username || null,
        email: email || null,
        rating: rating ?? 1200,
        club: club || null,
        status: 'ACTIVE',
      },
    });

    return res.status(201).json(player);
  } catch (err) {
    console.error('Error creating player:', err);
    return res.status(500).json({ error: 'Failed to create player' });
  }
};

// PATCH /api/admin/players/:id (Admin)
export const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = playerUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const data = { ...parseResult.data };
    if (data.collegeId === '') data.collegeId = null;
    if (data.username === '') data.username = null;
    if (data.email === '') data.email = null;

    if (data.collegeId) {
      const existing = await prisma.player.findFirst({
        where: { collegeId: data.collegeId, NOT: { id } },
      });
      if (existing) return res.status(409).json({ error: 'College ID is already in use by another player' });
    }

    const updated = await prisma.player.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error updating player:', err);
    return res.status(500).json({ error: 'Failed to update player' });
  }
};

// DELETE /api/admin/players/:id (Admin archive)
export const archivePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await prisma.player.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return res.json({ message: 'Player archived successfully', player });
  } catch (err) {
    console.error('Error archiving player:', err);
    return res.status(500).json({ error: 'Failed to archive player' });
  }
};
