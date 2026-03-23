import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Complaint, { ComplaintStatus } from '../models/Complaint';
import Student from '../models/Student';
import Alert from '../models/Alert';
import User, { UserRole } from '../models/User';

// Student APIs
export const createComplaint = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { roomId, bedId, category, title, description, priority } = req.body;

    const student = await Student.findOne({ userId });
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const complaint = new Complaint({
      studentId: student._id,
      roomId,
      bedId,
      category,
      title,
      description,
      priority
    });

    await complaint.save();

    const wardens = await User.find({ role: UserRole.WARDEN });
    if (wardens.length > 0) {
      const alerts = wardens.map(warden => ({
        userId: warden._id,
        title: 'New Complaint',
        message: `A new complaint regarding ${category} has been submitted by ${student.personalDetails.firstName} ${student.personalDetails.lastName}.`,
        type: 'WARNING'
      }));
      await Alert.insertMany(alerts);
    }

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyComplaints = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const student = await Student.findOne({ userId });
    
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const complaints = await Complaint.find({ studentId: student._id })
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 });

    res.status(200).json(complaints);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentComplaints = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    const complaints = await Complaint.find({ studentId })
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 });

    const formattedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject() as any;
      if (complaintObj.studentId) {
        complaintObj.student = {
          personalDetails: complaintObj.studentId.personalDetails
        };
        delete complaintObj.studentId;
      }
      return complaintObj;
    });

    res.status(200).json(formattedComplaints);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Warden / Admin APIs
export const getAllComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const { status, category, priority, roomId } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (roomId) filter.roomId = roomId;

    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ "personalDetails.department": req.user.department }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "STUDENT") {
      const student = await Student.findOne({ userId: req.user.userId }).select('_id');
      filter.studentId = student ? student._id : null;
    } else if (req.user?.role === "PARENT" && req.user.studentIds) {
      filter.studentId = { $in: req.user.studentIds };
    }

    const complaints = await Complaint.find(filter)
      .populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber')
      .populate('roomId', 'roomNumber')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 });

    const formattedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject() as any;
      if (complaintObj.studentId) {
        complaintObj.student = {
          personalDetails: complaintObj.studentId.personalDetails
        };
        delete complaintObj.studentId;
      }
      return complaintObj;
    });

    res.status(200).json(formattedComplaints);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found' });
      return;
    }

    complaint.status = status;
    if (status === ComplaintStatus.RESOLVED) {
      complaint.resolvedAt = new Date();
    } else {
      complaint.resolvedAt = undefined;
    }

    await complaint.save();

    const student = await Student.findById(complaint.studentId);
    if (student) {
      await Alert.create({
        userId: student.userId,
        title: 'Complaint Status Updated',
        message: `Your complaint regarding ${complaint.category} has been marked as ${status}.`,
        type: status === ComplaintStatus.RESOLVED ? 'SUCCESS' : 'INFO'
      });
    }

    res.status(200).json({ message: 'Complaint status updated', complaint });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateComplaintPriority = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { priority } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { priority },
      { new: true }
    );

    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found' });
      return;
    }

    res.status(200).json({ message: 'Complaint priority updated', complaint });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const assignStaff = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { assignedStaff } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { assignedStaff },
      { new: true }
    );

    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found' });
      return;
    }

    res.status(200).json({ message: 'Staff assigned successfully', complaint });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Room Complaint API
export const getRoomComplaints = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    const complaints = await Complaint.find({ roomId })
      .populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber')
      .populate('bedId', 'bedNumber')
      .sort({ createdAt: -1 });

    const formattedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject() as any;
      if (complaintObj.studentId) {
        complaintObj.student = {
          personalDetails: complaintObj.studentId.personalDetails
        };
        delete complaintObj.studentId;
      }
      return complaintObj;
    });

    res.status(200).json(formattedComplaints);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
