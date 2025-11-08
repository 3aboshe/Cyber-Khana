import { Response } from 'express';
import Announcement from '../models/Announcement';
import { AuthRequest } from '../middleware/auth';

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const universityCode = req.user?.universityCode;

    const announcements = await Announcement.find({ universityCode })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Error fetching announcements' });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can create announcements' });
    }

    const { title, content } = req.body;
    const universityCode = req.user?.universityCode;

    const announcement = new Announcement({
      title,
      content,
      universityCode,
      author: req.user?.username
    });

    await announcement.save();

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Error creating announcement' });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can update announcements' });
    }

    const { id } = req.params;
    const { title, content } = req.body;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    announcement.title = title;
    announcement.content = content;
    await announcement.save();

    res.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Error updating announcement' });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role === 'user') {
      return res.status(403).json({ error: 'Only admins can delete announcements' });
    }

    const { id } = req.params;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.universityCode !== req.user?.universityCode) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await announcement.deleteOne();

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Error deleting announcement' });
  }
};
