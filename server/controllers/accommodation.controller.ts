import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';
import Bed, { BedStatus } from '../models/Bed';
import Room from '../models/Room';
import Floor from '../models/Floor';
import Block from '../models/Block';
import Student from '../models/Student';
import AccommodationHistory from '../models/AccommodationHistory';

// Helper to get full hierarchy IDs for a bed
const getBedHierarchy = async (bedId: string) => {
  const bed = await Bed.findById(bedId);
  if (!bed) throw new Error('Bed not found');
  
  const room = await Room.findById(bed.roomId);
  if (!room) throw new Error('Room not found');
  
  const floor = await Floor.findById(room.floorId);
  if (!floor) throw new Error('Floor not found');
  
  const block = await Block.findById(floor.blockId);
  if (!block) throw new Error('Block not found');
  
  return {
    bedId: bed._id,
    roomId: room._id,
    floorId: floor._id,
    blockId: block._id,
    hostelId: block.hostelId
  };
};

export const assignAccommodation = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { studentId, bedId } = req.body;
    const assignedBy = req.user?.userId;

    const student = await Student.findById(studentId).session(session);
    if (!student) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    const bed = await Bed.findById(bedId).session(session);
    if (!bed) {
      await session.abortTransaction();
      res.status(404).json({ message: 'Bed not found' });
      return;
    }

    const hierarchy = await getBedHierarchy(bedId);

    // RBAC: Warden can only assign beds in their assigned hostel
    if (req.user?.role === UserRole.WARDEN && req.user.hostelId && hierarchy.hostelId.toString() !== req.user.hostelId.toString()) {
      await session.abortTransaction();
      res.status(403).json({ message: 'Access denied: Cannot assign bed in a different hostel' });
      return;
    }

    const existingAssignment = await Bed.findOne({ studentId }).session(session);
    if (existingAssignment) {
      await session.abortTransaction();
      res.status(400).json({ message: 'Student is already assigned to a bed' });
      return;
    }

    if (bed.status !== BedStatus.AVAILABLE) {
      await session.abortTransaction();
      res.status(400).json({ message: 'Bed is not available' });
      return;
    }

    bed.studentId = new mongoose.Types.ObjectId(studentId);
    bed.status = BedStatus.OCCUPIED;
    await bed.save({ session });

    // student.hostelId = hierarchy.hostelId;
    // await student.save({ session });
    student.hostelId = hierarchy.hostelId;
    student.roomId = hierarchy.roomId;
    student.bedId = hierarchy.bedId;
    student.accommodationStatus = "HOSTELLER";

    await student.save({ session });

    const history = new AccommodationHistory({
      studentId,
      ...hierarchy,
      assignedBy
    });
    await history.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: 'Student assigned successfully', bed, history });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

export const transferAccommodation = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { studentId, newBedId } = req.body;
    const assignedBy = req.user?.userId;

    const currentBed = await Bed.findOne({ studentId }).session(session);
    if (!currentBed) {
      await session.abortTransaction();
      res.status(400).json({ message: 'Student is not currently assigned to any bed' });
      return;
    }

    const newBed = await Bed.findById(newBedId).session(session);
    if (!newBed) {
      await session.abortTransaction();
      res.status(404).json({ message: 'New bed not found' });
      return;
    }

    const currentHierarchy = await getBedHierarchy(currentBed._id.toString());
    const newHierarchy = await getBedHierarchy(newBedId);

    // RBAC: Warden can only transfer students within their assigned hostel
    if (req.user?.role === UserRole.WARDEN && req.user.hostelId) {
      if (currentHierarchy.hostelId.toString() !== req.user.hostelId.toString() || 
          newHierarchy.hostelId.toString() !== req.user.hostelId.toString()) {
        await session.abortTransaction();
        res.status(403).json({ message: 'Access denied: Cannot transfer student outside your assigned hostel' });
        return;
      }
    }

    if (newBed.status !== BedStatus.AVAILABLE) {
      await session.abortTransaction();
      res.status(400).json({ message: 'New bed is not available' });
      return;
    }

    const hierarchy = await getBedHierarchy(newBedId);

    // Free current bed
    currentBed.studentId = undefined;
    currentBed.status = BedStatus.AVAILABLE;
    await currentBed.save({ session });

    // Occupy new bed
    newBed.studentId = new mongoose.Types.ObjectId(studentId);
    newBed.status = BedStatus.OCCUPIED;
    await newBed.save({ session });

    // Update history for old bed
    await AccommodationHistory.updateMany(
      { studentId, bedId: currentBed._id, vacatedAt: { $exists: false } },
      { $set: { vacatedAt: new Date() } },
      { session }
    );

    // Create new history
    const history = new AccommodationHistory({
      studentId,
      ...hierarchy,
      assignedBy
    });
    await history.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: 'Student transferred successfully', newBed, history });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

