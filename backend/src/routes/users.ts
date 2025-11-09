import express from 'express';
import {
  getUsers,
  getUserProfile,
  getLeaderboard,
  createAdmin,
  promoteToAdmin,
  demoteFromAdmin,
  updateProfile,
  updateProfileIcon,
  banUser,
  unbanUser,
  changeUserPassword
} from '../controllers/userController';
import { authenticate, authenticateSuperAdmin, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticate, getUserProfile);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/', authenticate, getUsers);
router.patch('/profile', authenticate, updateProfile);
router.patch('/profile-icon', authenticate, updateProfileIcon);
router.post('/create-admin', authenticate, requireAdmin, createAdmin);
router.post('/promote/:userId', authenticate, authenticateSuperAdmin, promoteToAdmin);
router.post('/demote/:userId', authenticate, authenticateSuperAdmin, demoteFromAdmin);
router.post('/change-password/:userId', authenticate, authenticateSuperAdmin, changeUserPassword);
router.post('/ban/:userId', authenticate, requireAdmin, banUser);
router.post('/unban/:userId', authenticate, requireAdmin, unbanUser);

export default router;
