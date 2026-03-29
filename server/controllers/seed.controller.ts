import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User, { UserRole } from '../models/User';
import Hostel, { HostelType } from '../models/Hostel';
import Block from '../models/Block';
import Floor from '../models/Floor';
import Room from '../models/Room';
import Bed, { BedStatus } from '../models/Bed';
import Student from '../models/Student';
import Complaint, { ComplaintCategory, ComplaintStatus, ComplaintUrgency } from '../models/Complaint';
import LeaveRequest, { LeaveStatus } from '../models/LeaveRequest';
import HostelFee, { FeeStatus } from '../models/HostelFee';
import Alert from '../models/Alert';
import Key, { KeyStatus } from '../models/Key';

export const clearDatabase = async (req: Request, res: Response) => {
  try {
    // Clear existing data except Super Admin
    await Hostel.deleteMany({});
    await Block.deleteMany({});
    await Floor.deleteMany({});
    await Room.deleteMany({});
    await Bed.deleteMany({});
    await Student.deleteMany({});
    await Complaint.deleteMany({});
    await LeaveRequest.deleteMany({});
    await HostelFee.deleteMany({});
    await Alert.deleteMany({});
    await Key.deleteMany({});
    
    // Delete all users except SUPER_ADMIN
    await User.deleteMany({ role: { $ne: UserRole.SUPER_ADMIN } });

    res.status(200).json({ message: 'Database cleared successfully (Super Admin retained)' });
  } catch (error: any) {
    console.error('Clear DB error:', error);
    res.status(500).json({ message: 'Server error during database clearing', error: error.message });
  }
};

