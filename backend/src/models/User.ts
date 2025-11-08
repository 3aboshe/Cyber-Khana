import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'user' | 'admin';
  universityCode: string;
  points: number;
  solvedChallenges: string[];
  unlockedHints: string[];
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
  unlockedHints: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