export const vacateAccommodation = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { studentId } = req.body;

    const currentBed = await Bed.findOne({ studentId }).session(session);
    if (!currentBed) {
      await session.abortTransaction();
      res.status(400).json({ message: 'Student is not currently assigned to any bed' });
      return;
    }

    const currentHierarchy = await getBedHierarchy(currentBed._id.toString());

    // RBAC: Warden can only vacate students from their assigned hostel
    if (req.user?.role === UserRole.WARDEN && req.user.hostelId && currentHierarchy.hostelId.toString() !== req.user.hostelId.toString()) {
      await session.abortTransaction();
      res.status(403).json({ message: 'Access denied: Cannot vacate student from a different hostel' });
      return;
    }

    // Free current bed
    currentBed.studentId = undefined;
    currentBed.status = BedStatus.AVAILABLE;
    await currentBed.save({ session });

    const student = await Student.findById(studentId).session(session);
    student.hostelId = undefined;
    student.roomId = undefined;
    student.bedId = undefined;
    student.accommodationStatus = "DAY_SCHOLAR";

    await student.save({ session });

    // Update history
    await AccommodationHistory.updateMany(
      { studentId, bedId: currentBed._id, vacatedAt: { $exists: false } },
      { $set: { vacatedAt: new Date() } },
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: 'Student vacated successfully' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

export const getStudentAccommodation = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    // RBAC: Students can only view their own accommodation
    if (req.user?.role === UserRole.STUDENT) {
      const student = await Student.findOne({ userId: req.user.userId });
      if (!student || student._id.toString() !== studentId) {
        res.status(403).json({ message: 'Access denied: You can only view your own accommodation' });
        return;
      }
    }

    // RBAC: Parents can only view their children's accommodation
    if (req.user?.role === UserRole.PARENT) {
      if (!req.user.studentIds?.includes(studentId)) {
        res.status(403).json({ message: 'Access denied: You can only view your children\'s accommodation' });
        return;
      }
    }

    // RBAC: HOD can only view their department's students
    if (req.user?.role === UserRole.HOD) {
      const student = await Student.findById(studentId);
      if (!student || student.personalDetails?.department !== req.user.department) {
        res.status(403).json({ message: 'Access denied: Student not in your department' });
        return;
      }
    }

    // RBAC: Warden can only view students in their hostel
    if (req.user?.role === UserRole.WARDEN && req.user.hostelId) {
      const student = await Student.findById(studentId);
      if (!student || student.hostelId?.toString() !== req.user.hostelId.toString()) {
        res.status(403).json({ message: 'Access denied: Student not in your assigned hostel' });
        return;
      }
    }

    const bed = await Bed.findOne({ studentId }).populate({
      path: 'roomId',
      populate: {
        path: 'floorId',
        populate: {
          path: 'blockId',
          populate: {
            path: 'hostelId'
          }
        }
      }
    });

    if (!bed) {
      res.status(404).json({ message: 'No active accommodation found for this student' });
      return;
    }

    res.status(200).json(bed);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyAccommodation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const student = await Student.findOne({ userId });
    
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const bed = await Bed.findOne({ studentId: student._id }).populate({
      path: 'roomId',
      populate: {
        path: 'floorId',
        populate: {
          path: 'blockId',
          populate: {
            path: 'hostelId'
          }
        }
      }
    });

    if (!bed) {
      res.status(404).json({ message: 'No active accommodation found for this student' });
      return;
    }

    res.status(200).json(bed);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRoomOccupants = async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    // RBAC: Warden can only view occupants in their assigned hostel
    if (req.user?.role === UserRole.WARDEN && req.user.hostelId) {
      const room = await Room.findById(roomId).populate({
        path: 'floorId',
        populate: { path: 'blockId' }
      });
      
      if (!room || (room.floorId as any).blockId.hostelId.toString() !== req.user.hostelId.toString()) {
        res.status(403).json({ message: 'Access denied: Room not in your assigned hostel' });
        return;
      }
    }

    const beds = await Bed.find({ roomId, status: BedStatus.OCCUPIED }).populate('studentId');
    
    const formattedBeds = beds.map(bed => {
      const bedObj = bed.toObject() as any;
      if (bedObj.studentId) {
        bedObj.student = {
          personalDetails: bedObj.studentId.personalDetails
        };
        delete bedObj.studentId;
      }
      return bedObj;
    });

    res.status(200).json(formattedBeds);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getHostelOccupancyStats = async (req: AuthRequest, res: Response) => {
  try {
    const { hostelId } = req.params;
    
    // RBAC: Warden can only view their own hostel
    if (req.user?.role === UserRole.WARDEN && req.user.hostelId && req.user.hostelId.toString() !== hostelId) {
      res.status(403).json({ message: 'Access denied: You can only view stats for your assigned hostel' });
      return;
    }

    const stats = await Block.aggregate([
      { $match: { hostelId: new mongoose.Types.ObjectId(hostelId) } },
      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'blockId',
          as: 'floors'
        }
      },
      { $unwind: '$floors' },
      {
        $lookup: {
          from: 'rooms',
          localField: 'floors._id',
          foreignField: 'floorId',
          as: 'rooms'
        }
      },
      { $unwind: '$rooms' },
      {
        $lookup: {
          from: 'beds',
          localField: 'rooms._id',
          foreignField: 'roomId',
          as: 'beds'
        }
      },
      { $unwind: '$beds' },
      {
        $group: {
          _id: null,
          totalBeds: { $sum: 1 },
          occupiedBeds: {
            $sum: { $cond: [{ $eq: ['$beds.status', 'OCCUPIED'] }, 1, 0] }
          },
          availableBeds: {
            $sum: { $cond: [{ $eq: ['$beds.status', 'AVAILABLE'] }, 1, 0] }
          },
          maintenanceBeds: {
            $sum: { $cond: [{ $eq: ['$beds.status', 'MAINTENANCE'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalBeds: 1,
          occupiedBeds: 1,
          availableBeds: 1,
          maintenanceBeds: 1,
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedBeds', '$totalBeds'] },
              100
            ]
          }
        }
      }
    ]);

    res.status(200).json(stats[0] || {
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      maintenanceBeds: 0,
      occupancyRate: 0
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
