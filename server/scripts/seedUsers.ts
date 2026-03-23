import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing users...');
    await User.deleteMany({});

    const saltRounds = 10;
    const defaultPassword = 'password123';
    console.log(`Hashing default password: "${defaultPassword}"...`);
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    const demoUsers = [
      {
        name: 'Super Admin',
        email: 'admin@hostelms.com',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
      },
      {
        name: 'John Warden',
        email: 'warden@hostelms.com',
        passwordHash,
        role: UserRole.WARDEN,
      },
      {
        name: 'Alice Student',
        email: 'student@hostelms.com',
        passwordHash,
        role: UserRole.STUDENT,
      },
      {
        name: 'Bob Parent',
        email: 'parent@hostelms.com',
        passwordHash,
        role: UserRole.PARENT,
      },
      {
        name: 'Dr. Smith HOD',
        email: 'hod@hostelms.com',
        passwordHash,
        role: UserRole.HOD,
      },
    ];

    console.log('Inserting demo users...');
    await User.insertMany(demoUsers);
    
    console.log('Successfully seeded demo users:');
    demoUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}): ${user.email}`);
    });

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedUsers();
