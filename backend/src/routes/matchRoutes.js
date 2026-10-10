import express from 'express';
import {
  getTournamentBracket,
  generateRoundsHandler,
  submitMatchResult,
  getMatchById,
  getStandingsHandler,
  getPairingsHandler,
  controlClockHandler,
  startMatchHandler,
  playMoveHandler,
} from '../controllers/matchController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public match, standings, and pairings routes
router.get('/matches/:id', getMatchById);
router.post('/matches/:id/move', playMoveHandler);
router.get('/tournaments/:id/bracket', getTournamentBracket);
router.get('/tournaments/:id/standings', getStandingsHandler);
router.get('/tournaments/:id/pairings', getPairingsHandler);

export const adminMatchRouter = express.Router();

// Admin protected routes
adminMatchRouter.use(requireAdmin);
adminMatchRouter.post('/tournaments/:id/rounds', generateRoundsHandler);
adminMatchRouter.post('/matches/:id/result', submitMatchResult);
adminMatchRouter.post('/matches/:id/start', startMatchHandler);
adminMatchRouter.post('/matches/:id/clock', controlClockHandler);

export default router;
