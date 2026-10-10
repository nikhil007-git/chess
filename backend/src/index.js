import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db.js';
import authRoutes from './routes/authRoutes.js';
import playerRoutes, { adminPlayerRouter } from './routes/playerRoutes.js';
import tournamentRoutes, { adminTournamentRouter, adminDashboardRouter } from './routes/tournamentRoutes.js';
import matchRoutes, { adminMatchRouter } from './routes/matchRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxies (Render, Cloudflare, AWS) so secure cookies work properly
app.set('trust proxy', 1);

// CORS setup for local development and production
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in dev/staging, configure strict in prod
    },
    credentials: true,
  })
);

app.use(express.json());

// Session configuration
app.use(
  session({
    name: 'chess_session_id',
    secret: process.env.SESSION_SECRET || 'chess-tournament-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// Auth Routes
app.use('/api/admin/auth', authRoutes);

// Player Routes
app.use('/api/players', playerRoutes);
app.use('/api/admin/players', adminPlayerRouter);

// Tournament Routes
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/admin/tournaments', adminTournamentRouter);
app.use('/api/admin', adminDashboardRouter);

// Match & Bracket Routes
app.use('/api', matchRoutes);
app.use('/api/admin', adminMatchRouter);

// Root status endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Chess Tournament Management System API',
    version: '1.0.0',
    documentation: 'PRD v1.0 Compliant REST API',
    endpoints: {
      health: '/api/health',
      tournaments: '/api/tournaments',
      players: '/api/players',
    },
    message: 'Backend is running successfully! Use this URL in your Vercel frontend as VITE_API_URL.',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Chess Tournament Server running on http://localhost:${PORT}`);
});

export default app;
