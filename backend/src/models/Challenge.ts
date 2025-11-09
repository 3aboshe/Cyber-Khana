import mongoose, { Schema, Document } from 'mongoose';
import { ChallengeCategory } from '../types';

export const calculateDynamicScore = (
  initialPoints: number,
  minimumPoints: number,
  decay: number,
  solveCount: number
): number => {
  const value = Math.ceil(
    ((minimumPoints - initialPoints) / (decay * decay)) * (solveCount * solveCount) + initialPoints
  );
  return Math.max(value, minimumPoints);
};

export interface IHint {
  text: string;
  cost: number;
  isPublished: boolean;
}

export interface IChallengeFile {
  name: string;
  url: string;
}

export interface IChallenge extends Document {
  title: string;
  category: ChallengeCategory;
  points: number;
  description: string;
  author: string;
  flag: string;
  hints?: IHint[];
  files?: IChallengeFile[];
  universityCode: string;
  solves: number;
  fromCompetition?: boolean;
  competitionId?: string;
  challengeLink?: string;
  writeup?: {
    content: string;
    images?: string[];
    isUnlocked: boolean;
    pdfFile?: {
      name: string;
      url: string;
      uploadedAt: Date;
    };
  };
  isPublished: boolean;
  initialPoints: number;
  minimumPoints: number;
  decay: number;
  currentPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const HintSchema = new Schema({
  text: String,
  cost: Number,
  isPublished: {
    type: Boolean,
    default: false
  }
});

const ChallengeFileSchema = new Schema({
  name: String,
  url: String
});

const ChallengeSchema: Schema = new Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(ChallengeCategory),
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  flag: {
    type: String,
    required: true
  },
  hints: [HintSchema],
  files: [ChallengeFileSchema],
  universityCode: {
    type: String,
    required: true,
    uppercase: true
  },
  solves: {
    type: Number,
    default: 0
  },
  fromCompetition: {
    type: Boolean,
    default: false
  },
  competitionId: {
    type: String
  },
  challengeLink: {
    type: String
  },
  writeup: {
    content: String,
    images: [String],
    isUnlocked: {
      type: Boolean,
      default: false
    },
    pdfFile: {
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  initialPoints: {
    type: Number,
    default: 1000
  },
  minimumPoints: {
    type: Number,
    default: 100
  },
  decay: {
    type: Number,
    default: 200
  },
  currentPoints: {
    type: Number,
    default: 1000
  }
}, {
  timestamps: true
});

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
