import { Response } from 'express';
import Challenge from '../models/Challenge';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { uploadWriteupPdf } from '../utils/fileUpload';
import path from 'path';

export const getChallenges = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const { includeUnpublished } = req.query;

    // If includeUnpublished is true, fetch all challenges (for admin)
    // Otherwise, only fetch published challenges (for users)
    const query = includeUnpublished === 'true'
      ? { universityCode }
      : { universityCode, isPublished: true };

    const challenges = await Challenge.find(query);
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching challenges' });
  }
};

export const getAllChallenges = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can access all challenges' });
    }

    const universityCode = req.user?.role === 'super-admin'
      ? req.query.universityCode as string
      : req.user?.universityCode;

    const challenges = await Challenge.find({ universityCode });
    res.json(challenges);
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

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(challenge);
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

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(challenge, req.body);
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

    if (req.user?.role !== 'super-admin' && challenge.universityCode !== req.user?.universityCode) {
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

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.user?.role === 'user') {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.solvedChallenges.includes(id)) {
        return res.status(400).json({ error: 'Challenge already solved' });
      }

      if (flag === challenge.flag) {
        user.solvedChallenges.push(id);
        user.solvedChallengesDetails.push({
          challengeId: id,
          solvedAt: new Date(),
          points: challenge.points
        });
        user.points += challenge.points;
        await user.save();

        challenge.solves += 1;
        await challenge.save();

        res.json({ success: true, points: challenge.points, message: 'Correct flag!' });
      } else {
        res.status(400).json({ error: 'Incorrect flag' });
      }
    }
  } catch (error) {
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

    const newChallenge = new Challenge({
      title: challenge.title,
      category: challenge.category,
      points: challenge.points,
      description: challenge.description,
      author: challenge.author,
      flag: challenge.flag,
      hints: challenge.hints || [],
      files: challenge.files || [],
      universityCode: targetUniversityCode.toUpperCase()
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
      universityCode: competition.universityCode
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
      content: content || '',
      images: images || [],
      isUnlocked: isUnlocked || false,
      pdfFile: pdfFile || undefined
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

export const uploadWriteupPdfController = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can upload writeup PDFs' });
    }

    uploadWriteupPdf.single('pdf')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

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
