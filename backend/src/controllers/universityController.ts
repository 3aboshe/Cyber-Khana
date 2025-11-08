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

export const createUniversity = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can create universities' });
    }

    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const universityCode = code.toUpperCase();

    const existingUniversity = await University.findOne({
      $or: [
        { name: name },
        { code: universityCode }
      ]
    });

    if (existingUniversity) {
      return res.status(400).json({
        error: existingUniversity.name === name
          ? 'University with this name already exists'
          : 'University code already exists'
      });
    }

    const university = new University({
      name,
      code: universityCode
    });

    await university.save();

    res.status(201).json({
      message: 'University created successfully',
      university
    });
  } catch (error) {
    res.status(500).json({ error: 'Error creating university' });
  }
};
