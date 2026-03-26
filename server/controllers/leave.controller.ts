import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import LeaveRequest, { LeaveStatus } from '../models/LeaveRequest';
import Student from '../models/Student';
import Alert from '../models/Alert';
import User, { UserRole } from '../models/User';

// Student APIs
export const applyLeave = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { fromDate, toDate, reason, emergencyContact } = req.body;

    const student = await Student.findOne({ userId });
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    // Prevent overlapping leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      studentId: student._id,
      status: { $nin: [LeaveStatus.REJECTED] },
      $or: [
        { fromDate: { $lte: end }, toDate: { $gte: start } }
      ]
    });

    if (overlappingLeave) {
      res.status(400).json({ message: 'You already have an active leave request during this period' });
      return;
    }

    const leaveRequest = new LeaveRequest({
      studentId: student._id,
      rollNumber: student.personalDetails.rollNumber,
      fromDate: start,
      toDate: end,
      reason,
      emergencyContact,
      status: LeaveStatus.PENDING_PARENT
    });

    await leaveRequest.save();

    // Find parents of this student
    const parents = await User.find({
      role: 'Parent',
      studentIds: student._id
    });

    for (const parent of parents) {
      await Alert.create({
        userId: parent._id,
        title: 'New Leave Request',
        message: `${student.personalDetails.firstName} ${student.personalDetails.lastName} has submitted a leave request.`,
        type: 'WARNING'
      });
    }

    res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const student = await Student.findOne({ userId });
    
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const leaves = await LeaveRequest.find({ studentId: student._id }).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentLeaves = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const leaves = await LeaveRequest.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Parent APIs
export const getPendingParentLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.query;
    const studentIds = req.user?.studentIds || [];

    const filter: any = {
      status: LeaveStatus.PENDING_PARENT
    };

    if (studentId) {
      if (!studentIds.map(id => id.toString()).includes(studentId.toString())) {
        return res.status(403).json({ message: 'Unauthorized to view this student\'s leaves' });
      }
      filter.studentId = studentId;
    } else {
      filter.studentId = { $in: studentIds };
    }

    const leaves = await LeaveRequest.find(filter).populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department');

    const formattedLeaves = leaves.map(l => ({
      ...l.toObject(),
      student: l.studentId ? {
        personalDetails: {
          firstName: (l.studentId as any).personalDetails?.firstName || '',
          lastName: (l.studentId as any).personalDetails?.lastName || '',
          rollNumber: (l.studentId as any).personalDetails?.rollNumber || '',
          department: (l.studentId as any).personalDetails?.department || ''
        }
      } : null
    }));

    res.status(200).json(formattedLeaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approveParentLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveId } = req.params;
    const studentIds = req.user?.studentIds || [];

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING_PARENT) {
      res.status(400).json({ message: 'Leave request is not pending parent approval' });
      return;
    }

    // Verify parent has access to this student
    if (!studentIds.map(id => id.toString()).includes(leave.studentId.toString())) {
      res.status(403).json({ message: 'Unauthorized to approve this leave request' });
      return;
    }

    const student = await Student.findById(leave.studentId);

    leave.status = LeaveStatus.PENDING_HOD;
    leave.parentApprovalAt = new Date();
    await leave.save();

    await Alert.create({
      userId: student.userId,
      title: 'Leave Request Update',
      message: 'Your leave request has been approved by your parent and is pending HOD approval.',
      type: 'INFO'
    });

    const hods = await User.find({ role: UserRole.HOD });
    if (hods.length > 0) {
      const alerts = hods.map(hod => ({
        userId: hod._id,
        title: 'New Leave Request',
        message: `${student.personalDetails.firstName} ${student.personalDetails.lastName} has a leave request pending your approval.`,
        type: 'WARNING'
      }));
      await Alert.insertMany(alerts);
    }

    res.status(200).json({ message: 'Leave request approved by parent', leave });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const rejectParentLeave = async (req: AuthRequest, res: Response) => {
  try {
    const { leaveId } = req.params;
    const userId = req.user?.userId;
    const studentIds = req.user?.studentIds || [];

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING_PARENT) {
      res.status(400).json({ message: 'Leave request is not pending parent approval' });
      return;
    }

    // Verify parent has access to this student
    if (!studentIds.map(id => id.toString()).includes(leave.studentId.toString())) {
      res.status(403).json({ message: 'Unauthorized to reject this leave request' });
      return;
    }

    const student = await Student.findById(leave.studentId);

    leave.status = LeaveStatus.REJECTED;
    leave.rejectedBy = new mongoose.Types.ObjectId(userId);
    await leave.save();

    await Alert.create({
      userId: student.userId,
      title: 'Leave Request Rejected',
      message: 'Your leave request has been rejected by your parent.',
      type: 'ERROR'
    });

    res.status(200).json({ message: 'Leave request rejected by parent', leave });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// HOD APIs
export const getPendingHODLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { status: LeaveStatus.PENDING_HOD };
    if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ "personalDetails.department": req.user.department }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    }

    const leaves = await LeaveRequest.find(filter).populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department profilePicture');

    const formattedLeaves = leaves.map(l => ({
      ...l.toObject(),
      student: l.studentId ? {
        profilePicture: (l.studentId as any).profilePicture,
        personalDetails: {
          firstName: (l.studentId as any).personalDetails?.firstName || '',
          lastName: (l.studentId as any).personalDetails?.lastName || '',
          rollNumber: (l.studentId as any).personalDetails?.rollNumber || '',
          department: (l.studentId as any).personalDetails?.department || ''
        }
      } : null
    }));

    res.status(200).json(formattedLeaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approveHODLeave = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING_HOD) {
      res.status(400).json({ message: 'Leave request is not pending HOD approval' });
      return;
    }

    leave.status = LeaveStatus.PENDING_WARDEN;
    leave.hodApprovalAt = new Date();
    await leave.save();

    const student = await Student.findById(leave.studentId);
    if (student) {
      await Alert.create({
        userId: student.userId,
        title: 'Leave Request Update',
        message: 'Your leave request has been approved by HOD and is pending Warden approval.',
        type: 'INFO'
      });

      const wardens = await User.find({ role: UserRole.WARDEN });
      if (wardens.length > 0) {
        const alerts = wardens.map(warden => ({
          userId: warden._id,
          title: 'New Leave Request',
          message: `${student.personalDetails.firstName} ${student.personalDetails.lastName} has a leave request pending your approval.`,
          type: 'WARNING'
        }));
        await Alert.insertMany(alerts);
      }
    }

    res.status(200).json({ message: 'Leave request approved by HOD', leave });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const rejectHODLeave = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;
    const userId = (req as any).user.userId;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING_HOD) {
      res.status(400).json({ message: 'Leave request is not pending HOD approval' });
      return;
    }

    leave.status = LeaveStatus.REJECTED;
    leave.rejectedBy = new mongoose.Types.ObjectId(userId);
    await leave.save();

    const student = await Student.findById(leave.studentId);
    if (student) {
      await Alert.create({
        userId: student.userId,
        title: 'Leave Request Rejected',
        message: 'Your leave request has been rejected by HOD.',
        type: 'ERROR'
      });
    }

    res.status(200).json({ message: 'Leave request rejected by HOD', leave });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Warden APIs
