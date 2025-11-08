import express from 'express';
import {
  getUsers,
  getUserProfile,
  getLeaderboard,
  createAdmin
} from '../controllers/userController';
import { authenticate, authenticateSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticate, getUserProfile);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/', authenticate, getUsers);
router.post('/create-admin', authenticate, authenticateSuperAdmin, createAdmin);

export default router;
