import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import SuperAdmin from '../models/SuperAdmin';
import University from '../models/University';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
import { IJWTPayload } from '../types';

// Helper to calculate general stats consistently
// Note: This logic duplicates userController.ts to ensure consistency on login
// ideally this should be a shared utility, but for now we duplicate to avoid major refactors
const calculateGeneralStats = (user: any, regularChallengeMap: Map<string, any>) => {
  // Filter solved challenges to exclude competition challenges
  const nonCompetitionSolvedDetails = (user.solvedChallengesDetails || []).filter((solve: any) => {
    return regularChallengeMap.has(solve.challengeId);
  });

  // Calculate points from non-competition challenges only
  const solvePoints = nonCompetitionSolvedDetails.reduce((total: number, solve: any) => {
    return total + (solve.points || 0);
  }, 0);

  // Deduct penalties for general leaderboard
  const generalPenalties = (user.penalties || [])
    .filter((penalty: any) => penalty.type === 'general')
    .reduce((total: number, penalty: any) => total + (penalty.amount || 0), 0);

  // Deduct costs of unlocked hints for regular challenges
  const hintCosts = (user.unlockedHints || []).reduce((total: number, hintId: string) => {
    // Regular hints are stored as "challengeId-hintIndex"
    const parts = hintId.split('-');
    if (parts.length === 2) {
      const [cId, hIndexStr] = parts;
      const challenge = regularChallengeMap.get(cId);

      if (challenge && challenge.hints) {
        const hIndex = parseInt(hIndexStr, 10);
        if (challenge.hints[hIndex]) {
          return total + (challenge.hints[hIndex].cost || 0);
        }
      }
    }
    return total;
  }, 0);

  // Add bonus points and deduct penalties/hints
  const finalPoints = Math.max(0, solvePoints + (user.bonusPoints || 0) - generalPenalties - hintCosts);

  return {
    points: finalPoints,
    solvePoints,
    solvedCount: nonCompetitionSolvedDetails.length,
    penalties: generalPenalties,
    bonusPoints: user.bonusPoints || 0,
    hintCosts
  };
};

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
      universityCode: user.universityCode,
      unlockedHints: user.unlockedHints || []
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

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
        points: user.bonusPoints || 0 // New users start with 0 (or bonus if set somehow)
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

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

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
      universityCode: user.universityCode,
      unlockedHints: user.unlockedHints || []
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Get university name
    const university = await University.findOne({ code: user.universityCode });

    // Calculate dynamic points (Standardized)
    const Challenge = require('../models/Challenge').default;
    const regularChallenges = await Challenge.find({
      universityCode: user.universityCode,
      fromCompetition: { $ne: true }
    });

    // Create map for helper
    const regularChallengeMap = new Map();
    regularChallenges.forEach((c: any) => regularChallengeMap.set(c._id.toString(), c));

    // Calculate stats
    const stats = calculateGeneralStats(user, regularChallengeMap);

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
        points: stats.points
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
      universityCode: user.universityCode,
      unlockedHints: user.unlockedHints || []
    };

    const token = generateToken(payload);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

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

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

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
