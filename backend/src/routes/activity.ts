import express from 'express';
import { getRecentActivity } from '../controllers/activityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/recent', authenticate, getRecentActivity);

export default router;
