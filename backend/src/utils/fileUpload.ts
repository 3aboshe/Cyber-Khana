import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Sanitize filename: replace URL-unsafe characters with underscores
function sanitizeFilename(original: string): string {
  const ext = path.extname(original);
  const name = path.basename(original, ext);
  // Replace characters that break URLs: ? # % & + = and other unsafe chars
  const safeName = name.replace(/[?#%&+=@!$,;:'"^`{}|\\<>[\]]/g, '_');
  return safeName + ext;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
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
    cb(null, sanitizeFilename(file.originalname));
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
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 10 // Maximum 10 files per challenge
  }
});
