import { Response } from 'express';
import University from '../models/University';
import User from '../models/User';
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

export const deleteUniversity = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'super-admin') {
      return res.status(403).json({ error: 'Only super admin can delete universities' });
    }

    const { id } = req.params;

    const university = await University.findById(id);
    if (!university) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Check if there are any users in this university
    const userCount = await User.countDocuments({ universityCode: university.code });
    if (userCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete university with existing users. Please remove all users first.'
      });
    }

    await university.deleteOne();

    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting university' });
  }
};
