import { Response } from 'express';
import User from '../models/User';
import Challenge from '../models/Challenge';
import { AuthRequest } from '../middleware/auth';

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    if (!universityCode) {
      return res.status(400).json({ error: 'University code is required' });
    }

    // Get all users in the university
    const users = await User.find({ universityCode, isBanned: { $ne: true } })
      .select('username solvedChallengesDetails');

    // Get all challenges for the university
    const challenges = await Challenge.find({ universityCode })
      .select('title category points');

    // Create a map of challenge IDs to challenge details
    const challengeMap = new Map();
    challenges.forEach((challenge: any) => {
      challengeMap.set(challenge._id.toString(), {
        title: challenge.title,
        category: challenge.category,
        points: challenge.currentPoints || challenge.points
      });
    });

    // Get all solve activities
    const allActivity: any[] = [];

    users.forEach((user: any) => {
      user.solvedChallengesDetails.forEach((solve: any) => {
        const challengeDetails = challengeMap.get(solve.challengeId);
        if (challengeDetails) {
          allActivity.push({
            id: `${user.username}-${solve.challengeId}-${solve.solvedAt}`,
            username: user.username,
            challengeTitle: challengeDetails.title,
            category: challengeDetails.category,
            points: solve.points,
            solvedAt: solve.solvedAt
          });
        }
      });
    });

    // Sort by timestamp descending and take most recent 20
    allActivity.sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());
    const recentActivity = allActivity.slice(0, 20);

    res.json(recentActivity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activity' });
  }
};
