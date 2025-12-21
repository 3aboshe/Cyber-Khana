import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/auth';
import Announcement from '../models/Announcement';

// Helper to calculate general stats consistently
const calculateGeneralStats = (user: any, regularChallengeMap: Map<string, any>) => {
  // Filter solved challenges to exclude competition challenges
  const nonCompetitionSolvedDetails = (user.solvedChallengesDetails || []).filter((solve: any) => {
    return regularChallengeMap.has(solve.challengeId);
  });

  // Enrich solved details with challenge title and category from the map
  const enrichedSolvedDetails = nonCompetitionSolvedDetails.map((solve: any) => {
    const challenge = regularChallengeMap.get(solve.challengeId);
    return {
      _id: solve.challengeId,
      challengeId: solve.challengeId,
      title: challenge?.title || 'Unknown Challenge',
      category: challenge?.category || 'Unknown',
      points: solve.points || 0,
      solvedAt: solve.solvedAt ? new Date(solve.solvedAt).toISOString() : null
    };
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
    solvedCount: enrichedSolvedDetails.length,
    solvedDetails: enrichedSolvedDetails,
    penalties: generalPenalties,
    bonusPoints: user.bonusPoints || 0,
    hintCosts
  };
};

// Get public profile by user ID (for leaderboard profile views)
export const getPublicProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get university info
    const University = require('../models/University').default;
    const university = await University.findOne({ code: user.universityCode });

    // Fetch all regular challenges to calculate stats accurately
    const Challenge = require('../models/Challenge').default;
    const regularChallenges = await Challenge.find({
      universityCode: user.universityCode,
      fromCompetition: { $ne: true }
    });

    const regularChallengeMap = new Map();
    regularChallenges.forEach((c: any) => regularChallengeMap.set(c._id.toString(), c));

    // Calculate standardized stats
    const stats = calculateGeneralStats(user, regularChallengeMap);

    // Get competition points (kept separate)
    // We still need competition info for the "competitionSolvedCount" display if needed, 
    // but the request was specifically about "general points".
    // Let's keep the existing competition logic for "competitionSolvedDetails" just for display purposes
    // or we can rely on what's in the User model if we trust it, but let's be consistent.

    // Calculate rank among all users
    // To get ACCURATE rank, we technically need to calculate stats for ALL users, which is heavy. 
    // The previous implementation used user.points for ranking in `getPublicProfile` but calculated in `getLeaderboard`.
    // Let's stick to a simple DB sort for rank here to avoid perf issues, 
    // OR fetch all users and calculate. fetching all is safer for consistency.

    const allUsers = await User.find({
      universityCode: user.universityCode,
      isBanned: { $ne: true }
    }).select('points penalties solvedChallengesDetails unlockedHints bonusPoints'); // Need fields for calcs

    // We need to calculate points for everyone to get the true rank
    // optimized: maybe just fetch needed fields
    const allUsersStats = allUsers.map(u => ({
      id: (u as any)._id.toString(),
      points: calculateGeneralStats(u, regularChallengeMap).points
    })).sort((a, b) => b.points - a.points);

    const rank = allUsersStats.findIndex(u => u.id === userId) + 1;

    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      profileIcon: user.profileIcon,
      universityCode: user.universityCode,
      universityName: university?.name || user.universityCode,
      totalPoints: stats.points, // Standardized
      competitionPoints: user.competitionPoints,
      regularPoints: stats.points, // Standardized
      penaltyPoints: stats.penalties,
      rank,
      totalUsers: allUsers.length,
      totalSolved: user.solvedChallenges.length,
      regularSolvedCount: stats.solvedCount,
      // We pass the solved details sorted
      regularSolvedChallenges: stats.solvedDetails.sort((a: any, b: any) =>
        new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
      ),
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    // Get university name
    const University = require('../models/University').default;
    const university = universityCode ? await University.findOne({ code: universityCode }) : null;

    const query = universityCode ? { universityCode } : {};
    const users = await User.find(query).select('-password');

    // Fetch regular challenges for calculation
    const Challenge = require('../models/Challenge').default;
    const regularChallenges = await Challenge.find({
      // If no university code (super admin view all), we might need challenges from all? 
      // If retrieving users from all universities, we need challenges from all.
      ...(universityCode ? { universityCode } : {})
    });

    // Map with challenge ID is enough, uniqueness across universities is guaranteed by ID.
    const regularChallengeMap = new Map();
    regularChallenges.forEach((c: any) => regularChallengeMap.set(c._id.toString(), c));

    const usersWithStats = users.map(user => {
      // Use standardized calc
      const stats = calculateGeneralStats(user, regularChallengeMap);

      return {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName,
        points: stats.points, // Standardized
        role: user.role,
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode,
        isBanned: user.isBanned,
        profileIcon: user.profileIcon,
        solvedChallengesCount: user.solvedChallenges.length, // Total solved (incl competition)
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

    // Get university name
    const University = require('../models/University').default;
    const university = await University.findOne({ code: user.universityCode });

    // Fetch regular challenges
    const Challenge = require('../models/Challenge').default;
    const regularChallenges = await Challenge.find({
      universityCode: user.universityCode,
      fromCompetition: { $ne: true }
    });
    const regularChallengeMap = new Map();
    regularChallenges.forEach((c: any) => regularChallengeMap.set(c._id.toString(), c));

    // Standardized Stats
    const stats = calculateGeneralStats(user, regularChallengeMap);

    // Rank calculation
    const allUsers = await User.find({ universityCode: user.universityCode, isBanned: { $ne: true } })
      .select('username solvedChallengesDetails penalties unlockedHints bonusPoints');

    const allUsersStats = allUsers.map(u => ({
      id: (u as any)._id.toString(),
      points: calculateGeneralStats(u, regularChallengeMap).points
    })).sort((a, b) => b.points - a.points);

    const rank = allUsersStats.findIndex(u => u.id === (user as any)._id.toString()) + 1;

    res.json({
      ...user.toJSON(),
      points: stats.points, // Standardized
      penaltyPoints: stats.penalties,
      rank,
      totalUsers: allUsers.length,
      solvedChallengesCount: user.solvedChallenges.length,
      universityName: university?.name || user.universityCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const users = await User.find({ universityCode, isBanned: { $ne: true } })
      .select('username fullName displayName points solvedChallenges solvedChallengesDetails profileIcon universityCode penalties unlockedHints bonusPoints');

    // Get university name
    const University = require('../models/University').default;
    const university = await University.findOne({ code: universityCode });

    // Fetch all regular challenges
    const Challenge = require('../models/Challenge').default;
    const regularChallenges = await Challenge.find({
      universityCode,
      fromCompetition: { $ne: true }
    });

    const regularChallengeMap = new Map();
    regularChallenges.forEach((c: any) => {
      regularChallengeMap.set(c._id.toString(), c);
    });

    // Calculate stats for all users
    const usersWithStats = users.map((user: any) => {
      const stats = calculateGeneralStats(user, regularChallengeMap);

      return {
        ...user.toObject(),
        nonCompetitionPoints: stats.points,
        nonCompetitionSolvedCount: stats.solvedCount,
        nonCompetitionSolvedDetails: stats.solvedDetails,
        penaltyPoints: stats.penalties
      };
    });

    usersWithStats.sort((a, b) => {
      if (b.nonCompetitionPoints !== a.nonCompetitionPoints) {
        return b.nonCompetitionPoints - a.nonCompetitionPoints;
      }

      const aLastSolve = a.nonCompetitionSolvedDetails.length > 0
        ? new Date(Math.max(...a.nonCompetitionSolvedDetails.map((d: any) => new Date(d.solvedAt).getTime())))
        : null;

      const bLastSolve = b.nonCompetitionSolvedDetails.length > 0
        ? new Date(Math.max(...b.nonCompetitionSolvedDetails.map((d: any) => new Date(d.solvedAt).getTime())))
        : null;

      if (aLastSolve && bLastSolve) {
        return aLastSolve.getTime() - bLastSolve.getTime();
      } else if (aLastSolve) {
        return -1;
      } else if (bLastSolve) {
        return 1;
      }

      return 0;
    });

    // Get all published challenges count for the university
    const publishedChallengesCount = await Challenge.countDocuments({
      universityCode,
      isPublished: true,
      fromCompetition: { $ne: true } // Exclude competition challenges
    });

    // Return ALL users, not just top 10
    const allUsers = usersWithStats.map((user, index) => {
      const firstSolve = user.nonCompetitionSolvedDetails.length > 0
        ? new Date(Math.min(...user.nonCompetitionSolvedDetails.map((d: any) => new Date(d.solvedAt).getTime())))
        : null;

      const lastSolve = user.nonCompetitionSolvedDetails.length > 0
        ? new Date(Math.max(...user.nonCompetitionSolvedDetails.map((d: any) => new Date(d.solvedAt).getTime())))
        : null;

      const totalTime = firstSolve && lastSolve
        ? Math.floor((lastSolve.getTime() - firstSolve.getTime()) / 1000 / 60 / 60)
        : 0;

      const averageSolveTime = user.nonCompetitionSolvedDetails.length > 0 && firstSolve && lastSolve
        ? Math.floor(totalTime / user.nonCompetitionSolvedDetails.length)
        : 0;

      return {
        rank: index + 1,
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName || user.username,
        points: user.nonCompetitionPoints,
        solvedChallenges: user.nonCompetitionSolvedCount,
        solvedDetails: user.nonCompetitionSolvedDetails,
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
      totalParticipants: usersWithStats.length,
      totalPoints: usersWithStats.reduce((sum: number, u: any) => sum + u.nonCompetitionPoints, 0),
      averagePoints: usersWithStats.length > 0
        ? Math.floor(usersWithStats.reduce((sum: number, u: any) => sum + u.nonCompetitionPoints, 0) / usersWithStats.length)
        : 0,
      topSolver: allUsers[0] || null,
      fastestAverageSolver: allUsers.filter(u => u.averageSolveTimeHours > 0).sort((a, b) => a.averageSolveTimeHours - b.averageSolveTimeHours)[0] || null,
      totalChallenges: publishedChallengesCount
    };

    res.json({
      leaderboard: allUsers,
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

    // Validate fullName length (max 50 characters)
    if (fullName !== undefined) {
      if (fullName.length > 50) {
        return res.status(400).json({ error: 'Full name must be 50 characters or less' });
      }
      if (fullName.trim().length < 2 && fullName.trim().length > 0) {
        return res.status(400).json({ error: 'Full name must be at least 2 characters' });
      }
      user.fullName = fullName.trim();
    }

    // Validate displayName length (max 30 characters)
    if (displayName !== undefined) {
      if (displayName.length > 30) {
        return res.status(400).json({ error: 'Display name must be 30 characters or less' });
      }
      user.displayName = displayName.trim();
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

    await Announcement.create({
      title: 'Account Banned',
      content: 'Your account has been banned by an administrator.',
      author: req.user?.username || 'System',
      universityCode: targetUser.universityCode,
      targetUserId: targetUser._id,
      type: 'danger'
    });

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

    await Announcement.create({
      title: 'Account Unbanned',
      content: 'Your account has been reinstated by an administrator.',
      author: req.user?.username || 'System',
      universityCode: targetUser.universityCode,
      targetUserId: targetUser._id,
      type: 'success'
    });

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

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can delete users' });
    }

    const { userId } = req.params;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent super admin from deleting themselves
    if ((targetUser as any)._id.toString() === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
};

// Deduct points from a user (admin function)
export const deductPoints = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only admins can deduct points' });
    }

    const { userId } = req.params;
    const { points, reason, type, competitionId } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Points must be a positive number' });
    }

    if (!type || !['general', 'competition'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "general" or "competition"' });
    }

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is in the same university as admin (unless super-admin)
    if (req.user?.role === 'admin' && targetUser.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'You can only deduct points from users in your university' });
    }

    // Prevent deducting points from admins
    if (targetUser.role === 'admin') {
      return res.status(403).json({ error: 'Cannot deduct points from administrators' });
    }

    if (type === 'general') {
      // Deduct from general points
      const pointsToDeduct = Math.min(points, targetUser.points);
      targetUser.points = Math.max(0, targetUser.points - points);

      // Store the penalty record
      if (!targetUser.penalties) {
        targetUser.penalties = [];
      }
      targetUser.penalties.push({
        amount: pointsToDeduct,
        reason: reason || 'Points deduction by admin',
        type: 'general',
        adminId: req.user?.userId,
        createdAt: new Date()
      });

      await targetUser.save();

      await Announcement.create({
        title: 'Points Deducted',
        content: `You have been deducted ${pointsToDeduct} points from the General Leaderboard. Reason: ${reason || 'Manual penalty'}`,
        author: req.user?.username || 'System',
        universityCode: targetUser.universityCode,
        targetUserId: targetUser._id,
        type: 'warning'
      });

      res.json({
        message: `Successfully deducted ${pointsToDeduct} points from general leaderboard`,
        newPoints: targetUser.points,
        deductedPoints: pointsToDeduct
      });
    } else if (type === 'competition') {
      if (!competitionId) {
        return res.status(400).json({ error: 'Competition ID is required for competition point deduction' });
      }

      // Get the competition
      const Competition = require('../models/Competition').default;
      const competition = await Competition.findById(competitionId);

      if (!competition) {
        return res.status(404).json({ error: 'Competition not found' });
      }

      // Verify competition belongs to same university
      if (req.user?.role === 'admin' && competition.universityCode !== req.user?.universityCode) {
        return res.status(403).json({ error: 'You can only manage competitions in your university' });
      }

      // Find user's solves in this competition and deduct points
      const competitionChallengeIds = competition.challenges.map((c: any) => c._id.toString());

      // Get integrated challenges for this competition
      const Challenge = require('../models/Challenge').default;
      const integratedChallenges = await Challenge.find({
        fromCompetition: true,
        competitionId: competitionId
      });
      const integratedChallengeIds = integratedChallenges.map((c: any) => c._id.toString());

      // Calculate current competition points for this user
      const competitionSolves = (targetUser.solvedChallengesDetails || []).filter((solve: any) =>
        competitionChallengeIds.includes(solve.challengeId) ||
        integratedChallengeIds.includes(solve.challengeId)
      );

      const currentCompPoints = competitionSolves.reduce((total: number, solve: any) => total + (solve.points || 0), 0);

      // Store the penalty in user's record
      if (!targetUser.competitionPenalties) {
        targetUser.competitionPenalties = [];
      }

      targetUser.competitionPenalties.push({
        competitionId: competitionId,
        amount: points,
        reason: reason || 'Points deduction by admin',
        adminId: req.user?.userId,
        createdAt: new Date()
      });

      await targetUser.save();

      await Announcement.create({
        title: 'Points Deducted',
        content: `You have been deducted ${points} points from competition "${competition.name}". Reason: ${reason || 'Manual penalty'}`,
        author: req.user?.username || 'System',
        universityCode: targetUser.universityCode,
        targetUserId: targetUser._id,
        competitionId: competitionId,
        type: 'warning'
      });

      res.json({
        message: `Successfully deducted ${points} points from competition "${competition.name}"`,
        competitionName: competition.name,
        deductedPoints: points,
        previousCompetitionPoints: currentCompPoints,
        newCompetitionPoints: Math.max(0, currentCompPoints - points)
      });
    }
  } catch (error) {
    console.error('Error deducting points:', error);
    res.status(500).json({ error: 'Error deducting points' });
  }
};

// Get user penalties
export const getUserPenalties = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('penalties competitionPenalties username fullName');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify admin access
    if (req.user?.role === 'admin') {
      const targetUser = await User.findById(userId);
      if (targetUser?.universityCode !== req.user?.universityCode) {
        return res.status(403).json({ error: 'You can only view penalties for users in your university' });
      }
    }

    res.json({
      penalties: user.penalties || [],
      competitionPenalties: user.competitionPenalties || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user penalties' });
  }
};

// Add points to a user (SUPER ADMIN ONLY)
export const addPoints = async (req: AuthRequest, res: Response) => {
  try {
    // Strictly restrict to Super Admin
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can add manual points' });
    }

    const { userId } = req.params;
    const { points, reason, type = 'general', competitionId } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: 'Points must be a positive number' });
    }

    if (!['general', 'competition'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "general" or "competition"' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (type === 'general') {
      // Update general bonus points
      targetUser.bonusPoints = (targetUser.bonusPoints || 0) + points;
      // Also update main points
      targetUser.points = (targetUser.points || 0) + points;

      await targetUser.save();

      await Announcement.create({
        title: 'Bonus Points Awarded',
        content: `You have received ${points} bonus points. Reason: ${reason || 'Manual adjustment'}`,
        author: req.user?.username || 'System',
        universityCode: targetUser.universityCode,
        targetUserId: targetUser._id,
        type: 'success'
      });

      res.json({
        message: `Successfully added ${points} bonus points`,
        newPoints: targetUser.points,
        totalBonusPoints: targetUser.bonusPoints,
        reason: reason || 'Manual adjustment'
      });
    } else {
      // Competition points
      if (!competitionId) {
        return res.status(400).json({ error: 'Competition ID is required for competition points' });
      }

      const Competition = require('../models/Competition').default;
      const competition = await Competition.findById(competitionId);
      if (!competition) {
        return res.status(404).json({ error: 'Competition not found' });
      }

      // Add to competition bonus points array
      if (!targetUser.competitionBonusPoints) {
        targetUser.competitionBonusPoints = [];
      }

      targetUser.competitionBonusPoints.push({
        competitionId,
        amount: points,
        reason: reason || 'Bonus points awarded by admin',
        adminId: req.user.userId,
        createdAt: new Date()
      });

      // Update cached competition points
      targetUser.competitionPoints = (targetUser.competitionPoints || 0) + points;

      await targetUser.save();

      await Announcement.create({
        title: 'Bonus Points Awarded',
        content: `You have received ${points} bonus points in competition "${competition.name}". Reason: ${reason || 'Bonus points awarded by admin'}`,
        author: req.user?.username || 'System',
        universityCode: targetUser.universityCode,
        targetUserId: targetUser._id,
        competitionId: competitionId,
        type: 'success'
      });

      res.json({
        message: `Successfully added ${points} bonus points to competition "${competition.name}"`,
        newCompetitionPoints: targetUser.competitionPoints,
        competitionName: competition.name,
        reason: reason || 'Manual adjustment'
      });
    }
  } catch (error) {
    console.error('Error adding points:', error);
    res.status(500).json({ error: 'Error adding points' });
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

    // Import Challenge model to check if it's from a competition
    const Challenge = require('../models/Challenge').default;
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if challenge came from a competition
    const isFromCompetition = challenge.fromCompetition;

    // Check if user has enough points (either regular or competition points)
    const availablePoints = isFromCompetition ? user.competitionPoints : user.points;
    if (availablePoints < cost) {
      return res.status(400).json({
        error: isFromCompetition
          ? 'Not enough competition points to purchase this hint'
          : 'Not enough points to purchase this hint'
      });
    }

    // Check if hint is already unlocked
    const hintId = `${challengeId}-${hintIndex}`;
    if (user.unlockedHints.includes(hintId)) {
      return res.status(400).json({ error: 'Hint already unlocked' });
    }

    // Deduct points from the appropriate balance
    if (isFromCompetition) {
      user.competitionPoints -= cost;
    } else {
      user.points -= cost;
    }

    // Add hint to unlocked hints
    user.unlockedHints.push(hintId);

    await user.save();

    // Get the actual hint text to return to the user
    const hintText = challenge.hints && challenge.hints[hintIndex]
      ? challenge.hints[hintIndex].text
      : '';

    res.json({
      message: 'Hint purchased successfully',
      remainingPoints: isFromCompetition ? user.competitionPoints : user.points,
      pointsType: isFromCompetition ? 'competition' : 'regular',
      unlockedHint: hintId,
      hintText: hintText
    });
  } catch (error) {
    res.status(500).json({ error: 'Error purchasing hint' });
  }
};
