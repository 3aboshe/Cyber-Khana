import express from 'express';
import {
  getUsers,
  getUserProfile,
  getPublicProfile,
  getLeaderboard,
  createAdmin,
  promoteToAdmin,
  demoteFromAdmin,
  updateProfile,
  updateProfileIcon,
  banUser,
  unbanUser,
  changeUserPassword,
  deleteUser,
  purchaseHint,
  deductPoints,
  getUserPenalties,
  addPoints
} from '../controllers/userController';
import { authenticate, authenticateSuperAdmin, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/me', authenticate, getUserProfile);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/profile/:userId', authenticate, getPublicProfile);
router.get('/', authenticate, getUsers);
router.get('/:userId/penalties', authenticate, requireAdmin, getUserPenalties);
router.patch('/profile', authenticate, updateProfile);
router.patch('/profile-icon', authenticate, updateProfileIcon);
router.post('/create-admin', authenticate, requireAdmin, createAdmin);
router.post('/promote/:userId', authenticate, authenticateSuperAdmin, promoteToAdmin);
router.post('/demote/:userId', authenticate, authenticateSuperAdmin, demoteFromAdmin);
router.post('/change-password/:userId', authenticate, authenticateSuperAdmin, changeUserPassword);
router.post('/:userId/deduct-points', authenticate, requireAdmin, deductPoints);
router.post('/:userId/add-points', authenticate, authenticateSuperAdmin, addPoints);
router.delete('/:userId', authenticate, authenticateSuperAdmin, deleteUser);
router.post('/ban/:userId', authenticate, requireAdmin, banUser);
router.post('/unban/:userId', authenticate, requireAdmin, unbanUser);
router.post('/purchase-hint', authenticate, purchaseHint);

export default router;
