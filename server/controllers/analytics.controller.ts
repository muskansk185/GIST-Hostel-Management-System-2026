import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Hostel from '../models/Hostel';
import Block from '../models/Block';
import Floor from '../models/Floor';
import Room from '../models/Room';
import Bed, { BedStatus } from '../models/Bed';
import Complaint, { ComplaintStatus } from '../models/Complaint';
import HostelFee, { FeeStatus } from '../models/HostelFee';
import LeaveRequest, { LeaveStatus } from '../models/LeaveRequest';
import Student from '../models/Student';
import User from '../models/User';

export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    const hostelQuery: any = {};
    const blockQuery: any = {};
    const roomQuery: any = {};
    const bedQuery: any = {};
    const studentQuery: any = {};

    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      hostelQuery._id = req.user.hostelId;
      blockQuery.hostelId = req.user.hostelId;
      studentQuery.hostelId = req.user.hostelId;
      
      const blocks = await Block.find({ hostelId: req.user.hostelId }).select('_id');
      const blockIds = blocks.map(b => b._id);
      
      const floors = await Floor.find({ blockId: { $in: blockIds } }).select('_id');
      const floorIds = floors.map(f => f._id);
      
      roomQuery.floorId = { $in: floorIds };
      
      const rooms = await Room.find(roomQuery).select('_id');
      const roomIds = rooms.map(r => r._id);
      
      bedQuery.roomId = { $in: roomIds };
    } else if (req.user?.role === "HOD" && req.user.department) {
      studentQuery.department = req.user.department;
    }

    const totalHostels = await Hostel.countDocuments(hostelQuery);
    const totalBlocks = await Block.countDocuments(blockQuery);
    const totalRooms = await Room.countDocuments(roomQuery);
    
    const bedStats = await Bed.aggregate([
      { $match: bedQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;

    bedStats.forEach(stat => {
      totalBeds += stat.count;
      if (stat._id === BedStatus.OCCUPIED) occupiedBeds = stat.count;
      if (stat._id === BedStatus.AVAILABLE) availableBeds = stat.count;
    });

    const totalStudents = await Student.countDocuments(studentQuery);
    const activeUsers = await User.countDocuments({ isActive: true });

    res.status(200).json({
      totalHostels,
      totalBlocks,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      totalStudents,
      activeUsers
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOccupancyStats = async (req: AuthRequest, res: Response) => {
  try {
    const hostelQuery: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      hostelQuery._id = req.user.hostelId;
    }
    const hostels = await Hostel.find(hostelQuery);
    const stats = [];

    for (const hostel of hostels) {
      // Find all blocks for this hostel
      const blocks = await Block.find({ hostelId: hostel._id });
      const blockIds = blocks.map(b => b._id);
      
      // Find all rooms for these blocks
     //const rooms = await Room.find({ blockId: { $in: blockIds } });
     const floors = await Floor.find({ blockId: { $in: blockIds } });
const floorIds = floors.map(f => f._id);

const rooms = await Room.find({ floorId: { $in: floorIds } });
      const roomIds = rooms.map(r => r._id);
      
      // Find all beds for these rooms
      const beds = await Bed.find({ roomId: { $in: roomIds } });
      
      const totalBeds = beds.length;
      const occupiedBeds = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
      
      const occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      
      stats.push({
        hostel: hostel.name,
        occupancy
      });
    }

    res.status(200).json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRevenueStats = async (req: AuthRequest, res: Response) => {
  try {
    const matchStage: any = { status: FeeStatus.PAID, paidAt: { $exists: true } };
    
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ department: req.user.department }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const monthlyRevenue = await HostelFee.aggregate([
      {
         $match: matchStage
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const formattedMonthlyRevenue = monthlyRevenue.map(stat => ({
      month: months[stat._id.month - 1],
      revenue: stat.revenue
    }));

    res.status(200).json(formattedMonthlyRevenue);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getComplaintStats = async (req: AuthRequest, res: Response) => {
  try {
    const matchStage: any = {};
    
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ department: req.user.department }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const stats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: '$category', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format to group by category
    const formattedStats: any = {};
    
    stats.forEach(stat => {
      const category = stat._id.category;
      const status = stat._id.status;
      
      if (!formattedStats[category]) {
        formattedStats[category] = { category, total: 0 };
      }
      
      formattedStats[category][status] = stat.count;
      formattedStats[category].total += stat.count;
    });

    res.status(200).json(Object.values(formattedStats));
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOccupancyAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const hostelQuery: any = {};
    const roomQuery: any = {};
    const bedQuery: any = {};

    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      hostelQuery._id = req.user.hostelId;
      
      const blocks = await Block.find({ hostelId: req.user.hostelId }).select('_id');
      const blockIds = blocks.map(b => b._id);
      
      const floors = await Floor.find({ blockId: { $in: blockIds } }).select('_id');
      const floorIds = floors.map(f => f._id);
      
      roomQuery.floorId = { $in: floorIds };
      
      const rooms = await Room.find(roomQuery).select('_id');
      const roomIds = rooms.map(r => r._id);
      
      bedQuery.roomId = { $in: roomIds };
    }

    const totalHostels = await Hostel.countDocuments(hostelQuery);
    const totalRooms = await Room.countDocuments(roomQuery);
    
    const bedStats = await Bed.aggregate([
      { $match: bedQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    let maintenanceBeds = 0;

    bedStats.forEach(stat => {
      totalBeds += stat.count;
      if (stat._id === BedStatus.OCCUPIED) occupiedBeds = stat.count;
      if (stat._id === BedStatus.AVAILABLE) availableBeds = stat.count;
      if (stat._id === BedStatus.MAINTENANCE) maintenanceBeds = stat.count;
    });

    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    res.status(200).json({
      totalHostels,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyRate: Number(occupancyRate.toFixed(2))
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getComplaintAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const matchStage: any = {};
    
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ department: req.user.department }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const statusStats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalComplaints = 0;
    let openComplaints = 0;
    let inProgressComplaints = 0;
    let resolvedComplaints = 0;

    statusStats.forEach(stat => {
      totalComplaints += stat.count;
      if (stat._id === ComplaintStatus.OPEN) openComplaints = stat.count;
      if (stat._id === ComplaintStatus.IN_PROGRESS) inProgressComplaints = stat.count;
      if (stat._id === ComplaintStatus.RESOLVED) resolvedComplaints = stat.count;
    });

    const complaintsByCategory = categoryStats.map(stat => ({
      category: stat._id,
      count: stat.count
    }));

    const complaintsByPriority = priorityStats.map(stat => ({
      priority: stat._id,
      count: stat.count
    }));

    res.status(200).json({
      totalComplaints,
      openComplaints,
      inProgressComplaints,
      resolvedComplaints,
      complaintsByCategory,
      complaintsByPriority
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFeeAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const matchStage: any = {};
    
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ department: req.user.department }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const feeStats = await HostelFee.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    let totalFeesCollected = 0;
    let pendingFees = 0;
    let overdueFees = 0;

    feeStats.forEach(stat => {
      if (stat._id === FeeStatus.PAID) totalFeesCollected = stat.totalAmount;
      if (stat._id === FeeStatus.PENDING) pendingFees = stat.totalAmount;
      if (stat._id === FeeStatus.OVERDUE) overdueFees = stat.totalAmount;
    });

    const monthlyRevenue = await HostelFee.aggregate([
      {
        $match: { ...matchStage, status: FeeStatus.PAID, paidAt: { $exists: true } }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const formattedMonthlyRevenue = monthlyRevenue.map(stat => ({
      year: stat._id.year,
      month: stat._id.month,
      revenue: stat.revenue
    }));

    res.status(200).json({
      totalFeesCollected,
      pendingFees,
      overdueFees,
      monthlyRevenue: formattedMonthlyRevenue
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getLeaveAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const matchStage: any = {};
    
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ department: req.user.department }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const leaveStats = await LeaveRequest.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalLeaveRequests = 0;
    let approvedLeaves = 0;
    let rejectedLeaves = 0;
    let pendingLeaves = 0;

    leaveStats.forEach(stat => {
      totalLeaveRequests += stat.count;
      if (stat._id === LeaveStatus.APPROVED) {
        approvedLeaves = stat.count;
      } else if (stat._id === LeaveStatus.REJECTED) {
        rejectedLeaves = stat.count;
      } else {
        // PENDING_PARENT, PENDING_HOD, PENDING_WARDEN
        pendingLeaves += stat.count;
      }
    });

    res.status(200).json({
      totalLeaveRequests,
      approvedLeaves,
      rejectedLeaves,
      pendingLeaves
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentDistribution = async (req: AuthRequest, res: Response) => {
  try {
    const matchStage: any = {};
    
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      matchStage.hostelId = req.user.hostelId;
    } else if (req.user?.role === "HOD" && req.user.department) {
      matchStage.department = req.user.department;
    }

    const departmentStats = await Student.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const studentCountByDepartment = departmentStats.map(stat => ({
      department: stat._id,
      count: stat.count
    }));

    res.status(200).json({
      studentCountByDepartment
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
