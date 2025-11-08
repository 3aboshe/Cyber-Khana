import express from 'express';
import {
  getUsers,
  getUserProfile,
  getLeaderboard,
  createAdmin,
  promoteToAdmin,
  updateProfileIcon,
  banUser,
  unbanUser
} from '../controllers/userController';
import { authenticate, authenticateSuperAdmin, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticate, getUserProfile);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/', authenticate, getUsers);
router.patch('/profile-icon', authenticate, updateProfileIcon);
router.post('/create-admin', authenticate, requireAdmin, createAdmin);
router.post('/promote/:userId', authenticate, authenticateSuperAdmin, promoteToAdmin);
router.post('/ban/:userId', authenticate, requireAdmin, banUser);
router.post('/unban/:userId', authenticate, requireAdmin, unbanUser);

export default router;
