import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { UserRole } from '../models/User';
import Student from '../models/Student';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    // Basic validation
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      email, 
      passwordHash, 
      role: role || UserRole.STUDENT,
      name: req.body.name || email.split('@')[0]
    });
    
    // If user is a parent, find students with this parent email and link them
    if (newUser.role === UserRole.PARENT) {
      const students = await Student.find({ 'parentDetails.parentEmail': email });
      if (students.length > 0) {
        newUser.studentIds = students.map(s => s._id as mongoose.Types.ObjectId);
      }
    }
    
    await newUser.save();

    // If students were linked, update the students with parentId
    if (newUser.role === UserRole.PARENT && newUser.studentIds && newUser.studentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: newUser.studentIds } },
        { parentId: newUser._id }
      );
    }

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: newUser._id 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.userId;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current and new passwords are required' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid current password' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    console.log("LOGIN USER:", user.department);
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        department: user.department,
        hostelId: user.hostelId,
        studentIds: user.studentIds
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
