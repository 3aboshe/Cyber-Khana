import mongoose, { Schema, Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IUniversity>('University', UniversitySchema);
