import express from 'express';
import { getUniversities, createUniversity } from '../controllers/universityController';
import { authenticate, authenticateSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getUniversities);
router.post('/', authenticate, authenticateSuperAdmin, createUniversity);

export default router;
