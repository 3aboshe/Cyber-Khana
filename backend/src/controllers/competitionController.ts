import { Response } from 'express';
import Competition from '../models/Competition';
import Challenge from '../models/Challenge';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const createCompetition = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can create competitions' });
    }

    const competition = new Competition({
      ...req.body,
      universityCode: req.user?.universityCode
    });

    await competition.save();
    res.status(201).json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error creating competition' });
  }
};

export const getCompetitions = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const competitions = await Competition.find({ universityCode });
    res.json(competitions);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competitions' });
  }
};

export const getCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { securityCode } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (securityCode !== competition.securityCode) {
      return res.status(401).json({ error: 'Invalid competition security code' });
    }

    const now = new Date();
    if (now < competition.startTime) {
      return res.status(400).json({ error: 'Competition has not started yet' });
    }

    if (now > competition.endTime) {
      return res.status(400).json({ error: 'Competition has ended' });
    }

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition' });
  }
};

export const getCompetitionDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check if user has access to this competition
    if (req.user?.role !== 'super-admin' && competition.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Calculate dynamic points for each challenge
    const { calculateDynamicScore } = require('../models/Challenge');
    const challengesWithDynamicPoints = competition.challenges.map((challenge: any) => {
      const dynamicPoints = calculateDynamicScore(
        challenge.initialPoints || 1000,
        challenge.minimumPoints || 100,
        challenge.decay || 200,
        challenge.solves
      );

      return {
        ...challenge.toObject ? challenge.toObject() : challenge,
        points: dynamicPoints,
        currentPoints: dynamicPoints
      };
    });

    const competitionWithDynamicPoints = {
      ...competition.toObject ? competition.toObject() : competition,
      challenges: challengesWithDynamicPoints
    };

    res.json(competitionWithDynamicPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition details' });
  }
};

export const getSolvedChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Check if user has access to this competition
    if (req.user?.role !== 'super-admin' && competition.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get the user whose solved challenges we want to fetch
    const user = await User.findById(userId as string);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get IDs of challenges in this competition
    const competitionChallengeIds = competition.challenges.map((c: any) => c._id.toString());

    // Filter user's solved challenges to only include those from this competition
    const solvedChallengeIds = user.solvedChallenges.filter((challengeId: string) =>
      competitionChallengeIds.includes(challengeId)
    );

    res.json(solvedChallengeIds);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching solved challenges' });
  }
};

export const updateCompetitionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (req.user?.role !== 'super-admin' && competition.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    competition.status = status;
    await competition.save();

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error updating competition status' });
  }
};

export const updateCompetitionStartTime = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, status } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (req.user?.role !== 'super-admin' && competition.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    competition.startTime = new Date(startTime);
    competition.endTime = new Date(endTime);
    competition.status = status;
    await competition.save();

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error updating competition start time' });
  }
};

export const submitCompetitionFlag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { challengeId, flag } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    const challengeIndex = competition.challenges.findIndex((c: any) => c._id.toString() === challengeId);
    const challenge = competition.challenges[challengeIndex];

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already solved this challenge
      if (user.solvedChallenges.includes(challengeId)) {
        return res.status(400).json({ error: 'Challenge already solved' });
      }

      // Check if flag is correct
      if (flag === challenge.flag) {
        // Calculate dynamic points
        const { calculateDynamicScore } = require('../models/Challenge');
        const awardedPoints = calculateDynamicScore(
          challenge.initialPoints || 1000,
          challenge.minimumPoints || 100,
          challenge.decay || 200,
          challenge.solves
        );

        let totalAwardedPoints = awardedPoints;

        // Add first blood bonus
        if (challenge.solves === 0) {
          totalAwardedPoints += 20;
        }

        // Update user's solved challenges
        user.solvedChallenges.push(challengeId);
        user.solvedChallengesDetails.push({
          challengeId,
          solvedAt: new Date(),
          points: totalAwardedPoints
        });
        user.points += totalAwardedPoints;
        await user.save();

        // Update challenge solve count in competition
        competition.challenges[challengeIndex].solves += 1;
        // Mark the challenges array as modified so Mongoose saves the nested document
        competition.markModified('challenges');
        await competition.save();

        res.json({
          success: true,
          points: totalAwardedPoints,
          basePoints: awardedPoints,
          firstBlood: challenge.solves === 0,
          message: 'Correct flag!'
        });
      } else {
        res.status(400).json({ error: 'Incorrect flag' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Error submitting flag' });
  }
};

export const addChallengeToCompetition = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { challengeId } = req.body;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (req.user?.role !== 'super-admin' && competition.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const challenge = await Challenge.findById(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const competitionChallenge = {
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      description: challenge.description,
      author: challenge.author,
      flag: challenge.flag,
      hints: challenge.hints || [],
      files: challenge.files || []
    };

    competition.challenges.push(competitionChallenge as any);
    await competition.save();

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: 'Error adding challenge to competition' });
  }
};

export const getCompetitionLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Get all users in the competition's university
    const users = await User.find({
      universityCode: competition.universityCode,
      isBanned: { $ne: true }
    }).select('username points solvedChallenges solvedChallengesDetails');

    // Filter users who have solved at least one competition challenge
    const leaderboard = users
      .filter((user: any) => {
        // Check if user has solved any competition challenge
        return user.solvedChallengesDetails?.some((solve: any) =>
          competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString())
        );
      })
      .map((user: any) => {
        // Calculate points from competition challenges
        const competitionPoints = user.solvedChallengesDetails
          ?.filter((solve: any) =>
            competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString())
          )
          .reduce((total: number, solve: any) => total + (solve.points || 0), 0) || 0;

        const competitionSolvedCount = user.solvedChallengesDetails
          ?.filter((solve: any) =>
            competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString())
          ).length || 0;

        return {
          _id: user._id,
          username: user.username,
          points: competitionPoints,
          solvedChallenges: competitionSolvedCount
        };
      })
      .sort((a: any, b: any) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return a.solvedChallenges - b.solvedChallenges;
      });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition leaderboard' });
  }
};

export const getCompetitionActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const competition = await Competition.findById(id);

    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    // Get all users in the competition's university
    const users = await User.find({
      universityCode: competition.universityCode,
      isBanned: { $ne: true }
    }).select('username solvedChallengesDetails');

    // Get recent activity (last 20 solves)
    const allActivity: any[] = [];

    users.forEach((user: any) => {
      user.solvedChallengesDetails
        ?.filter((solve: any) =>
          competition.challenges.some((c: any) => c._id?.toString() === solve.challengeId?.toString())
        )
        .forEach((solve: any) => {
          allActivity.push({
            username: user.username,
            challengeTitle: solve.challengeTitle || 'Unknown Challenge',
            timestamp: solve.solvedAt,
            points: solve.points || 0
          });
        });
    });

    // Sort by timestamp descending and take last 20
    allActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = allActivity.slice(0, 20);

    res.json(recentActivity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching competition activity' });
  }
};
