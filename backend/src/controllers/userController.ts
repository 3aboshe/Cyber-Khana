import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { hashPassword } from '../utils/auth';

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

    // Get competitions for this university
    const Competition = require('../models/Competition').default;
    const competitions = await Competition.find({ universityCode: user.universityCode });

    // Get competition challenge IDs
    const competitionChallengeIds = new Set<string>();
    competitions.forEach((comp: any) => {
      comp.challenges.forEach((challenge: any) => {
        competitionChallengeIds.add(challenge._id.toString());
      });
    });

    // Get integrated challenges
    const Challenge = require('../models/Challenge').default;
    const integratedChallenges = await Challenge.find({
      universityCode: user.universityCode,
      fromCompetition: true
    });
    const integratedChallengeIds = new Set<string>();
    integratedChallenges.forEach((challenge: any) => {
      integratedChallengeIds.add(challenge._id.toString());
    });

    // Separate solved challenges into regular and competition
    const regularSolvedDetails: any[] = [];
    const competitionSolvedDetails: any[] = [];

    for (const solve of user.solvedChallengesDetails || []) {
      const isCompetitionChallenge = competitionChallengeIds.has(solve.challengeId) || 
                                     integratedChallengeIds.has(solve.challengeId);
      
      // Try to get challenge info
      let challengeInfo = null;
      
      // First check in regular challenges
      const regularChallenge = await Challenge.findById(solve.challengeId);
      if (regularChallenge) {
        challengeInfo = {
          _id: regularChallenge._id,
          title: regularChallenge.title,
          category: regularChallenge.category,
          points: solve.points,
          solvedAt: solve.solvedAt
        };
      } else {
        // Check in competition challenges
        for (const comp of competitions) {
          const compChallenge = comp.challenges.find((c: any) => c._id.toString() === solve.challengeId);
          if (compChallenge) {
            challengeInfo = {
              _id: compChallenge._id,
              title: compChallenge.title,
              category: compChallenge.category,
              points: solve.points,
              solvedAt: solve.solvedAt,
              competitionName: comp.name
            };
            break;
          }
        }
      }

      if (challengeInfo) {
        if (isCompetitionChallenge) {
          competitionSolvedDetails.push(challengeInfo);
        } else {
          regularSolvedDetails.push(challengeInfo);
        }
      }
    }

    // Calculate rank among all users
    const allUsers = await User.find({ 
      universityCode: user.universityCode, 
      isBanned: { $ne: true } 
    }).select('points').sort({ points: -1 });
    const rank = allUsers.findIndex(u => (u as any)._id.toString() === userId) + 1;

    // Calculate non-competition points for accurate ranking
    const nonCompetitionPoints = regularSolvedDetails.reduce((sum, s) => sum + (s.points || 0), 0);

    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      displayName: user.displayName,
      profileIcon: user.profileIcon,
      universityCode: user.universityCode,
      universityName: university?.name || user.universityCode,
      totalPoints: user.points,
      competitionPoints: user.competitionPoints,
      regularPoints: nonCompetitionPoints,
      rank,
      totalUsers: allUsers.length,
      totalSolved: user.solvedChallenges.length,
      regularSolvedCount: regularSolvedDetails.length,
      competitionSolvedCount: competitionSolvedDetails.length,
      regularSolvedChallenges: regularSolvedDetails.sort((a, b) => 
        new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
      ),
      competitionSolvedChallenges: competitionSolvedDetails.sort((a, b) => 
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

    const usersWithStats = users.map(user => {
      const rank = 1;
      return {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        displayName: user.displayName,
        points: user.points,
        role: user.role,
        universityCode: user.universityCode,
        universityName: university?.name || user.universityCode,
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

    // Get university name
    const University = require('../models/University').default;
    const university = await University.findOne({ code: user.universityCode });

    const allUsers = await User.find({ universityCode: user.universityCode, isBanned: { $ne: true } })
      .select('points')
      .sort({ points: -1 });

    const rank = allUsers.findIndex(u => (u as any)._id.toString() === (user as any)._id.toString()) + 1;

    res.json({
      ...user.toJSON(),
      rank,
      totalUsers: allUsers.length,
      solvedChallengesCount: user.solvedChallenges.length,
      universityName: university?.name || user.universityCode
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
      .select('username fullName displayName points solvedChallenges solvedChallengesDetails profileIcon universityCode penalties');

    // Get university name
    const University = require('../models/University').default;
    const university = await University.findOne({ code: universityCode });

    // Get all competitions in the university to identify competition challenges
    const Competition = require('../models/Competition').default;
    const competitions = await Competition.find({ universityCode });

    // Get all competition challenge IDs
    const competitionChallengeIds = new Set<string>();
    competitions.forEach((comp: any) => {
      comp.challenges.forEach((challenge: any) => {
        competitionChallengeIds.add(challenge._id.toString());
      });
    });

    // Get all integrated challenges (from competitions)
    const Challenge = require('../models/Challenge').default;
    const integratedChallenges = await Challenge.find({
      universityCode,
      fromCompetition: true
    });
    const integratedChallengeIds = new Set<string>();
    integratedChallenges.forEach((challenge: any) => {
      integratedChallengeIds.add(challenge._id.toString());
    });

    // Filter out competition challenges from user stats
    const usersWithNonCompetitionStats = users.map((user: any) => {
      // Filter solved challenges to exclude competition challenges
      const nonCompetitionSolvedDetails = user.solvedChallengesDetails.filter((solve: any) => {
        return !competitionChallengeIds.has(solve.challengeId) && !integratedChallengeIds.has(solve.challengeId);
      });

      // Calculate points from non-competition challenges only
      let nonCompetitionPoints = nonCompetitionSolvedDetails.reduce((total: number, solve: any) => {
        return total + (solve.points || 0);
      }, 0);

      // Deduct penalties for general leaderboard
      const generalPenalties = (user.penalties || [])
        .filter((penalty: any) => penalty.type === 'general')
        .reduce((total: number, penalty: any) => total + (penalty.amount || 0), 0);
      
      nonCompetitionPoints = Math.max(0, nonCompetitionPoints - generalPenalties);

      // Calculate solve count for non-competition challenges
      const nonCompetitionSolvedCount = nonCompetitionSolvedDetails.length;

      return {
        ...user.toObject(),
        nonCompetitionPoints,
        nonCompetitionSolvedCount,
        nonCompetitionSolvedDetails,
        penaltyPoints: generalPenalties
      };
    });

    usersWithNonCompetitionStats.sort((a, b) => {
      if (b.nonCompetitionPoints !== a.nonCompetitionPoints) {
        return b.nonCompetitionPoints - a.nonCompetitionPoints;
      }

      const aFirstSolve = a.nonCompetitionSolvedDetails.length > 0
        ? new Date(Math.min(...a.nonCompetitionSolvedDetails.map((d: any) => new Date(d.solvedAt).getTime())))
        : null;

      const bFirstSolve = b.nonCompetitionSolvedDetails.length > 0
        ? new Date(Math.min(...b.nonCompetitionSolvedDetails.map((d: any) => new Date(d.solvedAt).getTime())))
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

    // Get all published challenges count for the university
    const ChallengeModel = require('../models/Challenge').default;
    const publishedChallengesCount = await ChallengeModel.countDocuments({ 
      universityCode, 
      isPublished: true,
      fromCompetition: { $ne: true } // Exclude competition challenges
    });

    // Return ALL users, not just top 10
    const allUsers = usersWithNonCompetitionStats.map((user, index) => {
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
      totalParticipants: usersWithNonCompetitionStats.length,
      totalPoints: usersWithNonCompetitionStats.reduce((sum: number, u: any) => sum + u.nonCompetitionPoints, 0),
      averagePoints: usersWithNonCompetitionStats.length > 0
        ? Math.floor(usersWithNonCompetitionStats.reduce((sum: number, u: any) => sum + u.nonCompetitionPoints, 0) / usersWithNonCompetitionStats.length)
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

    res.json({
      message: 'Hint purchased successfully',
      remainingPoints: isFromCompetition ? user.competitionPoints : user.points,
      pointsType: isFromCompetition ? 'competition' : 'regular',
      unlockedHint: hintId
    });
  } catch (error) {
    res.status(500).json({ error: 'Error purchasing hint' });
  }
};
