import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Hostel from '../models/Hostel';
import Student from '../models/Student';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone, hostelId, department, studentIds, personalDetails, parentDetails, guardianDetails, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (role === 'HOD' && !department) {
      return res.status(400).json({ message: 'Department is required for HOD' });
    }

    if (role === 'WARDEN' && !hostelId) {
      return res.status(400).json({ message: 'Hostel ID is required for Warden' });
    }

    if (role === 'STUDENT') {
      if (!personalDetails || !parentDetails || !guardianDetails || !address) {
        return res.status(400).json({ message: 'Personal details, parent details, guardian details, and address are required for Student' });
      }
    }

    if (role === 'PARENT' && (!studentIds || studentIds.length === 0)) {
      return res.status(400).json({ message: 'Student IDs are required for Parent' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role,
      phone,
      hostelId: hostelId === "" ? undefined : hostelId,
      department: department === "" ? undefined : department,
      studentIds: role === 'PARENT' ? studentIds : undefined,
      isActive: true
    });

    await newUser.save();

    if (role === 'PARENT' && studentIds && studentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { parentId: newUser._id } }
      );
    }

    if (role === 'WARDEN' && hostelId) {
      await Hostel.findByIdAndUpdate(hostelId, { wardenId: newUser._id });
    }

    if (role === 'STUDENT') {
      const firstName = name.split(' ')[0];
      const lastName = name.split(' ').slice(1).join(' ') || 'Unknown';
      
      const newStudent = new Student({
        userId: newUser._id,
        personalDetails: {
          ...personalDetails,
          firstName: personalDetails.firstName || firstName,
          lastName: personalDetails.lastName || lastName,
          email: personalDetails.email || email,
          phone: personalDetails.phone || phone || 'N/A'
        },
        parentDetails: {
          ...parentDetails,
          parentEmail: parentDetails.parentEmail || 'N/A'
        },
        guardianDetails,
        address
      });
      await newStudent.save();
    }

    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      isActive: newUser.isActive,
      createdAt: (newUser as any).createdAt,
      profilePicture: newUser.profilePicture
    };

    res.status(201).json(userResponse);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Sanitize ObjectId fields: convert empty strings to null
    const objectIdFields = ['hostelId', 'blockId', 'roomId', 'bedId', 'parentId'];
    objectIdFields.forEach(field => {
      if (updateData[field] === "") {
        updateData[field] = null;
      }
    });

    if (updateData.studentIds === "" || updateData.studentIds === undefined) {
      updateData.studentIds = [];
    } else if (!Array.isArray(updateData.studentIds)) {
      updateData.studentIds = [updateData.studentIds];
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle hostel history tracking if hostelId is being updated
    if (updateData.hostelId !== undefined && updateData.hostelId !== user.hostelId?.toString()) {
      // Close previous assignment
      if (user.hostelId) {
        const activeAssignment = user.hostelHistory.find((h: any) => h.assignedTo === null && h.hostel?.toString() === user.hostelId?.toString());
        if (activeAssignment) {
          activeAssignment.assignedTo = new Date();
        }
      }

      // Add new assignment
      if (updateData.hostelId) {
        user.hostelHistory.push({
          hostel: updateData.hostelId,
          assignedFrom: new Date(),
          assignedTo: null
        });
      }
      user.hostelId = updateData.hostelId;
    }

    // Update other fields
    Object.assign(user, updateData);
    await user.save();
    
    const updatedUser = await User.findById(id).select('-password');

    // Update role-specific details if role is STUDENT
    if (updatedUser.role === 'STUDENT') {
      let student = await Student.findOne({ userId: updatedUser._id });
      
      if (!student) {
        student = new Student({ userId: updatedUser._id });
      }

      if (!student.personalDetails) student.personalDetails = {} as any;
      if (updateData.personalDetails) student.personalDetails = { ...student.personalDetails, ...updateData.personalDetails };
      
      if (updateData.name) {
        const firstName = updateData.name.split(' ')[0];
        const lastName = updateData.name.split(' ').slice(1).join(' ') || 'Unknown';
        student.personalDetails.firstName = firstName;
        student.personalDetails.lastName = lastName;
      }
      if (updateData.email) {
        student.personalDetails.email = updateData.email;
      }

      if (!student.parentDetails) student.parentDetails = {} as any;
      if (updateData.parentDetails) student.parentDetails = { ...student.parentDetails, ...updateData.parentDetails };
      
      if (!student.guardianDetails) student.guardianDetails = {} as any;
      if (updateData.guardianDetails) student.guardianDetails = { ...student.guardianDetails, ...updateData.guardianDetails };
      
      if (!student.address) student.address = {} as any;
      if (updateData.address) student.address = { ...student.address, ...updateData.address };
      
      // Update top-level fields in Student model
      if (updateData.hostelId !== undefined) student.hostelId = updateData.hostelId;
      if (updateData.blockId !== undefined) student.blockId = updateData.blockId;
      if (updateData.roomId !== undefined) student.roomId = updateData.roomId;
      if (updateData.bedId !== undefined) student.bedId = updateData.bedId;

      await student.save();
    }

    // Sync parentId in Student model if PARENT role and studentIds updated
    if (updatedUser.role === 'PARENT' && updateData.studentIds) {
      // Clear parentId for students no longer in the list
      await Student.updateMany(
        { parentId: updatedUser._id, _id: { $nin: updateData.studentIds } },
        { $set: { parentId: null } }
      );
      // Set parentId for students in the new list
      await Student.updateMany(
        { _id: { $in: updateData.studentIds } },
        { $set: { parentId: updatedUser._id } }
      );
    }

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search, studentId } = req.query;
    
    const match: any = {};
    
    if (role && role !== 'All') {
      match.role = role;
    }

    if (studentId) {
      match.studentIds = studentId;
    }
    
    if (status && status !== 'All') {
      match.isActive = status === 'Active';
    }
    
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'userId',
          as: 'studentDetails'
        }
      },
      {
        $addFields: {
          profilePicture: {
            $cond: {
              if: { $gt: [{ $size: '$studentDetails' }, 0] },
              then: { $arrayElemAt: ['$studentDetails.profilePicture', 0] },
              else: '$profilePicture'
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          isActive: 1,
          createdAt: 1,
          studentIds: 1,
          phone: 1,
          hostelId: 1,
          department: 1,
          profilePicture: 1,
          hostelHistory: 1
        }
      }
    ]);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getParentByStudentId = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const parent = await User.findOne({ 
      role: 'PARENT', 
      studentIds: studentId 
    }).select('id name email role phone isActive createdAt profilePicture');

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found for this student' });
    }

    res.json([parent]); // Return as array to match frontend expectation
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('id name email role isActive createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: 'Status (isActive) is required' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('id name email role isActive createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
