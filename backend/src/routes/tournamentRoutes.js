import express from 'express';
import {
  getTournaments,
  getAllAdminTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  addParticipants,
  removeParticipant,
  finalizeTournament,
  getDashboardStats,
} from '../controllers/tournamentController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public tournament routes
router.get('/', getTournaments);
router.get('/:id', getTournamentById);

export const adminTournamentRouter = express.Router();

// Admin protected routes
adminTournamentRouter.use(requireAdmin);
adminTournamentRouter.get('/', getAllAdminTournaments);
adminTournamentRouter.post('/', createTournament);
adminTournamentRouter.patch('/:id', updateTournament);
adminTournamentRouter.post('/:id/participants', addParticipants);
adminTournamentRouter.delete('/:id/participants/:playerId', removeParticipant);
adminTournamentRouter.post('/:id/finalize', finalizeTournament);

// Export dashboard router
export const adminDashboardRouter = express.Router();
adminDashboardRouter.use(requireAdmin);
adminDashboardRouter.get('/dashboard-stats', getDashboardStats);

export default router;
