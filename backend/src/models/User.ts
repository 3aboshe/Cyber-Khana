import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  displayName?: string;
  password: string;
  fullName?: string;
  role: 'user' | 'admin';
  universityCode: string;
  points: number;
  solvedChallenges: string[];
  solvedChallengesDetails: Array<{
    challengeId: string;
    solvedAt: Date;
    points: number;
  }>;
  unlockedHints: string[];
  profileIcon?: string;
  isBanned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  }]
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
