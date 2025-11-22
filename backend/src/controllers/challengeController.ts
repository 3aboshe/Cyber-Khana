import { Response } from 'express';
import Challenge from '../models/Challenge';
import { calculateDynamicScore } from '../models/Challenge';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadWriteupPdf, uploadChallengeFiles } from '../utils/fileUpload';
import { applyRetroactiveDecay } from '../services/retroactiveDecayService';
import path from 'path';

export const getChallenges = async (req: AuthRequest, res: Response) => {
  try {
    let universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    // Ensure universityCode is uppercase for consistent querying
    if (universityCode) {
      universityCode = universityCode.toUpperCase();
    }

    const { includeUnpublished } = req.query;

    // If includeUnpublished is true, fetch all challenges (for admin)
    // Otherwise, only fetch published challenges (for users)
    const query = includeUnpublished === 'true'
      ? { universityCode }
      : { universityCode, isPublished: true };

    const challenges = await Challenge.find(query);

    const challengesWithCurrentPoints = challenges.map(challenge => {
      const challengeObj = challenge.toObject();
      challengeObj.currentPoints = calculateDynamicScore(
        challenge.initialPoints,
        challenge.minimumPoints,
        challenge.decay,
        challenge.solves
      );

      // If user is not admin and writeup is not unlocked, remove writeup data
      if (req.user?.role === 'user' && !challenge.writeup?.isUnlocked) {
        challengeObj.writeup = {
          content: '',
          images: [],
          isUnlocked: false
        };
      }

      return challengeObj;
    });

    res.json(challengesWithCurrentPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenges' });
  }
};

export const getAllChallenges = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can access all challenges' });
    }

    let universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    // Ensure universityCode is uppercase for consistent querying
    if (universityCode) {
      universityCode = universityCode.toUpperCase();
    }

    const challenges = await Challenge.find({ universityCode });

    const challengesWithCurrentPoints = challenges.map(challenge => {
      const challengeObj = challenge.toObject();
      // Provide defaults for challenges created before these fields were added
      const initialPoints = challenge.initialPoints || challenge.points || 1000;
      const minimumPoints = challenge.minimumPoints || 100;
      const decay = challenge.decay || 38;

      challengeObj.currentPoints = calculateDynamicScore(
        initialPoints,
        minimumPoints,
        decay,
        challenge.solves
      );
      return challengeObj;
    });

    res.json(challengesWithCurrentPoints);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching all challenges' });
  }
};

export const getChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Ensure case-insensitive comparison for universityCode
    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const challengeObj = challenge.toObject();
    // Provide defaults for challenges created before these fields were added
    const initialPoints = challenge.initialPoints || challenge.points || 1000;
    const minimumPoints = challenge.minimumPoints || 100;
    const decay = challenge.decay || 38;

    challengeObj.currentPoints = calculateDynamicScore(
      initialPoints,
      minimumPoints,
      decay,
      challenge.solves
    );

    // If user is not admin and writeup is not unlocked, remove writeup data
    if (req.user?.role === 'user' && !challenge.writeup?.isUnlocked) {
      challengeObj.writeup = {
        content: '',
        images: [],
        isUnlocked: false
      };
    }

    res.json(challengeObj);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenge' });
  }
};

export const createChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can create challenges' });
    }

    const challenge = new Challenge({
      ...req.body,
      universityCode: req.user?.universityCode
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error creating challenge' });
  }
};

export const updateChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If flag is empty, don't update it
    if (!req.body.flag) {
      const { flag, ...updateData } = req.body;
      Object.assign(challenge, updateData);
    } else {
      Object.assign(challenge, req.body);
    }

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error updating challenge' });
  }
};

export const deleteChallenge = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await challenge.deleteOne();
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting challenge' });
  }
};

