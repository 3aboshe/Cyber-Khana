import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const filterByUniversity = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role === 'super-admin') {
    return next();
  }

  const universityCode = req.user?.universityCode;
  if (!universityCode) {
    return res.status(403).json({ error: 'University code not found in token' });
  }

  (req as any).universityCode = universityCode;
  next();
};
