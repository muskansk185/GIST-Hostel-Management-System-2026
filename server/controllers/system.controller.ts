import { Request, Response } from 'express';
import Hostel from '../models/Hostel';
import User from '../models/User';
import Room from '../models/Room';

let isMaintenanceMode = false;

export const getSystemInfo = async (req: Request, res: Response) => {
  try {
    const totalHostels = await Hostel.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRooms = await Room.countDocuments();

    res.status(200).json({
      totalHostels,
      totalUsers,
      totalRooms,
      systemVersion: '1.0.0',
      maintenanceMode: isMaintenanceMode
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const toggleMaintenanceMode = async (req: Request, res: Response) => {
  try {
    isMaintenanceMode = !isMaintenanceMode;
    res.status(200).json({ maintenanceMode: isMaintenanceMode, message: `Maintenance mode ${isMaintenanceMode ? 'enabled' : 'disabled'}` });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
