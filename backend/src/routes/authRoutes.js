import express from 'express';
import { login, logout, getSession } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/session', getSession);

export default router;
