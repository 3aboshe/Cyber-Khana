import mongoose, { Schema, Document } from 'mongoose';
import { ChallengeCategory } from '../types';

export interface IHint {
  text: string;
  cost: number;
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
  writeup?: {
    content: string;
    images?: string[];
    isUnlocked: boolean;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HintSchema = new Schema({
  text: String,
  cost: Number
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
  writeup: {
    content: String,
    images: [String],
    isUnlocked: {
      type: Boolean,
      default: false
    }
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