export const submitFlag = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { flag } = req.body;

    // Basic validation for request body
    if (typeof flag !== 'string') {
      return res.status(400).json({ error: 'Flag must be provided as a string' });
    }

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if user belongs to the same university as the challenge
    const userUniversityCode = req.user?.universityCode?.toUpperCase();
    const challengeUniversityCode = challenge.universityCode?.toUpperCase();

    if (req.user?.role !== 'super-admin' && challengeUniversityCode !== userUniversityCode) {
      return res.status(403).json({
        error: 'Access denied. This challenge belongs to a different university.',
        expectedUniversity: challenge.universityCode,
        userUniversity: req.user?.universityCode
      });
    }

    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Convert IDs to strings for comparison
      const challengeIdStr = id.toString();
      const alreadySolved = user.solvedChallenges.some(
        (solvedId: any) => solvedId.toString() === challengeIdStr
      );

      if (alreadySolved) {
        return res.status(400).json({ error: 'Challenge already solved' });
      }

      // Normalize flags for comparison safely and more robustly
      const normalize = (s: string) =>
        s
          .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '') // remove zero-width chars
          .replace(/\s+/g, ' ') // collapse multiple spaces
          .trim()
          .normalize('NFKC'); // unicode normalization

      const normalizedSubmittedFlag = normalize(flag);
      const normalizedStoredFlag = normalize(String(challenge.flag || ''));

      // Debug logging for flag comparison
      console.log('Flag comparison debug:', {
        challengeId: id,
        challengeTitle: challenge.title,
        submittedFlag: JSON.stringify(normalizedSubmittedFlag),
        storedFlag: JSON.stringify(normalizedStoredFlag),
        submittedLength: normalizedSubmittedFlag.length,
        storedLength: normalizedStoredFlag.length,
        isEqual: normalizedSubmittedFlag === normalizedStoredFlag
      });

      if (normalizedSubmittedFlag === normalizedStoredFlag) {
        // Calculate points based on current solve count (before incrementing)
        const awardedPoints = calculateDynamicScore(
          challenge.initialPoints,
          challenge.minimumPoints,
          challenge.decay,
          challenge.solves
        );

        let totalAwardedPoints = awardedPoints;

        if (challenge.solves === 0) {
          totalAwardedPoints += 20;
        }

        // Update user
        user.solvedChallenges.push(challengeIdStr);
        user.solvedChallengesDetails.push({
          challengeId: challengeIdStr,
          solvedAt: new Date(),
          points: totalAwardedPoints
        });
        user.points += totalAwardedPoints;
        await user.save();

        // Update challenge
        challenge.solves += 1;
        await challenge.save();

        // Apply retroactive decay to update ALL solvers (including this new one)
        try {
          await applyRetroactiveDecay(challengeIdStr);
          console.log(`✓ Retroactive decay applied for challenge: ${challenge.title}`);
        } catch (error) {
          console.error('Failed to apply retroactive decay:', error);
          // Don't fail the request if retroactive decay fails
          // The points are still correct for the new solver
        }

        res.json({
          success: true,
          points: totalAwardedPoints,
          basePoints: awardedPoints,
          firstBlood: challenge.solves === 1,
          message: 'Correct flag! Points updated for all solvers.'
        });
      } else {
        res.status(400).json({
          error: 'Incorrect flag',
          debug: {
            submittedLength: normalizedSubmittedFlag.length,
            storedLength: normalizedStoredFlag.length,
            submittedPreview: normalizedSubmittedFlag.substring(0, 20) + (normalizedSubmittedFlag.length > 20 ? '...' : ''),
            storedPreview: normalizedStoredFlag.substring(0, 20) + (normalizedStoredFlag.length > 20 ? '...' : '')
          }
        });
      }
    }
  } catch (error) {
    console.error('Submit flag error:', error);
    res.status(500).json({ error: 'Error submitting flag' });
  }
};

export const copyChallengeToUniversity = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can copy challenges' });
    }

    const { id } = req.params;
    const { targetUniversityCode } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Create an independent copy of the challenge for the target university.
    // Do NOT publish it automatically and reset runtime fields like solves.
    const newChallenge = new Challenge({
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      description: challenge.description,
      author: challenge.author,
      flag: challenge.flag, // Ensure flag is copied
      hints: challenge.hints || [],
      files: challenge.files || [],
      challengeLink: challenge.challengeLink || '',
      difficulty: challenge.difficulty || 'Medium',
      estimatedTime: challenge.estimatedTime || 30,
      universityCode: targetUniversityCode.toUpperCase(),
      initialPoints: challenge.initialPoints,
      minimumPoints: challenge.minimumPoints,
      decay: challenge.decay,
      currentPoints: challenge.initialPoints || challenge.currentPoints || 1000,
      isPublished: false,
      solves: 0
    });

    await newChallenge.save();
    res.status(201).json(newChallenge);
  } catch (error) {
    res.status(500).json({ error: 'Error copying challenge' });
  }
};

