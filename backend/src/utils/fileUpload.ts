import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const challengeFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  }
});

const challengeFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Allow all file types for challenge files
  cb(null, true);
};

export const uploadWriteupPdf = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export const uploadChallengeFiles = multer({
  storage: challengeFileStorage,
  fileFilter: challengeFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10 // Maximum 10 files per challenge
  }
});
