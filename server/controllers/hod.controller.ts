import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Student from '../models/Student';
import LeaveRequest, { LeaveStatus } from '../models/LeaveRequest';
import Complaint from '../models/Complaint';
import HostelFee from '../models/HostelFee';

export const getDepartmentStudents = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};
    if (req.user?.role === 'HOD' && req.user.department) {
      query['personalDetails.department'] = req.user.department;
    }

    // Add year filter if provided
    if (req.query.year) {
      query['personalDetails.year'] = req.query.year;
    }

    const students = await Student.find(query)
      .populate('hostelId', 'name')
      .populate('roomId', 'roomNumber');
      
    // Fetch fee status for each student
    const studentIds = students.map(s => s._id);
    const fees = await HostelFee.find({ studentId: { $in: studentIds } });
    
    // Map fees to students
    const studentsWithFees = students.map(student => {
      const studentFees = fees.filter(f => f.studentId.toString() === student._id.toString());
      const totalFees = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
      const paidFees = studentFees.filter(f => f.status === 'PAID').reduce((sum, fee) => sum + fee.amount, 0);
      const pendingFees = totalFees - paidFees;
      
      return {
        ...student.toObject(),
        feeStatus: {
          total: totalFees,
          paid: paidFees,
          pending: pendingFees
        }
      };
    });

    res.status(200).json(studentsWithFees);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getDepartmentAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    let studentQuery: any = {};
    if (req.user?.role === 'HOD' && req.user.department) {
      studentQuery['personalDetails.department'] = req.user.department;
    }

    // 1. Students staying in hostel
    const totalStudents = await Student.countDocuments(studentQuery);
    const studentsInHostel = await Student.countDocuments({ ...studentQuery, hostelId: { $exists: true, $ne: null } });
    
    // Get student IDs for this department to filter leaves and complaints
    const students = await Student.find(studentQuery).select('_id personalDetails.year');
    const studentIds = students.map(s => s._id);

    // 2. Year-wise distribution
    const yearDistribution = await Student.aggregate([
      { $match: studentQuery },
      { $group: { _id: '$personalDetails.year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // 3. Fee status overview
    const fees = await HostelFee.find({ studentId: { $in: studentIds } });
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidFees = fees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0);
    const pendingFees = totalFees - paidFees;
    
    // 4. Leave statistics
    const leaveQuery = { studentId: { $in: studentIds } };
    const totalLeaves = await LeaveRequest.countDocuments(leaveQuery);
    const pendingLeaves = await LeaveRequest.countDocuments({ ...leaveQuery, status: { $in: [LeaveStatus.PENDING_PARENT, LeaveStatus.PENDING_HOD, LeaveStatus.PENDING_WARDEN] } });
    const approvedLeaves = await LeaveRequest.countDocuments({ ...leaveQuery, status: LeaveStatus.APPROVED });
    const rejectedLeaves = await LeaveRequest.countDocuments({ ...leaveQuery, status: LeaveStatus.REJECTED });
    
    // 5. Complaint statistics
    const complaintQuery = { studentId: { $in: studentIds } };
    const totalComplaints = await Complaint.countDocuments(complaintQuery);
    const resolvedComplaints = await Complaint.countDocuments({ ...complaintQuery, status: 'RESOLVED' });
    const pendingComplaints = await Complaint.countDocuments({ ...complaintQuery, status: 'PENDING' });
    const inProgressComplaints = await Complaint.countDocuments({ ...complaintQuery, status: 'IN_PROGRESS' });

    res.status(200).json({
      students: {
        total: totalStudents,
        inHostel: studentsInHostel,
        dayScholars: totalStudents - studentsInHostel,
        yearDistribution: yearDistribution.map(y => ({ year: y._id, count: y.count }))
      },
      fees: {
        total: totalFees,
        paid: paidFees,
        pending: pendingFees
      },
      leaves: {
        total: totalLeaves,
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves
      },
      complaints: {
        total: totalComplaints,
        resolved: resolvedComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
