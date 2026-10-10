import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../db.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { username, password } = parseResult.data;

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid username or password',
      });
    }

    // Set session
    req.session.admin = {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    };

    return res.json({
      message: 'Login successful',
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const logout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out' });
      }
      res.clearCookie('chess_session_id');
      return res.json({ message: 'Logged out successfully' });
    });
  } else {
    return res.json({ message: 'No active session to terminate' });
  }
};

export const getSession = (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({
      authenticated: true,
      admin: req.session.admin,
    });
  }
  return res.json({
    authenticated: false,
    admin: null,
  });
};
