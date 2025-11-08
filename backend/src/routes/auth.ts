import express from 'express';
import { register, login, loginAdmin, loginSuperAdmin } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login-admin', loginAdmin);
router.post('/login-super-admin', loginSuperAdmin);

export default router;
