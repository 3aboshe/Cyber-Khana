import express from 'express';
import {
  createCompetition,
  getCompetitions,
  getCompetition,
  getCompetitionDetails,
  getSolvedChallenges,
  getCompetitionLeaderboard,
  getCompetitionActivity,
  getCompetitionChallengeSolvers,
  updateCompetitionStatus,
  updateCompetitionStartTime,
  submitCompetitionFlag,
  addChallengeToCompetition,
  publishCompetitionHint,
  buyCompetitionHint,
  deleteCompetition,
  removeChallengeFromCompetition
} from '../controllers/competitionController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getCompetitions);
router.post('/', authenticate, requireAdmin, createCompetition);
router.get('/:id', authenticate, getCompetition);
router.get('/:id/details', authenticate, getCompetitionDetails);
router.get('/:id/solved-challenges', authenticate, getSolvedChallenges);
router.get('/:id/leaderboard', authenticate, getCompetitionLeaderboard);
router.get('/:id/activity', authenticate, getCompetitionActivity);
router.get('/:id/challenges/:challengeId/solvers', authenticate, getCompetitionChallengeSolvers);
router.patch('/:id/status', authenticate, requireAdmin, updateCompetitionStatus);
router.patch('/:id/start', authenticate, requireAdmin, updateCompetitionStartTime);
router.post('/:id/challenges', authenticate, requireAdmin, addChallengeToCompetition);
router.delete('/:id/challenges/:challengeId', authenticate, requireAdmin, removeChallengeFromCompetition);
router.delete('/:id', authenticate, requireAdmin, deleteCompetition);
router.post('/:id/submit', authenticate, submitCompetitionFlag);
router.post('/:id/challenges/:challengeId/publish-hint', authenticate, requireAdmin, publishCompetitionHint);
router.post('/:id/challenges/:challengeId/buy-hint', authenticate, buyCompetitionHint);

export default router;
