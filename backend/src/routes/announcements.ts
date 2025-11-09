import express from 'express';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getCompetitionAnnouncements,
  createCompetitionAnnouncement
} from '../controllers/announcementController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getAnnouncements);
router.post('/', authenticate, requireAdmin, createAnnouncement);
router.put('/:id', authenticate, requireAdmin, updateAnnouncement);
router.delete('/:id', authenticate, requireAdmin, deleteAnnouncement);

// Competition-specific announcements
router.get('/competition/:competitionId', authenticate, getCompetitionAnnouncements);
router.post('/competition/:competitionId', authenticate, requireAdmin, createCompetitionAnnouncement);

export default router;
