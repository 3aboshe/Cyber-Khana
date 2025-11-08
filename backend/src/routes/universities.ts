import express from 'express';
import { getUniversities, createUniversity, deleteUniversity } from '../controllers/universityController';
import { authenticate, authenticateSuperAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getUniversities);
router.post('/', authenticate, authenticateSuperAdmin, createUniversity);
router.delete('/:id', authenticate, authenticateSuperAdmin, deleteUniversity);

export default router;
