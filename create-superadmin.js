const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/backend/.env' });

// Define SuperAdmin schema inline (since we don't want to import TypeScript)
const SuperAdminSchema = new mongoose.Schema({
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

const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await SuperAdmin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Super admin "admin" already exists');
      console.log('Deleting existing admin...');
      await SuperAdmin.deleteOne({ username: 'admin' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('OurSecurePlatform@d0mv6p', 12);
    console.log('✅ Password hashed');

    // Create super admin
    const superAdmin = await SuperAdmin.create({
      username: 'admin',
      password: hashedPassword
    });

    console.log('\n🎉 Super admin created successfully!');
    console.log('   Username: admin');
    console.log('   Password: OurSecurePlatform@d0mv6p');
    console.log('   ID:', superAdmin._id);

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