export const getWardenLeaveHistory = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { status: { $in: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] } };
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    }

    const leaves = await LeaveRequest.find(filter).populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department').sort({ createdAt: -1 });

    const formattedLeaves = leaves.map(l => ({
      ...l.toObject(),
      student: l.studentId ? {
        personalDetails: {
          firstName: (l.studentId as any).personalDetails?.firstName || '',
          lastName: (l.studentId as any).personalDetails?.lastName || '',
          rollNumber: (l.studentId as any).personalDetails?.rollNumber || '',
          department: (l.studentId as any).personalDetails?.department || ''
        }
      } : null
    }));

    res.status(200).json(formattedLeaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPendingWardenLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = { status: LeaveStatus.PENDING_WARDEN };
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    }

    const leaves = await LeaveRequest.find(filter).populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department');

    const formattedLeaves = leaves.map(l => ({
      ...l.toObject(),
      student: l.studentId ? {
        personalDetails: {
          firstName: (l.studentId as any).personalDetails?.firstName || '',
          lastName: (l.studentId as any).personalDetails?.lastName || '',
          rollNumber: (l.studentId as any).personalDetails?.rollNumber || '',
          department: (l.studentId as any).personalDetails?.department || ''
        }
      } : null
    }));

    res.status(200).json(formattedLeaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approveWardenLeave = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING_WARDEN) {
      res.status(400).json({ message: 'Leave request is not pending Warden approval' });
      return;
    }

    leave.status = LeaveStatus.APPROVED;
    leave.wardenApprovalAt = new Date();
    await leave.save();

    const student = await Student.findById(leave.studentId);
    if (student) {
      await Alert.create({
        userId: student.userId,
        title: 'Leave Request Approved',
        message: 'Your leave request has been fully approved.',
        type: 'SUCCESS'
      });
    }

    res.status(200).json({ message: 'Leave request approved by Warden', leave });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const rejectWardenLeave = async (req: Request, res: Response) => {
  try {
    const { leaveId } = req.params;
    const userId = (req as any).user.userId;

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      res.status(404).json({ message: 'Leave request not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING_WARDEN) {
      res.status(400).json({ message: 'Leave request is not pending Warden approval' });
      return;
    }

    leave.status = LeaveStatus.REJECTED;
    leave.rejectedBy = new mongoose.Types.ObjectId(userId);
    await leave.save();

    const student = await Student.findById(leave.studentId);
    if (student) {
      await Alert.create({
        userId: student.userId,
        title: 'Leave Request Rejected',
        message: 'Your leave request has been rejected by the Warden.',
        type: 'ERROR'
      });
    }

    res.status(200).json({ message: 'Leave request rejected by Warden', leave });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLeaveHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const dbUser = await User.findById(user.userId);
    if (!dbUser) return res.status(404).json({ message: 'User not found' });

    const { status, studentId } = req.query;
    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (dbUser.role === UserRole.STUDENT) {
      const student = await Student.findOne({ userId: dbUser._id });
      query.studentId = student?._id;
    } else if (dbUser.role === UserRole.PARENT) {
      if (studentId) {
        // Verify parent has access to this student
        if (!dbUser.studentIds.map(id => id.toString()).includes(studentId.toString())) {
          return res.status(403).json({ message: 'Unauthorized to view this student\'s leaves' });
        }
        query.studentId = studentId;
      } else {
        query.studentId = { $in: dbUser.studentIds };
      }
    } else if (dbUser.role === UserRole.HOD) {
      const students = await Student.find({ "personalDetails.department": dbUser.department }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    } else if (dbUser.role === UserRole.WARDEN) {
      const students = await Student.find({ hostelId: dbUser.hostelId }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    } else if (dbUser.role === UserRole.SUPER_ADMIN) {
      // All leaves
    }

    const leaves = await LeaveRequest.find(query)
      .populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department')
      .populate('rejectedBy', 'name role')
      .sort({ createdAt: -1 });

    const formattedLeaves = leaves.map(l => ({
      _id: l._id,
      student: l.studentId ? {
        personalDetails: {
          firstName: (l.studentId as any).personalDetails?.firstName || '',
          lastName: (l.studentId as any).personalDetails?.lastName || '',
          rollNumber: (l.studentId as any).personalDetails?.rollNumber || '',
          department: (l.studentId as any).personalDetails?.department || ''
        }
      } : null,
      leaveDates: { from: l.fromDate, to: l.toDate },
      status: l.status,
      approvedBy: l.status === 'REJECTED' && l.rejectedBy ? {
        name: (l.rejectedBy as any).name,
        role: (l.rejectedBy as any).role
      } : (l.status === 'APPROVED' ? {
        name: 'Warden',
        role: 'WARDEN'
      } : undefined)
    }));

    res.status(200).json(formattedLeaves);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