export const integrateCompetitionChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can integrate challenges' });
    }

    const { competitionId, challengeId } = req.params;
    const Competition = require('../models/Competition').default;

    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    if (req.user?.role !== 'super-admin' && competition.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const competitionChallenge = competition.challenges.find((c: any) => c._id.toString() === challengeId);
    if (!competitionChallenge) {
      return res.status(404).json({ error: 'Challenge not found in competition' });
    }

    const newChallenge = new Challenge({
      title: competitionChallenge.title,
      category: competitionChallenge.category,
      points: competitionChallenge.points,
      description: competitionChallenge.description,
      author: competitionChallenge.author,
      flag: competitionChallenge.flag,
      hints: competitionChallenge.hints || [],
      files: competitionChallenge.files || [],
      universityCode: competition.universityCode,
      initialPoints: competitionChallenge.initialPoints || 1000,
      minimumPoints: competitionChallenge.minimumPoints || 100,
      decay: competitionChallenge.decay || 200,
      currentPoints: competitionChallenge.currentPoints || 1000,
      fromCompetition: true,
      competitionId: competitionId
    });

    await newChallenge.save();
    res.status(201).json(newChallenge);
  } catch (error) {
    res.status(500).json({ error: 'Error integrating challenge' });
  }
};

export const updateWriteup = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can update writeups' });
    }

    const { id } = req.params;
    const { content, images, isUnlocked, pdfFile } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    challenge.writeup = {
      content: content ?? challenge.writeup?.content ?? '',
      images: images ?? challenge.writeup?.images ?? [],
      isUnlocked: isUnlocked ?? challenge.writeup?.isUnlocked ?? false,
      pdfFile: pdfFile !== undefined ? pdfFile : challenge.writeup?.pdfFile
    };

    await challenge.save();
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error updating writeup' });
  }
};

export const publishChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can publish challenges' });
    }

    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    challenge.isPublished = true;
    await challenge.save();

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error publishing challenge' });
  }
};

export const unpublishChallenge = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can unpublish challenges' });
    }

    const { id } = req.params;
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    challenge.isPublished = false;
    await challenge.save();

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Error unpublishing challenge' });
  }
};

export const publishHint = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can publish hints' });
    }

    const { id } = req.params;
    const { hintIndex } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!challenge.hints || challenge.hints.length === 0) {
      return res.status(400).json({ error: 'No hints found for this challenge' });
    }

    if (hintIndex < 0 || hintIndex >= challenge.hints.length) {
      return res.status(400).json({ error: 'Invalid hint index' });
    }

    challenge.hints[hintIndex].isPublished = true;
    await challenge.save();

    res.json({ message: 'Hint published successfully', hints: challenge.hints });
  } catch (error) {
    res.status(500).json({ error: 'Error publishing hint' });
  }
};

export const uploadWriteupPdfController = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can upload writeup PDFs' });
    }

    uploadWriteupPdf.single('pdf')(req as any, res as any, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Construct absolute URL for better compatibility with HashRouter
      // Use fixed HTTPS URL without www for Cloudflare compatibility
      const fileUrl = `https://cyberkhana.tech/api/uploads/${req.file.filename}`;

      res.json({
        name: req.file.originalname,
        url: fileUrl,
        uploadedAt: new Date()
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading PDF' });
  }
};

export const uploadChallengeFilesController = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can upload challenge files' });
    }

    uploadChallengeFiles.array('files', 10)(req as any, res as any, async (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const files = (req.files as Express.Multer.File[]).map(file => {
        // Use fixed HTTPS URL without www for Cloudflare compatibility
        const fileUrl = `https://cyberkhana.tech/api/uploads/${file.filename}`;

        return {
          name: file.originalname,
          url: fileUrl
        };
      });

      res.json({ files });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading files' });
  }
};

export const applyRetroactiveDecayToAll = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow admins to trigger this
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can apply retroactive decay' });
    }

    const { universityCode } = req.query;
    const { applyRetroactiveDecayToAllChallenges } = require('../services/retroactiveDecayService');

    const result = await applyRetroactiveDecayToAllChallenges(universityCode as string);

    res.json({
      success: true,
      message: 'Retroactive decay applied to all challenges',
      ...result
    });
  } catch (error) {
    console.error('Error in applyRetroactiveDecayToAll:', error);
    res.status(500).json({
      error: 'Error applying retroactive decay',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const applyRetroactiveDecayToChallenge = async (req: AuthRequest, res: Response) => {
  try {
    // Only allow admins to trigger this
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can apply retroactive decay' });
    }

    const { id } = req.params;
    const result = await applyRetroactiveDecay(id);

    res.json({
      message: 'Retroactive decay applied to challenge',
      ...result
    });
  } catch (error) {
    console.error('Error in applyRetroactiveDecayToChallenge:', error);
    res.status(500).json({
      error: 'Error applying retroactive decay to challenge',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
