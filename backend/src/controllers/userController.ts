import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const users = await User.find({ universityCode }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const users = await User.find({ universityCode })
      .select('username points solvedChallenges')
      .sort({ points: -1 });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      points: user.points,
      solvedChallenges: user.solvedChallenges.length
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
};

export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, universityCode } = req.body;

    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can create admins' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({
      username,
      password,
      role: 'admin',
      universityCode: universityCode.toUpperCase()
    });

    await user.save();

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating admin' });
  }
};
