import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User, { UserRole } from '../models/User';

const seedDemoUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // Database already seeded
    }

    console.log('Database is empty. Seeding demo users...');
    const saltRounds = 10;
    const defaultPassword = 'password123';
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

    await User.insertMany(demoUsers);
    console.log('Demo users seeded successfully.');
  } catch (error) {
    console.error('Failed to seed demo users:', error);
  }
};

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn('MONGODB_URI is not defined. Skipping DB connection. Please set MONGODB_URI in the Secrets panel.');
      return;
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    
    // Automatically seed users if empty
    await seedDemoUsers();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('\n--- MONGODB CONNECTION FAILED ---');
    console.warn('If you are using MongoDB Atlas, ensure your Network Access IP Whitelist includes "0.0.0.0/0" (Allow Access From Anywhere) because this preview environment uses dynamic IP addresses.');
    console.warn('The server will continue running, but database features will not work until the connection is fixed.\n');
    // Do not exit the process, allow the server to start so the preview doesn't crash
  }
};