export const seedDatabase = async (req: Request, res: Response) => {
  try {
    // 1. Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      Block.deleteMany({}),
      Floor.deleteMany({}),
      Room.deleteMany({}),
      Bed.deleteMany({}),
      Student.deleteMany({}),
      Complaint.deleteMany({}),
      LeaveRequest.deleteMany({}),
      HostelFee.deleteMany({}),
      Alert.deleteMany({}),
      Key.deleteMany({})
    ]);

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@hostelms.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      phone: '9876543210'
    });

    // 2. Create HODs (4)
    const hodNames = ['Dr. Sharma', 'Dr. Verma', 'Dr. Gupta', 'Dr. Singh'];
    const hodDepartments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'];
    const hods = await Promise.all(hodNames.map((name, i) => User.create({
      name,
      email: `hod${i+1}@hostelms.com`,
      passwordHash,
      role: UserRole.HOD,
      department: hodDepartments[i],
      phone: `987654322${i}`
    })));

    // 3. Create Wardens (4)
    const wardenNames = ['Ramesh Kumar', 'Suresh Patel', 'Anita Desai', 'Priya Sharma'];
    const wardens = await Promise.all(wardenNames.map((name, i) => User.create({
      name,
      email: `warden${i+1}@hostelms.com`,
      passwordHash,
      role: UserRole.WARDEN,
      phone: `987654323${i}`
    })));

    // 4. Create Parents (15)
    const parentNames = [
      'Rajesh Kumar', 'Sunita Devi', 'Vikram Singh', 'Meena Patel', 'Sanjay Gupta',
      'Pooja Sharma', 'Amit Verma', 'Kavita Reddy', 'Anil Joshi', 'Rekha Das',
      'Manoj Tiwari', 'Geeta Iyer', 'Deepak Nair', 'Sneha Menon', 'Prakash Rao'
    ];
    const parents = await Promise.all(parentNames.map((name, i) => User.create({
      name,
      email: `parent${i+1}@hostelms.com`,
      passwordHash,
      role: UserRole.PARENT,
      phone: `987654324${i.toString().padStart(2, '0')}`
    })));

    // 5. Create Hostels (2 Boys, 2 Girls)
    const hostelData = [
      { name: 'Boys Hostel A', type: HostelType.BOYS, wardenId: wardens[0]._id },
      { name: 'Boys Hostel B', type: HostelType.BOYS, wardenId: wardens[1]._id },
      { name: 'Girls Hostel A', type: HostelType.GIRLS, wardenId: wardens[2]._id },
      { name: 'Girls Hostel B', type: HostelType.GIRLS, wardenId: wardens[3]._id }
    ];
    
    const hostels = await Promise.all(hostelData.map(h => Hostel.create({ ...h, capacity: 100 })));

    // Update Wardens with hostelId
    for (let i = 0; i < wardens.length; i++) {
      await User.findByIdAndUpdate(wardens[i]._id, { hostelId: hostels[i]._id });
    }

    // 6. Create Blocks, Floors, Rooms, Beds
    const allBeds: any[] = [];
    const roomsByHostel: Record<string, any[]> = {};

    for (const hostel of hostels) {
      roomsByHostel[hostel._id.toString()] = [];
      const block = await Block.create({ name: 'Block A', hostelId: hostel._id });
      
      // 2 Floors per hostel
      for (let f = 1; f <= 2; f++) {
        const floor = await Floor.create({ floorNumber: f, blockId: block._id });
        
        // 4 Rooms per floor
        for (let r = 1; r <= 4; r++) {
          const roomNumber = `${f}0${r}`;
          const room = await Room.create({ roomNumber, floorId: floor._id, capacity: 2 });
          roomsByHostel[hostel._id.toString()].push(room);
          
          // 2 Beds per room
          for (let b = 1; b <= 2; b++) {
            const bed = await Bed.create({
              bedNumber: `${roomNumber}-${String.fromCharCode(64 + b)}`,
              roomId: room._id,
              status: BedStatus.AVAILABLE
            });
            allBeds.push({ bed, room, floor, block, hostel });
          }
        }
      }
    }

    // 7. Create Students (30)
    const studentNames = [
      { first: 'Aarav', last: 'Kumar', gender: 'M' }, { first: 'Vihaan', last: 'Singh', gender: 'M' },
      { first: 'Vivaan', last: 'Patel', gender: 'M' }, { first: 'Ananya', last: 'Sharma', gender: 'F' },
      { first: 'Diya', last: 'Gupta', gender: 'F' }, { first: 'Advik', last: 'Verma', gender: 'M' },
      { first: 'Kiara', last: 'Reddy', gender: 'F' }, { first: 'Kabir', last: 'Joshi', gender: 'M' },
      { first: 'Isha', last: 'Das', gender: 'F' }, { first: 'Rudra', last: 'Tiwari', gender: 'M' },
      { first: 'Myra', last: 'Iyer', gender: 'F' }, { first: 'Ayaan', last: 'Nair', gender: 'M' },
      { first: 'Saanvi', last: 'Menon', gender: 'F' }, { first: 'Dhruv', last: 'Rao', gender: 'M' },
      { first: 'Aditi', last: 'Desai', gender: 'F' }, { first: 'Arjun', last: 'Chauhan', gender: 'M' },
      { first: 'Zara', last: 'Bose', gender: 'F' }, { first: 'Sai', last: 'Pillai', gender: 'M' },
      { first: 'Riya', last: 'Kaur', gender: 'F' }, { first: 'Krishna', last: 'Yadav', gender: 'M' },
      { first: 'Aanya', last: 'Mishra', gender: 'F' }, { first: 'Ishaan', last: 'Pandey', gender: 'M' },
      { first: 'Navya', last: 'Dubey', gender: 'F' }, { first: 'Shaurya', last: 'Thakur', gender: 'M' },
      { first: 'Kavya', last: 'Choudhary', gender: 'F' }, { first: 'Atharv', last: 'Nath', gender: 'M' },
      { first: 'Mira', last: 'Bhatt', gender: 'F' }, { first: 'Reyansh', last: 'Sen', gender: 'M' },
      { first: 'Pari', last: 'Ghosh', gender: 'F' }, { first: 'Aarush', last: 'Mukherjee', gender: 'M' }
    ];

    const boysBeds = allBeds.filter(b => b.hostel.type === HostelType.BOYS);
    const girlsBeds = allBeds.filter(b => b.hostel.type === HostelType.GIRLS);

    let boyBedIndex = 0;
    let girlBedIndex = 0;

    const parentAssignments: Record<number, number[]> = {
      0: [0, 1],
      1: [2, 3],
      2: [4, 5],
      3: [6, 7, 8],
      4: [9, 10, 11],
      5: [12], 6: [13], 7: [14], 8: [15], 9: [16], 10: [17], 11: [18]
    };

    const createdStudents = [];

    for (let i = 0; i < 30; i++) {
      const studentInfo = studentNames[i];
      const rollNumber = `22CS${(i + 1).toString().padStart(3, '0')}`;
      
      let assignedParentId = undefined;
      for (const [pIndex, sIndices] of Object.entries(parentAssignments)) {
        if (sIndices.includes(i)) {
          assignedParentId = parents[parseInt(pIndex)]._id;
          break;
        }
      }

      let bedInfo;
      if (studentInfo.gender === 'M') {
        bedInfo = boysBeds[boyBedIndex++];
      } else {
        bedInfo = girlsBeds[girlBedIndex++];
      }

      const studentUser = await User.create({
        name: `${studentInfo.first} ${studentInfo.last}`,
        email: `student${i+1}@hostelms.com`,
        passwordHash,
        role: UserRole.STUDENT,
        phone: `987654325${i.toString().padStart(2, '0')}`
      });

      const student = await Student.create({
        userId: studentUser._id,
        personalDetails: {
          rollNumber,
          firstName: studentInfo.first,
          lastName: studentInfo.last,
          department: 'Computer Science',
          year: '2nd Year',
          phone: studentUser.phone,
          email: studentUser.email,
        },
        profilePicture: `https://ui-avatars.com/api/?name=${studentInfo.first}+${studentInfo.last}&background=random`,
        guardianDetails: {
          guardianName: 'Local Guardian Name',
          guardianRelation: 'Uncle',
          guardianPhone: '9876543260',
        },
        address: {
          permanentAddress: '123 Local Street, City',
          currentAddress: '123 Local Street, City'
        },
        hostelId: bedInfo.hostel._id,
        blockId: bedInfo.block._id,
        roomId: bedInfo.room._id,
        bedId: bedInfo.bed._id
      });

      await Bed.findByIdAndUpdate(bedInfo.bed._id, {
        status: BedStatus.OCCUPIED,
        studentId: student._id
      });

      if (assignedParentId) {
        await User.findByIdAndUpdate(assignedParentId, {
          $push: { studentIds: student._id }
        });
      }

      createdStudents.push({ student, user: studentUser, hostel: bedInfo.hostel });
    }

    // 8. Create Keys (6 per hostel)
    for (const hostel of hostels) {
      const hostelRooms = roomsByHostel[hostel._id.toString()];
      const hostelStudents = createdStudents.filter(s => s.hostel._id.toString() === hostel._id.toString());
      
      for (let k = 1; k <= 6; k++) {
        const isUsed = k <= 3; // First 3 keys are in use
        const room = hostelRooms[k % hostelRooms.length];
        
        let assignedTo = undefined;
        if (isUsed) {
          const studentInRoom = hostelStudents.find(s => s.student.roomId.toString() === room._id.toString());
          if (studentInRoom) {
            assignedTo = studentInRoom.user._id;
          }
        }

        await Key.create({
          keyNumber: `KEY-${hostel.name.substring(0,2).toUpperCase()}-${k}`,
          hostelId: hostel._id,
          roomId: room._id,
          status: assignedTo ? KeyStatus.IN_USE : KeyStatus.AVAILABLE,
          assignedTo
        });
      }
    }

    res.status(200).json({ message: 'Database seeded successfully with neat data!' });
  } catch (error: any) {
    console.error('Seed DB error:', error);
    res.status(500).json({ message: 'Server error during database seeding', error: error.message });
  }
};
