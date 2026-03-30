import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import Complaint, { ComplaintStatus, ComplaintUrgency, ComplaintCategory } from '../models/Complaint';
import Student from '../models/Student';
import Alert from '../models/Alert';
import User, { UserRole } from '../models/User';

export const getComplaintAnalytics = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const totalComplaints = await Complaint.countDocuments();
    const overdueComplaints = await Complaint.countDocuments({
      status: { $ne: ComplaintStatus.RESOLVED },
      createdAt: { $lt: fortyEightHoursAgo }
    });

    const resolvedComplaints = await Complaint.find({ status: ComplaintStatus.RESOLVED, resolvedAt: { $exists: true } });
    let totalResolutionTime = 0;
    resolvedComplaints.forEach(c => {
      if (c.resolvedAt) {
        totalResolutionTime += (c.resolvedAt.getTime() - c.createdAt.getTime());
      }
    });
    const avgResolutionTimeHours = resolvedComplaints.length > 0 
      ? (totalResolutionTime / resolvedComplaints.length) / (1000 * 60 * 60) 
      : 0;

    const categoryCounts = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const blockStats = await Complaint.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: 'blocks',
          localField: 'student.blockId',
          foreignField: '_id',
          as: 'block'
        }
      },
      { $unwind: "$block" },
      {
        $group: {
          _id: "$block.name",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const repeatedIssues = await Complaint.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: 'blocks',
          localField: 'student.blockId',
          foreignField: '_id',
          as: 'block'
        }
      },
      { $unwind: "$block" },
      {
        $group: {
          _id: { blockName: "$block.name", category: "$category" },
          count: { $sum: 1 },
          complaints: { $push: { title: "$title", status: "$status", createdAt: "$createdAt" } }
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const insights: string[] = [];
    if (overdueComplaints > 0) {
      insights.push(`${overdueComplaints} complaints are overdue (unresolved for >48 hours). Immediate action required.`);
    }
    if (categoryCounts.length > 0) {
      insights.push(`${categoryCounts[0]._id} is the most frequent complaint category with ${categoryCounts[0].count} issues.`);
    }
    repeatedIssues.forEach(issue => {
      if (issue.count > 5) {
        insights.push(`CRITICAL: ${issue._id.category} issues in ${issue._id.blockName} are recurring frequently (${issue.count} times).`);
      } else if (issue.count > 2) {
        insights.push(`Warning: ${issue._id.category} issues in ${issue._id.blockName} have been reported ${issue.count} times.`);
      }
    });

    res.json({
      summary: {
        total: totalComplaints,
        overdue: overdueComplaints,
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
        topCategory: categoryCounts.length > 0 ? categoryCounts[0]._id : 'N/A'
      },
      categoryDistribution: categoryCounts.map(c => ({ name: c._id, value: c.count })),
      blockDistribution: blockStats.map(b => ({ name: b._id, value: b.count })),
      repeatedIssues: repeatedIssues.map(r => ({
        block: r._id.blockName,
        category: r._id.category,
        count: r.count,
        recentComplaints: r.complaints.slice(0, 3)
      })),
      insights
    });

  } catch (error: any) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Student APIs
export const createComplaint = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { roomId, bedId, category, title, description, urgency: providedUrgency } = req.body;

    const student = await Student.findOne({ userId });
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    let urgency = providedUrgency;
    if (!urgency) {
      if (category === ComplaintCategory.ELECTRICAL || category === ComplaintCategory.PLUMBING) {
        urgency = ComplaintUrgency.HIGH;
      } else if (category === ComplaintCategory.CLEANING) {
        urgency = ComplaintUrgency.MEDIUM;
      } else {
        urgency = ComplaintUrgency.LOW;
      }
    }

    const expectedResolutionTime = new Date();
    if (urgency === ComplaintUrgency.HIGH) {
      expectedResolutionTime.setHours(expectedResolutionTime.getHours() + 6);
    } else if (urgency === ComplaintUrgency.MEDIUM) {
      expectedResolutionTime.setHours(expectedResolutionTime.getHours() + 24);
    } else {
      expectedResolutionTime.setDate(expectedResolutionTime.getDate() + 3);
    }

    const complaint = new Complaint({
      studentId: student._id,
      roomId,
      bedId,
      category,
      title,
      description,
      urgency,
      expectedResolutionTime,
      currentStatus: 'raised',
      statusHistory: [{ status: 'raised', updatedAt: new Date(), updatedBy: student.userId, note: 'Complaint raised' }]
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

export const assignWarden = async (req: Request, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { wardenId } = req.body;

    const warden = await User.findOne({ _id: wardenId, role: UserRole.WARDEN });
    if (!warden) {
      res.status(404).json({ message: 'Warden not found' });
      return;
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { assignedTo: wardenId, status: ComplaintStatus.IN_PROGRESS },
      { new: true }
    );

    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found' });
      return;
    }

    await Alert.create({
      userId: wardenId,
      title: 'Complaint Assigned',
      message: `You have been assigned to a complaint regarding ${complaint.category}.`,
      type: 'INFO'
    });

    res.status(200).json({ message: 'Complaint assigned to warden successfully', complaint });
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

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { complaintId } = req.params;
    const { status, note } = req.body;
    const updatedBy = req.user?.userId;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found' });
      return;
    }

    complaint.status = status;
    complaint.currentStatus = status;
    complaint.statusHistory.push({ status, updatedAt: new Date(), updatedBy: new mongoose.Types.ObjectId(updatedBy), note });
    
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
