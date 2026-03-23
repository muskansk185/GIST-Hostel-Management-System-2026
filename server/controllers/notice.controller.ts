import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Notice from '../models/Notice';
import Student from '../models/Student';
import User, { UserRole, IUser } from '../models/User';

export const createNotice = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, hostelId } = req.body;
    const userId = req.user?.userId;
    const dbUser = await User.findById(userId);

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    let targetHostelId = hostelId;

    if (dbUser.role === UserRole.WARDEN) {
      if (!dbUser.hostelId) {
        return res.status(403).json({ message: 'Warden does not have an assigned hostel' });
      }
      targetHostelId = dbUser.hostelId;
    } else if (dbUser.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({ message: 'Insufficient permissions to create notice' });
    }

    const notice = new Notice({
      title,
      content,
      createdBy: dbUser._id,
      hostelId: targetHostelId || undefined
    });

    await notice.save();
    res.status(201).json({ message: 'Notice created successfully', notice });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getNotices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const dbUser = await User.findById(userId);

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = {};

    if (dbUser.role === UserRole.SUPER_ADMIN) {
      // Super Admin sees all notices
    } else if (dbUser.role === UserRole.WARDEN) {
      // Warden sees global notices and their hostel's notices
      query = { $or: [{ hostelId: { $exists: false } }, { hostelId: null }, { hostelId: dbUser.hostelId }] };
    } else if (dbUser.role === UserRole.STUDENT) {
      // Student sees global notices and their hostel's notices
      const student = await Student.findOne({ userId: dbUser._id });
      if (student?.hostelId) {
        query = { $or: [{ hostelId: { $exists: false } }, { hostelId: null }, { hostelId: student.hostelId }] };
      } else {
        query = { $or: [{ hostelId: { $exists: false } }, { hostelId: null }] };
      }
    } else if (dbUser.role === UserRole.PARENT) {
      // Parent sees global notices and their children's hostels' notices
      if (dbUser.studentIds && dbUser.studentIds.length > 0) {
        const students = await Student.find({ _id: { $in: dbUser.studentIds } });
        const hostelIds = students.map(s => s.hostelId).filter(id => id);
        query = { $or: [{ hostelId: { $exists: false } }, { hostelId: null }, { hostelId: { $in: hostelIds } }] };
      } else {
        query = { $or: [{ hostelId: { $exists: false } }, { hostelId: null }] };
      }
    } else {
      // HOD or others see global notices
      query = { $or: [{ hostelId: { $exists: false } }, { hostelId: null }] };
    }

    const notices = await Notice.find(query)
      .populate('createdBy', 'name role')
      .populate('hostelId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(notices);
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
