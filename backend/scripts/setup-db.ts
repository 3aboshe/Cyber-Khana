import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import University from '../src/models/University';
import User from '../src/models/User';
import SuperAdmin from '../src/models/SuperAdmin';

dotenv.config();

const setupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    console.log('\n🗑️  Clearing existing data...');
    await University.deleteMany({});
    await User.deleteMany({});
    await SuperAdmin.deleteMany({});
    console.log('✅ Cleared existing data');

    console.log('\n🏛️  Creating universities...');
    const universities = await University.insertMany([
      { name: 'MIT', code: 'MIT123' },
      { name: 'Stanford University', code: 'STAN456' },
      { name: 'Harvard University', code: 'HARV789' },
      { name: 'UC Berkeley', code: 'BERK101' },
      { name: 'Carnegie Mellon', code: 'CMU202' }
    ]);
    console.log(`✅ Created ${universities.length} universities`);

    console.log('\n🔐 Creating super admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await SuperAdmin.create({
      username: 'superadmin',
      password: hashedPassword
    });
    console.log('✅ Created super admin');
    console.log('   Username: superadmin');
    console.log('   Password: admin123');

    console.log('\n👨‍💼 Creating university admins...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admins = await User.insertMany([
      {
        username: 'mit_admin',
        password: adminPassword,
        role: 'admin',
        universityCode: 'MIT123',
        points: 0,
        solvedChallenges: [],
        unlockedHints: []
      },
      {
        username: 'stanford_admin',
        password: adminPassword,
        role: 'admin',
        universityCode: 'STAN456',
        points: 0,
        solvedChallenges: [],
        unlockedHints: []
      },
      {
        username: 'harvard_admin',
        password: adminPassword,
        role: 'admin',
        universityCode: 'HARV789',
        points: 0,
        solvedChallenges: [],
        unlockedHints: []
      }
    ]);
    console.log(`✅ Created ${admins.length} university admins`);
    console.log('   For each: Username: <uni>_admin, Password: admin123');

    console.log('\n👤 Creating sample users...');
    const userPassword = await bcrypt.hash('user123', 10);
    const users = await User.insertMany([
      {
        username: 'alice',
        password: userPassword,
        role: 'user',
        universityCode: 'MIT123',
        points: 500,
        solvedChallenges: ['chal1', 'chal2'],
        unlockedHints: []
      },
      {
        username: 'bob',
        password: userPassword,
        role: 'user',
        universityCode: 'MIT123',
        points: 300,
        solvedChallenges: ['chal1'],
        unlockedHints: []
      },
      {
        username: 'charlie',
        password: userPassword,
        role: 'user',
        universityCode: 'STAN456',
        points: 750,
        solvedChallenges: ['chal1', 'chal2', 'chal3'],
        unlockedHints: []
      }
    ]);
    console.log(`✅ Created ${users.length} sample users`);
    console.log('   For each: Username: <name>, Password: user123');

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('\n🔴 Super Admin:');
    console.log('   URL: http://localhost:5173');
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    console.log('   Role: Super Admin');
    console.log('\n🔵 University Admin (MIT):');
    console.log('   URL: http://localhost:5173');
    console.log('   Username: mit_admin');
    console.log('   Password: admin123');
    console.log('   University Code: MIT123');
    console.log('   Role: Admin');
    console.log('\n🟢 Regular User:');
    console.log('   URL: http://localhost:5173');
    console.log('   Username: alice');
    console.log('   Password: user123');
    console.log('   University Code: MIT123');
    console.log('   Role: User');

    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
};

setupDatabase();
