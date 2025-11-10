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
  uploadWriteupPdfController,
  uploadChallengeFilesController,
  publishHint,
  publishChallenge,
  unpublishChallenge,
  applyRetroactiveDecayToAll,
  applyRetroactiveDecayToChallenge
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
router.post('/upload-writeup-pdf', authenticate, requireAdmin, uploadWriteupPdfController);
router.post('/upload-files', authenticate, requireAdmin, uploadChallengeFilesController);
router.post('/:id/publish-hint', authenticate, requireAdmin, publishHint);
router.post('/:id/publish', authenticate, requireAdmin, publishChallenge);
router.post('/:id/unpublish', authenticate, requireAdmin, unpublishChallenge);
router.post('/apply-retroactive-decay', authenticate, requireAdmin, applyRetroactiveDecayToAll);
router.post('/:id/apply-retroactive-decay', authenticate, requireAdmin, applyRetroactiveDecayToChallenge);

export default router;
