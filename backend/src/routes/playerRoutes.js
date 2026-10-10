import express from 'express';
import {
  getPlayers,
  getPlayerById,
  getAllAdminPlayers,
  createPlayer,
  updatePlayer,
  archivePlayer,
} from '../controllers/playerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getPlayers);
router.get('/:id', getPlayerById);

export const adminPlayerRouter = express.Router();

// Admin protected routes
adminPlayerRouter.use(requireAdmin);
adminPlayerRouter.get('/', getAllAdminPlayers);
adminPlayerRouter.post('/', createPlayer);
adminPlayerRouter.patch('/:id', updatePlayer);
adminPlayerRouter.delete('/:id', archivePlayer);

export default router;
