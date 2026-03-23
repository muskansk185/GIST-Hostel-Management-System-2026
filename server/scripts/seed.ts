import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import Hostel, { HostelType } from '../models/Hostel';
import Block from '../models/Block';
import Floor from '../models/Floor';
import Room from '../models/Room';
import Bed, { BedStatus } from '../models/Bed';
import Student from '../models/Student';
import Key, { KeyStatus } from '../models/Key';
import HostelFee, { FeeStatus } from '../models/HostelFee';
import Complaint, { ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../models/Complaint';
import LeaveRequest, { LeaveStatus } from '../models/LeaveRequest';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gist_hostel';
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Hostel.deleteMany({}),
      Block.deleteMany({}),
      Floor.deleteMany({}),
      Room.deleteMany({}),
      Bed.deleteMany({}),
      Student.deleteMany({}),
      Key.deleteMany({}),
      HostelFee.deleteMany({}),
      Complaint.deleteMany({}),
      LeaveRequest.deleteMany({})
    ]);

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Admin
    console.log('Creating Admin...');
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@hostelms.com',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      phone: '9876543210'
    });

    // 2. Create HODs
    console.log('Creating HODs...');
    const departments = ['CSE', 'AIDS', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL', 'DS', 'CS'];
    const hodNames = ['Dr. Sharma', 'Dr. Verma', 'Dr. Gupta', 'Dr. Singh', 'Dr. Patel', 'Dr. Reddy', 'Dr. Joshi', 'Dr. Das', 'Dr. Tiwari'];
    const hods = await Promise.all(departments.map((dept, i) => User.create({
      name: hodNames[i],
      email: `hod.${dept.toLowerCase()}@hostelms.com`,
      passwordHash,
      role: UserRole.HOD,
      department: dept,
      phone: `987654322${i}`
    })));

    // 3. Create Wardens
    console.log('Creating Wardens...');
    const wardenNames = ['Ramesh Kumar', 'Anita Desai'];
    const wardens = await Promise.all(wardenNames.map((name, i) => User.create({
      name,
      email: `warden${i+1}@hostelms.com`,
      passwordHash,
      role: UserRole.WARDEN,
      phone: `987654323${i}`
    })));

    // 4. Create Hostels
    console.log('Creating Hostels...');
    const hostelData = [
      { name: 'Boys Hostel', type: HostelType.BOYS, wardenId: wardens[0]._id },
      { name: 'Girls Hostel', type: HostelType.GIRLS, wardenId: wardens[1]._id }
    ];
    
    const hostels = await Promise.all(hostelData.map(h => Hostel.create({ ...h, capacity: 100 })));

    // Update Wardens with hostelId
    for (let i = 0; i < wardens.length; i++) {
      await User.findByIdAndUpdate(wardens[i]._id, { hostelId: hostels[i]._id });
    }

    // 5. Create Blocks, Floors, Rooms, Beds
    console.log('Creating Infrastructure...');
    const allBeds: any[] = [];
    const roomsByHostel: Record<string, any[]> = {};

    for (const hostel of hostels) {
      roomsByHostel[hostel._id.toString()] = [];
      const blockNames = ['AC Block', 'Non-AC Block'];
      
      for (const blockName of blockNames) {
        const block = await Block.create({ name: blockName, hostelId: hostel._id });
        
        // 2 Floors per block
        for (let f = 1; f <= 2; f++) {
          const floor = await Floor.create({ floorNumber: f, blockId: block._id });
          
          // 3 Rooms per floor
          for (let r = 1; r <= 3; r++) {
            const roomNumber = `${blockName.charAt(0)}${f}0${r}`;
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
    }

    // 6. Create Parents (15)
    console.log('Creating Parents...');
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

    // 7. Create Students (30)
    console.log('Creating Students...');
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
      0: [0, 1], 1: [2, 3], 2: [4, 5], 3: [6, 7], 4: [8, 9],
      5: [10, 11], 6: [12, 13], 7: [14, 15], 8: [16, 17], 9: [18, 19],
      10: [20, 21], 11: [22, 23], 12: [24, 25], 13: [26, 27], 14: [28, 29]
    };

    const parentToStudentsMap: Record<string, string[]> = {};
    for (const parent of parents) {
      parentToStudentsMap[parent.email] = [];
    }

    const createdStudents = [];

    for (let i = 0; i < 30; i++) {
      const studentInfo = studentNames[i];
      const rollNumber = `22CS${(i + 1).toString().padStart(3, '0')}`;
      
      // Determine parent
      let assignedParentId = undefined;
      let assignedParent = null;
      for (const [pIndex, sIndices] of Object.entries(parentAssignments)) {
        if (sIndices.includes(i)) {
          assignedParent = parents[parseInt(pIndex)];
          assignedParentId = assignedParent._id;
          break;
        }
      }

      // Determine bed
      let bedInfo;
      if (studentInfo.gender === 'M') {
        bedInfo = boysBeds[boyBedIndex++];
      } else {
        bedInfo = girlsBeds[girlBedIndex++];
      }

      // Create User
      const studentUser = await User.create({
        name: `${studentInfo.first} ${studentInfo.last}`,
        email: `student${i+1}@hostelms.com`,
        passwordHash,
        role: UserRole.STUDENT,
        phone: `987654325${i.toString().padStart(2, '0')}`
      });

      // Create Student Profile
      const student = await Student.create({
        userId: studentUser._id,
        personalDetails: {
          rollNumber,
          firstName: studentInfo.first,
          lastName: studentInfo.last,
          department: departments[i % departments.length],
          year: '2nd Year',
          gender: studentInfo.gender,
          dob: '2004-01-01',
          phone: studentUser.phone,
          email: studentUser.email,
        },
        profilePicture: `https://ui-avatars.com/api/?name=${studentInfo.first}+${studentInfo.last}&background=random`,
        parentDetails: assignedParent ? {
          parentName: assignedParent.name,
          parentPhone: assignedParent.phone || '9876543210',
          parentEmail: assignedParent.email
        } : {
          parentName: 'Default Parent',
          parentPhone: '9876543210',
          parentEmail: 'parent@hostelms.com'
        },
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
        bedId: bedInfo.bed._id,
        parentId: assignedParentId
      });

      // Update Bed Status
      await Bed.findByIdAndUpdate(bedInfo.bed._id, {
        status: BedStatus.OCCUPIED,
        studentId: student._id
      });

      // Update Parent with studentId
      if (assignedParentId) {
        await User.findByIdAndUpdate(assignedParentId, {
          $push: { studentIds: student._id }
        });
        parentToStudentsMap[assignedParent!.email].push(rollNumber);
      }

      createdStudents.push({ student, user: studentUser, hostel: bedInfo.hostel, room: bedInfo.room, bed: bedInfo.bed });
    }

    // 8. Create Fees
    console.log('Creating Fees...');
    for (const s of createdStudents) {
      await HostelFee.create({
        studentId: s.student._id,
        rollNumber: s.student.personalDetails.rollNumber,
        feeName: 'Hostel Fee Semester 1',
        amount: 1000,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: FeeStatus.PENDING
      });
      
      await HostelFee.create({
        studentId: s.student._id,
        rollNumber: s.student.personalDetails.rollNumber,
        feeName: 'Mess Fee Semester 1',
        amount: 500,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        status: FeeStatus.PAID,
        paidAt: new Date()
      });
    }

    // 9. Create Complaints
    console.log('Creating Complaints...');
    for (let i = 0; i < createdStudents.length; i++) {
      const s = createdStudents[i];
      if (i % 2 === 0) {
        await Complaint.create({
          studentId: s.student._id,
          roomId: s.room._id,
          bedId: s.bed._id,
          category: ComplaintCategory.ELECTRICAL,
          description: 'Fan is not working properly.',
          status: ComplaintStatus.OPEN,
          priority: ComplaintPriority.MEDIUM
        });
      } else {
        await Complaint.create({
          studentId: s.student._id,
          roomId: s.room._id,
          bedId: s.bed._id,
          category: ComplaintCategory.PLUMBING,
          description: 'Tap is leaking in the washroom.',
          status: ComplaintStatus.RESOLVED,
          priority: ComplaintPriority.LOW,
          resolvedAt: new Date()
        });
      }
    }

    // 10. Create Leaves
    console.log('Creating Leaves...');
    for (let i = 0; i < createdStudents.length; i++) {
      const s = createdStudents[i];
      if (i % 3 === 0) {
        await LeaveRequest.create({
          studentId: s.student._id,
          rollNumber: s.student.personalDetails.rollNumber,
          fromDate: new Date(new Date().setDate(new Date().getDate() + 2)),
          toDate: new Date(new Date().setDate(new Date().getDate() + 5)),
          reason: 'Going home for family function.',
          emergencyContact: s.student.guardianDetails.guardianPhone,
          status: LeaveStatus.PENDING_WARDEN,
          parentApprovalAt: new Date(),
          hodApprovalAt: new Date()
        });
      } else if (i % 3 === 1) {
        await LeaveRequest.create({
          studentId: s.student._id,
          rollNumber: s.student.personalDetails.rollNumber,
          fromDate: new Date(new Date().setDate(new Date().getDate() - 10)),
          toDate: new Date(new Date().setDate(new Date().getDate() - 5)),
          reason: 'Medical leave.',
          emergencyContact: s.student.guardianDetails.guardianPhone,
          status: LeaveStatus.APPROVED,
          parentApprovalAt: new Date(),
          hodApprovalAt: new Date(),
          wardenApprovalAt: new Date()
        });
      }
    }

    console.log('Database seeded successfully!');
    
    // Print Relationship Table
    console.log('\n===========================================================');
    console.log('PARENT-STUDENT MAPPING TABLE');
    console.log('===========================================================');
    console.log('Parent Name'.padEnd(20) + ' | ' + 'Parent Email'.padEnd(25) + ' | ' + 'Linked Students (Roll Numbers)');
    console.log('-----------------------------------------------------------');
    
    for (const parent of parents) {
      const linkedStudents = parentToStudentsMap[parent.email] || [];
      const studentsStr = linkedStudents.length > 0 ? linkedStudents.join(', ') : 'None';
      console.log(`${parent.name.padEnd(20)} | ${parent.email.padEnd(25)} | ${studentsStr}`);
    }
    console.log('===========================================================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedDatabase();
