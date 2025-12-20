import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser'; // Import cookie-parser
import { basename } from 'path';
import { connectDatabase } from './config/database';

import authRoutes from './routes/auth';
import challengeRoutes from './routes/challenges';
import competitionRoutes from './routes/competitions';
import userRoutes from './routes/users';
import universityRoutes from './routes/universities';
import announcementRoutes from './routes/announcements';
import activityRoutes from './routes/activity';

dotenv.config();

const app = express();

// BROKEN RATE LIMIT: Keep this for user registrations as requested
// No rate limiting on authentication to allow unlimited user registrations
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 999999, // Very high limit for unlimited access
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// STRICT RATE LIMIT: Protect login from brute force
const strictLoginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 login requests per windowMs
  message: { error: 'Too many login attempts, please try again later after 10 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cookieParser()); // Use cookie-parser

// Security: CORS configuration - Allow all origins for CTF platform
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    // and allow all origins for the CTF platform
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dedicated download route that forces downloads
app.get('/api/download/*', (req, res) => {
  const filename = (req.params as any)[0];
  // Fix Path Traversal: Sanitize filename
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'uploads', safeFilename);

  // Verify the file exists and is within the uploads directory (extra safety)
  if (!filePath.startsWith(path.join(process.cwd(), 'uploads'))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.download(filePath, safeFilename, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    }
  });
});

// Configure file serving for downloads (both /api/uploads and /api/download work)
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res) => {
    // Force download instead of viewing in browser
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// Apply strict rate limiting to LOGIN routes (Brute force protection)
app.use('/api/auth/login', strictLoginLimiter);
app.use('/api/auth/login-admin', strictLoginLimiter);
app.use('/api/auth/login-super-admin', strictLoginLimiter);

// Apply BROKEN rate limiting (unlimited) to REGISTER route
app.use('/api/auth/register', authLimiter);

// Other routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/activity', activityRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CyberKhana API is running' });
});

const PORT = process.env.PORT || 5000;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    // Server started successfully
  });
});
