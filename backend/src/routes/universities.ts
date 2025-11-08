import express from 'express';
import { getUniversities } from '../controllers/universityController';
import { authenticate, authenticateSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getUniversities);

export default router;
