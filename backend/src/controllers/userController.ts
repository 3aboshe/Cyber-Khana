import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/auth';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const query = universityCode ? { universityCode } : {};
    const users = await User.find(query).select('-password');

    const usersWithStats = users.map(user => {
      const rank = 1;
      return {
        _id: user._id,
        username: user.username,
        points: user.points,
        role: user.role,
        universityCode: user.universityCode,
        isBanned: user.isBanned,
        profileIcon: user.profileIcon,
        solvedChallengesCount: user.solvedChallenges.length,
        createdAt: user.createdAt
      };
    });

    res.json(usersWithStats);
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

    const allUsers = await User.find({ universityCode: user.universityCode, isBanned: { $ne: true } })
      .select('points')
      .sort({ points: -1 });

    const rank = allUsers.findIndex(u => (u as any)._id.toString() === (user as any)._id.toString()) + 1;

    res.json({
      ...user.toJSON(),
      rank,
      totalUsers: allUsers.length,
      solvedChallengesCount: user.solvedChallenges.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const users = await User.find({ universityCode, isBanned: { $ne: true } })
      .select('username fullName displayName points solvedChallenges solvedChallengesDetails profileIcon universityCode');

    // Get university name
    const University = require('../models/University').default;
    const university = await University.findOne({ code: universityCode });

    users.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      const aFirstSolve = a.solvedChallengesDetails.length > 0
        ? new Date(Math.min(...a.solvedChallengesDetails.map(d => new Date(d.solvedAt).getTime())))
        : null;

      const bFirstSolve = b.solvedChallengesDetails.length > 0
        ? new Date(Math.min(...b.solvedChallengesDetails.map(d => new Date(d.solvedAt).getTime())))
        : null;

      if (aFirstSolve && bFirstSolve) {
        return aFirstSolve.getTime() - bFirstSolve.getTime();
      } else if (aFirstSolve) {
        return -1;
      } else if (bFirstSolve) {
        return 1;
      }

      return 0;
    });

    const topUsers = users.slice(0, 10).map((user, index) => {
      const firstSolve = user.solvedChallengesDetails.length > 0
        ? new Date(Math.min(...user.solvedChallengesDetails.map(d => new Date(d.solvedAt).getTime())))
        : null;

      const lastSolve = user.solvedChallengesDetails.length > 0
        ? new Date(Math.max(...user.solvedChallengesDetails.map(d => new Date(d.solvedAt).getTime())))
        : null;

      const totalTime = firstSolve && lastSolve
        ? Math.floor((lastSolve.getTime() - firstSolve.getTime()) / 1000 / 60 / 60)
        : 0;

      const averageSolveTime = user.solvedChallengesDetails.length > 0 && firstSolve && lastSolve
        ? Math.floor(totalTime / user.solvedChallengesDetails.length)
        : 0;

      return {
        rank: index + 1,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        points: user.points,
        solvedChallenges: user.solvedChallenges.length,
        solvedDetails: user.solvedChallengesDetails,
        firstSolveTime: firstSolve,
        lastSolveTime: lastSolve,
        totalTimeHours: totalTime,
        averageSolveTimeHours: averageSolveTime,
        profileIcon: user.profileIcon || 'default',
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode
      };
    });

    const analysis = {
      totalParticipants: users.length,
      totalPoints: users.reduce((sum, u) => sum + u.points, 0),
      averagePoints: users.length > 0 ? Math.floor(users.reduce((sum, u) => sum + u.points, 0) / users.length) : 0,
      topSolver: topUsers[0] || null,
      fastestAverageSolver: topUsers.filter(u => u.averageSolveTimeHours > 0).sort((a, b) => a.averageSolveTimeHours - b.averageSolveTimeHours)[0] || null
    };

    res.json({
      leaderboard: topUsers,
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, fullName } = req.body;

    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (displayName !== undefined) {
      user.displayName = displayName;
    }
    if (fullName !== undefined) {
      user.fullName = fullName;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      displayName: user.displayName,
      fullName: user.fullName
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
};

export const updateProfileIcon = async (req: AuthRequest, res: Response) => {
  try {
    const { icon } = req.body;

    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.profileIcon = icon;
    await user.save();

    res.json({ message: 'Profile icon updated', profileIcon: icon });
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile icon' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user?.role === 'admin' && targetUser.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    targetUser.isBanned = true;
    await targetUser.save();

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error banning user' });
  }
};

export const unbanUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user?.role === 'admin' && targetUser.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    targetUser.isBanned = false;
    await targetUser.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error unbanning user' });
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

    const hashedPassword = await hashPassword(password);

    const user = new User({
      username,
      password: hashedPassword,
      role: 'admin',
      universityCode: universityCode.toUpperCase()
    });

    await user.save();

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error creating admin' });
  }
};

export const promoteToAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can promote users to admin' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error promoting user to admin' });
  }
};

export const demoteFromAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can demote users from admin' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ error: 'User is not an admin' });
    }

    user.role = 'user';
    await user.save();

    res.json({ message: 'User demoted to user successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error demoting user from admin' });
  }
};

export const changeUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can change user passwords' });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error changing user password' });
  }
};

export const purchaseHint = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'user') {
      return res.status(403).json({ error: 'Only users can purchase hints' });
    }

    const { challengeId, hintIndex, cost } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has enough points
    if (user.points < cost) {
      return res.status(400).json({ error: 'Not enough points to purchase this hint' });
    }

    // Check if hint is already unlocked
    const hintId = `${challengeId}-${hintIndex}`;
    if (user.unlockedHints.includes(hintId)) {
      return res.status(400).json({ error: 'Hint already unlocked' });
    }

    // Deduct points
    user.points -= cost;

    // Add hint to unlocked hints
    user.unlockedHints.push(hintId);

    await user.save();

    res.json({
      message: 'Hint purchased successfully',
      remainingPoints: user.points,
      unlockedHint: hintId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error purchasing hint' });
  }
};
