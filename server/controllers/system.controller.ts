import { Request, Response } from 'express';
import Hostel from '../models/Hostel';
import User from '../models/User';
import Room from '../models/Room';
import Bed from '../models/Bed';
import Student from '../models/Student';
import Complaint from '../models/Complaint';
import HostelFee from '../models/HostelFee';
import SystemSettings from '../models/SystemSettings';

export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    const totalHostels = await Hostel.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const settings = await SystemSettings.findOne();

    res.status(200).json({
      totalHostels,
      totalUsers,
      totalRooms,
      systemVersion: '1.0.0',
      maintenanceMode: settings?.maintenanceMode || false
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSystemReport = async (req: Request, res: Response) => {
  try {
    const totalHostels = await Hostel.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();
    const totalBeds = await Bed.countDocuments();
    const occupiedBeds = await Bed.countDocuments({ status: 'OCCUPIED' });
    const availableBeds = await Bed.countDocuments({ status: 'AVAILABLE' });
    const totalStudents = await Student.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'PENDING' });
    const totalFees = await HostelFee.countDocuments();
    const paidFees = await HostelFee.countDocuments({ status: 'PAID' });
    
    const hostels = await Hostel.find().lean();

    const report = {
      reportName: 'System Summary Report',
      timestamp: new Date(),
      summary: {
        totalHostels,
        totalUsers,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        totalStudents,
        totalComplaints,
        pendingComplaints,
        totalFees,
        paidFees
      },
      hostels: hostels.map(h => ({
        name: h.name,
        type: h.type,
        capacity: h.capacity
      }))
    };

    res.status(200).json(report);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
