import mongoose, { Schema, Document } from 'mongoose';

export interface ISuperAdmin extends Document {
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuperAdminSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ISuperAdmin>('SuperAdmin', SuperAdminSchema);
