import express from 'express';
import {
  getChallenges,
  getAllChallenges,
  getChallenge,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  submitFlag,
  copyChallengeToUniversity,
  integrateCompetitionChallenge,
  updateWriteup,
  publishChallenge,
  unpublishChallenge
} from '../controllers/challengeController';
import { authenticate, requireAdmin, authenticateSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getChallenges);
router.get('/all', authenticate, requireAdmin, getAllChallenges);
router.get('/:id', authenticate, getChallenge);
router.post('/', authenticate, requireAdmin, createChallenge);
router.put('/:id', authenticate, requireAdmin, updateChallenge);
router.delete('/:id', authenticate, requireAdmin, deleteChallenge);
router.post('/:id/submit', authenticate, submitFlag);
router.post('/:id/copy', authenticate, authenticateSuperAdmin, copyChallengeToUniversity);
router.post('/integrate/:competitionId/:challengeId', authenticate, requireAdmin, integrateCompetitionChallenge);
router.put('/:id/writeup', authenticate, requireAdmin, updateWriteup);
router.post('/:id/publish', authenticate, requireAdmin, publishChallenge);
router.post('/:id/unpublish', authenticate, requireAdmin, unpublishChallenge);

export default router;
