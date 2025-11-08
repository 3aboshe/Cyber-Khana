import express from 'express';
import {
  getChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  submitFlag
} from '../controllers/challengeController';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getChallenges);
router.get('/:id', authenticate, getChallenge);
router.post('/', authenticate, requireAdmin, createChallenge);
router.put('/:id', authenticate, requireAdmin, updateChallenge);
router.delete('/:id', authenticate, requireAdmin, deleteChallenge);
router.post('/:id/submit', authenticate, submitFlag);

export default router;
