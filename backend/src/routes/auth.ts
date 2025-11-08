import express from 'express';
import {
  register,
  login,
  loginAdmin,
  loginSuperAdmin,
  registerValidation,
  loginValidation
} from '../controllers/authController';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/login-admin', loginValidation, loginAdmin);
router.post('/login-super-admin', loginValidation, loginSuperAdmin);

export default router;
