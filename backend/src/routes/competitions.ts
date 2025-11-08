import express from 'express';
import {
  createCompetition,
  getCompetitions,
  getCompetition,
  getCompetitionDetails,
  getSolvedChallenges,
  updateCompetitionStatus,
  updateCompetitionStartTime,
  submitCompetitionFlag,
  addChallengeToCompetition
} from '../controllers/competitionController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getCompetitions);
router.post('/', authenticate, requireAdmin, createCompetition);
router.get('/:id', authenticate, getCompetition);
router.get('/:id/details', authenticate, getCompetitionDetails);
router.get('/:id/solved-challenges', authenticate, getSolvedChallenges);
router.patch('/:id/status', authenticate, requireAdmin, updateCompetitionStatus);
router.patch('/:id/start', authenticate, requireAdmin, updateCompetitionStartTime);
router.post('/:id/challenges', authenticate, requireAdmin, addChallengeToCompetition);
router.post('/:id/submit', authenticate, submitCompetitionFlag);

export default router;
