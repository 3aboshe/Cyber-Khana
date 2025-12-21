import mongoose, { Schema, Document } from 'mongoose';

export interface IPenalty {
  amount: number;
  reason: string;
  type: string;
  adminId: string;
  createdAt: Date;
}

export interface ICompetitionPenalty {
  competitionId: string;
  amount: number;
  reason: string;
  adminId: string;
  createdAt: Date;
}

export interface ICompetitionBonusPoint {
  competitionId: string;
  amount: number;
  reason: string;
  adminId: string;
  createdAt: Date;
}

export interface IUser extends Document {
  username: string;
  displayName?: string;
  password: string;
  fullName?: string;
  role: 'user' | 'admin';
  universityCode: string;
  points: number;
  competitionPoints: number;
  solvedChallenges: string[];
  solvedChallengesDetails: Array<{
    challengeId: string;
    solvedAt: Date;
    points: number;
  }>;
  unlockedHints: string[];
  profileIcon?: string;
  isBanned?: boolean;
  penalties?: IPenalty[];
  competitionPenalties?: ICompetitionPenalty[];
  competitionBonusPoints?: ICompetitionBonusPoint[];
  createdAt: Date;
  updatedAt: Date;
  bonusPoints: number;
}

const PenaltySchema = new Schema({
  amount: { type: Number, required: true },
  reason: { type: String, default: 'Points deduction by admin' },
  type: { type: String, default: 'general' },
  adminId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const CompetitionPenaltySchema = new Schema({
  competitionId: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, default: 'Points deduction by admin' },
  adminId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const CompetitionBonusPointSchema = new Schema({
  competitionId: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, default: 'Bonus points awarded by admin' },
  adminId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  universityCode: {
    type: String,
    required: true,
    uppercase: true
  },
  points: {
    type: Number,
    default: 0
  },
  competitionPoints: {
    type: Number,
    default: 0
  },
  solvedChallenges: [{
    type: String
  }],
  solvedChallengesDetails: [{
    challengeId: {
      type: String
    },
    solvedAt: {
      type: Date
    },
    points: {
      type: Number
    }
  }],
  profileIcon: {
    type: String,
    default: 'default'
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  unlockedHints: [{
    type: String
  }],
  penalties: [PenaltySchema],
  competitionPenalties: [CompetitionPenaltySchema],
  competitionBonusPoints: [CompetitionBonusPointSchema],
  bonusPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
