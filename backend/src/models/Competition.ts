import mongoose, { Schema, Document } from 'mongoose';
import { ChallengeCategory } from '../types';

export interface ICompetitionHint {
  text: string;
  cost: number;
}

export interface ICompetitionFile {
  name: string;
  url: string;
}

export interface ICompetitionChallenge extends Document {
  title: string;
  category: ChallengeCategory;
  points: number;
  description: string;
  author: string;
  flag: string;
  hints?: ICompetitionHint[];
  files?: ICompetitionFile[];
  solves: number;
  initialPoints?: number;
  minimumPoints?: number;
  decay?: number;
  currentPoints?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  estimatedTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompetition extends Document {
  name: string;
  securityCode: string;
  universityCode: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'active' | 'ended';
  challenges: ICompetitionChallenge[];
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitionHintSchema = new Schema({
  text: String,
  cost: Number
});

const CompetitionFileSchema = new Schema({
  name: String,
  url: String
});

const CompetitionChallengeSchema: Schema = new Schema({
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
  hints: [CompetitionHintSchema],
  files: [CompetitionFileSchema],
  solves: {
    type: Number,
    default: 0
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
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Medium'
  },
  estimatedTime: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

const CompetitionSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  securityCode: {
    type: String,
    required: true
  },
  universityCode: {
    type: String,
    required: true,
    uppercase: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'ended'],
    default: 'pending'
  },
  challenges: [CompetitionChallengeSchema],
  duration: {
    type: Number
  }
}, {
  timestamps: true
});

export default mongoose.model<ICompetition>('Competition', CompetitionSchema);
