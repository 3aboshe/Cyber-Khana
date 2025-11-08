import express from 'express';
import {
  createCompetition,
  getCompetitions,
  getCompetition,
  updateCompetitionStatus,
  submitCompetitionFlag,
  addChallengeToCompetition
} from '../controllers/competitionController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getCompetitions);
router.post('/', authenticate, requireAdmin, createCompetition);
router.get('/:id', authenticate, getCompetition);
router.patch('/:id/status', authenticate, requireAdmin, updateCompetitionStatus);
router.post('/:id/challenges', authenticate, requireAdmin, addChallengeToCompetition);
router.post('/:id/submit', authenticate, submitCompetitionFlag);

export default router;
