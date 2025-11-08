import { Response } from 'express';
import University from '../models/University';
import { AuthRequest } from '../middleware/auth';

export const getUniversities = async (req: AuthRequest, res: Response) => {
  try {
    const universities = await University.find().sort({ name: 1 });
    res.json(universities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching universities' });
  }
};
