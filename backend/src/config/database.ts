import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    // MongoDB connected successfully
  } catch (error) {
    // Connection error occurred
    process.exit(1);
  }
};
