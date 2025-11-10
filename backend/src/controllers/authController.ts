import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import SuperAdmin from '../models/SuperAdmin';
import University from '../models/University';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import { IJWTPayload } from '../types';

// Validation rules
export const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('universityCode').trim().isLength({ min: 2, max: 10 }).withMessage('University code must be 2-10 characters')
    .matches(/^[A-Z0-9@_-]+$/).withMessage('University code must be alphanumeric uppercase or special characters (@, _, -)')
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const register = async (req: Request, res: Response) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, fullName, password, universityCode } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const university = await University.findOne({ code: universityCode.toUpperCase() });
    if (!university) {
      return res.status(400).json({ error: 'Invalid university code' });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      username,
      fullName,
      password: hashedPassword,
      universityCode: universityCode.toUpperCase(),
      role: 'user'
    });

    await user.save();

    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      universityCode: user.universityCode
    };

    const token = generateToken(payload);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university.name,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ username });
    if (superAdmin) {
      const isMatch = await comparePassword(password, superAdmin.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const payload: IJWTPayload = {
        userId: (superAdmin._id as any).toString(),
        username: superAdmin.username,
        role: 'super-admin',
        universityCode: 'SUPER'
      };

      const token = generateToken(payload);

      return res.json({
        token,
        user: {
          id: superAdmin._id,
          username: superAdmin.username,
          role: 'super-admin'
        }
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      universityCode: user.universityCode
    };

    const token = generateToken(payload);

    // Get university name
    const university = await University.findOne({ code: user.universityCode });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, universityCode } = req.body;

    const user = await User.findOne({ username, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    if (user.universityCode !== universityCode.toUpperCase()) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const payload: IJWTPayload = {
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
      universityCode: user.universityCode
    };

    const token = generateToken(payload);

    // Get university name
    const university = await University.findOne({ code: user.universityCode });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin login' });
  }
};

export const loginSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ username });
    if (!superAdmin) {
      return res.status(401).json({ error: 'Invalid super admin credentials' });
    }

    const isMatch = await comparePassword(password, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid super admin credentials' });
    }

    const payload: IJWTPayload = {
      userId: (superAdmin._id as any).toString(),
      username: superAdmin.username,
      role: 'super-admin',
      universityCode: 'SUPER'
    };

    const token = generateToken(payload);

    res.json({
      token,
      user: {
        id: superAdmin._id,
        username: superAdmin.username,
        role: 'super-admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during super admin login' });
  }
};
