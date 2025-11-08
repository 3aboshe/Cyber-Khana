import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log(`📡 URI: ${process.env.MONGODB_URI}`);

    await mongoose.connect(process.env.MONGODB_URI!);

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📦 Collections (${collections.length}):`);
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('   1. Make sure MongoDB is running');
    console.log('   2. Check your MONGODB_URI in .env');
    console.log('   3. For local: brew services start mongodb-community@7.0');
    console.log('   4. For Atlas: Check your connection string');
    process.exit(1);
  }
};

testConnection();
