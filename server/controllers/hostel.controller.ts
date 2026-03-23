import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Hostel from '../models/Hostel';
import Block from '../models/Block';
import Floor from '../models/Floor';
import Room from '../models/Room';
import Bed, { BedStatus } from '../models/Bed';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getHostels = async (req: AuthRequest, res: Response) => {
  try {
    let query: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      query._id = req.user.hostelId;
    }
    const hostels = await Hostel.find(query).populate('wardenId', 'name email');
    res.status(200).json(hostels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createHostel = async (req: Request, res: Response) => {
  try {
    const hostel = new Hostel(req.body);
    await hostel.save();
    res.status(201).json({ message: 'Hostel created', hostel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateHostel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hostel = await Hostel.findByIdAndUpdate(id, req.body, { new: true });
    if (!hostel) {
      res.status(404).json({ message: 'Hostel not found' });
      return;
    }
    res.status(200).json({ message: 'Hostel updated', hostel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteHostel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hostel = await Hostel.findByIdAndDelete(id);
    if (!hostel) {
      res.status(404).json({ message: 'Hostel not found' });
      return;
    }
    
    // Cascade delete
    const blocks = await Block.find({ hostelId: id });
    const blockIds = blocks.map(b => b._id);
    
    const floors = await Floor.find({ blockId: { $in: blockIds } });
    const floorIds = floors.map(f => f._id);
    
    const rooms = await Room.find({ floorId: { $in: floorIds } });
    const roomIds = rooms.map(r => r._id);
    
    await Bed.deleteMany({ roomId: { $in: roomIds } });
    await Room.deleteMany({ floorId: { $in: floorIds } });
    await Floor.deleteMany({ blockId: { $in: blockIds } });
    await Block.deleteMany({ hostelId: id });
    
    res.status(200).json({ message: 'Hostel deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBlocks = async (req: AuthRequest, res: Response) => {
  try {
    let matchStage: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      matchStage.hostelId = new mongoose.Types.ObjectId(req.user.hostelId);
    }
    const blocks = await Block.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'hostels',
          localField: 'hostelId',
          foreignField: '_id',
          as: 'hostel'
        }
      },
      { $unwind: '$hostel' },
      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'blockId',
          as: 'floors'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          hostelId: 1,
          hostelName: '$hostel.name',
          numberOfFloors: { $size: '$floors' }
        }
      }
    ]);
    res.status(200).json(blocks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createBlock = async (req: Request, res: Response) => {
  try {
    const block = new Block(req.body);
    await block.save();
    res.status(201).json({ message: 'Block created', block });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateBlock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const block = await Block.findByIdAndUpdate(id, req.body, { new: true });
    if (!block) {
      res.status(404).json({ message: 'Block not found' });
      return;
    }
    res.status(200).json({ message: 'Block updated', block });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteBlock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const block = await Block.findByIdAndDelete(id);
    if (!block) {
      res.status(404).json({ message: 'Block not found' });
      return;
    }
    
    // Cascade delete
    const floors = await Floor.find({ blockId: id });
    const floorIds = floors.map(f => f._id);
    
    const rooms = await Room.find({ floorId: { $in: floorIds } });
    const roomIds = rooms.map(r => r._id);
    
    await Bed.deleteMany({ roomId: { $in: roomIds } });
    await Room.deleteMany({ floorId: { $in: floorIds } });
    await Floor.deleteMany({ blockId: id });
    
    res.status(200).json({ message: 'Block deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getFloors = async (req: AuthRequest, res: Response) => {
  try {
    let matchStage: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      matchStage['block.hostelId'] = new mongoose.Types.ObjectId(req.user.hostelId);
    }
    const floors = await Floor.aggregate([
      {
        $lookup: {
          from: 'blocks',
          localField: 'blockId',
          foreignField: '_id',
          as: 'block'
        }
      },
      { $unwind: '$block' },
      { $match: matchStage },
      {
        $lookup: {
          from: 'hostels',
          localField: 'block.hostelId',
          foreignField: '_id',
          as: 'hostel'
        }
      },
      { $unwind: '$hostel' },
      {
        $project: {
          _id: 1,
          floorNumber: 1,
          blockId: 1,
          blockName: '$block.name',
          hostelName: '$hostel.name'
        }
      },
      { $sort: { hostelName: 1, blockName: 1, floorNumber: 1 } }
    ]);
    res.status(200).json(floors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createFloor = async (req: Request, res: Response) => {
  try {
    const floor = new Floor(req.body);
    await floor.save();
    res.status(201).json({ message: 'Floor created', floor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateFloor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByIdAndUpdate(id, req.body, { new: true });
    if (!floor) {
      res.status(404).json({ message: 'Floor not found' });
      return;
    }
    res.status(200).json({ message: 'Floor updated', floor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteFloor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const floor = await Floor.findByIdAndDelete(id);
    if (!floor) {
      res.status(404).json({ message: 'Floor not found' });
      return;
    }
    
    // Cascade delete
    const rooms = await Room.find({ floorId: id });
    const roomIds = rooms.map(r => r._id);
    
    await Bed.deleteMany({ roomId: { $in: roomIds } });
    await Room.deleteMany({ floorId: id });
    
    res.status(200).json({ message: 'Floor deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    let matchStage: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      matchStage['block.hostelId'] = new mongoose.Types.ObjectId(req.user.hostelId);
    }
    const rooms = await Room.aggregate([
      {
        $lookup: {
          from: 'floors',
          localField: 'floorId',
          foreignField: '_id',
          as: 'floor'
        }
      },
      { $unwind: '$floor' },
      {
        $lookup: {
          from: 'blocks',
          localField: 'floor.blockId',
          foreignField: '_id',
          as: 'block'
        }
      },
      { $unwind: '$block' },
      { $match: matchStage },
      {
        $lookup: {
          from: 'hostels',
          localField: 'block.hostelId',
          foreignField: '_id',
          as: 'hostel'
        }
      },
      { $unwind: '$hostel' },
      {
        $project: {
          _id: 1,
          roomNumber: 1,
          capacity: 1,
          floorId: 1,
          floorNumber: '$floor.floorNumber',
          blockName: '$block.name',
          hostelName: '$hostel.name'
        }
      },
      { $sort: { hostelName: 1, blockName: 1, floorNumber: 1, roomNumber: 1 } }
    ]);
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json({ message: 'Room created', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndUpdate(id, req.body, { new: true });
    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }
    res.status(200).json({ message: 'Room updated', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }
    
    // Cascade delete
    await Bed.deleteMany({ roomId: id });
    
    res.status(200).json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getBeds = async (req: AuthRequest, res: Response) => {
  try {
    let matchStage: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      matchStage['block.hostelId'] = new mongoose.Types.ObjectId(req.user.hostelId);
    }
    const beds = await Bed.aggregate([
      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      {
        $lookup: {
          from: 'floors',
          localField: 'room.floorId',
          foreignField: '_id',
          as: 'floor'
        }
      },
      { $unwind: '$floor' },
      {
        $lookup: {
          from: 'blocks',
          localField: 'floor.blockId',
          foreignField: '_id',
          as: 'block'
        }
      },
      { $unwind: '$block' },
      { $match: matchStage },
      {
        $lookup: {
          from: 'hostels',
          localField: 'block.hostelId',
          foreignField: '_id',
          as: 'hostel'
        }
      },
      { $unwind: '$hostel' },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          bedNumber: 1,
          status: 1,
          roomId: 1,
          roomNumber: '$room.roomNumber',
          floorNumber: '$floor.floorNumber',
          blockName: '$block.name',
          hostelName: '$hostel.name',
          studentName: { 
            $cond: [
              { $ifNull: ['$student', false] },
              { $concat: ['$student.personalDetails.firstName', ' ', '$student.personalDetails.lastName'] },
              null
            ]
          }
        }
      },
      { $sort: { hostelName: 1, blockName: 1, floorNumber: 1, roomNumber: 1, bedNumber: 1 } }
    ]);
    res.status(200).json(beds);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createBed = async (req: Request, res: Response) => {
  try {
    const room = await Room.findById(req.body.roomId);
    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    const bedsCount = await Bed.countDocuments({ roomId: room._id });
    if (bedsCount >= room.capacity) {
      res.status(400).json({ message: 'Room capacity reached' });
      return;
    }

    const bed = new Bed(req.body);
    await bed.save();
    res.status(201).json({ message: 'Bed created', bed });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteBed = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bed = await Bed.findByIdAndDelete(id);
    if (!bed) {
      res.status(404).json({ message: 'Bed not found' });
      return;
    }
    res.status(200).json({ message: 'Bed deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const assignStudentToBed = async (req: Request, res: Response) => {
  try {
    const { bedId } = req.params;
    const { studentId } = req.body;

    const bed = await Bed.findById(bedId);
    if (!bed) {
      res.status(404).json({ message: 'Bed not found' });
      return;
    }

    if (bed.status !== BedStatus.AVAILABLE) {
      res.status(400).json({ message: 'Bed is not available' });
      return;
    }

    // Check if student is already assigned to another bed
    const existingAssignment = await Bed.findOne({ studentId });
    if (existingAssignment) {
      res.status(400).json({ message: 'Student is already assigned to a bed' });
      return;
    }

    bed.studentId = studentId;
    bed.status = BedStatus.OCCUPIED;
    await bed.save();

    res.status(200).json({ message: 'Student assigned to bed', bed });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateBedStatus = async (req: Request, res: Response) => {
  try {
    const { bedId } = req.params;
    const { status } = req.body;

    const bed = await Bed.findById(bedId);
    if (!bed) {
      res.status(404).json({ message: 'Bed not found' });
      return;
    }

    bed.status = status;
    if (status === BedStatus.AVAILABLE || status === BedStatus.MAINTENANCE) {
      bed.studentId = undefined;
    }
    
    await bed.save();

    res.status(200).json({ message: 'Bed status updated', bed });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getHostelHierarchy = async (req: AuthRequest, res: Response) => {
  try {
    let matchStage: any = {};
    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      matchStage.hostelId = new mongoose.Types.ObjectId(req.user.hostelId);
    }
    const hierarchy = await Block.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'floors',
          localField: '_id',
          foreignField: 'blockId',
          as: 'floors'
        }
      },
      { $unwind: { path: '$floors', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'floors._id',
          foreignField: 'floorId',
          as: 'rooms'
        }
      },
      { $unwind: { path: '$rooms', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'beds',
          localField: 'rooms._id',
          foreignField: 'roomId',
          as: 'beds'
        }
      },
      {
        $unwind: { path: '$beds', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'beds.studentId',
          foreignField: '_id',
          as: 'beds.student'
        }
      },
      {
        $unwind: { path: '$beds.student', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            blockId: '$_id',
            blockName: '$name',
            floorId: '$floors._id',
            floorNumber: '$floors.floorNumber',
            roomId: '$rooms._id',
            roomNumber: '$rooms.roomNumber',
            capacity: '$rooms.capacity'
          },
          beds: { 
            $push: {
              $cond: [
                { $ne: ['$beds._id', null] },
                {
                  _id: '$beds._id',
                  bedNumber: '$beds.bedNumber',
                  status: '$beds.status',
                  studentId: '$beds.studentId',
                  studentName: {
                    $cond: [
                      { $ifNull: ['$beds.student', false] },
                      { $concat: ['$beds.student.personalDetails.firstName', ' ', '$beds.student.personalDetails.lastName'] },
                      null
                    ]
                  }
                },
                '$$REMOVE'
              ]
            }
          }
        }
      },
      {
        $addFields: {
          occupiedBeds: {
            $size: {
              $filter: {
                input: '$beds',
                as: 'bed',
                cond: { $eq: ['$$bed.status', 'OCCUPIED'] }
              }
            }
          },
          maintenanceBeds: {
            $size: {
              $filter: {
                input: '$beds',
                as: 'bed',
                cond: { $eq: ['$$bed.status', 'MAINTENANCE'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          // availableBeds: { 
          //   $max: [0, { $subtract: [{ $ifNull: ['$_id.capacity', 0] }, { $add: ['$occupiedBeds', '$maintenanceBeds'] }] }] 
          // },
          availableBeds: {
  $size: {
    $filter: {
      input: '$beds',
      as: 'bed',
      cond: { $eq: ['$$bed.status', 'AVAILABLE'] }
    }
  }
},
          status: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.capacity', null] }, then: null },
                { case: { $eq: ['$maintenanceBeds', '$_id.capacity'] }, then: 'MAINTENANCE' },
                { case: { $eq: ['$occupiedBeds', '$_id.capacity'] }, then: 'FULL' },
                { case: { $eq: ['$occupiedBeds', 0] }, then: 'AVAILABLE' }
              ],
              default: 'PARTIAL'
            }
          }
        }
      },
      {
        $group: {
          _id: {
            blockId: '$_id.blockId',
            blockName: '$_id.blockName',
            floorId: '$_id.floorId',
            floorNumber: '$_id.floorNumber'
          },
          rooms: {
            $push: {
              $cond: [
                { $ne: ['$_id.roomId', null] },
                {
                  roomId: '$_id.roomId',
                  roomNumber: '$_id.roomNumber',
                  capacity: '$_id.capacity',
                  occupiedBeds: '$occupiedBeds',
                  availableBeds: '$availableBeds',
                  status: '$status',
                  beds: '$beds'
                },
                '$$REMOVE'
              ]
            }
          }
        }
      },
      {
        $match: {
          '_id.floorId': { $ne: null }
        }
      },
      {
        $project: {
          _id: 0,
          blockId: '$_id.blockId',
          block: '$_id.blockName',
          floor: '$_id.floorNumber',
          rooms: 1
        }
      },
      { $sort: { block: 1, floor: 1 } }
    ]);

    res.status(200).json(hierarchy);
  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
