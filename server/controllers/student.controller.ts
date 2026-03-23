  import { Request, Response } from 'express';
  import { AuthRequest } from '../middlewares/auth.middleware';
  import Student from '../models/Student';
  import User, { UserRole } from '../models/User';

  import bcrypt from 'bcrypt';
  import Bed from '../models/Bed';



  export const registerStudent = async (req: Request, res: Response) => {
    try {
      const { 
        name, rollNumber, email, phone, department, year, gender, password,
        parentName, parentPhone, parentEmail,
        guardianName, guardianPhone, guardianRelation,
        permanentAddress, currentAddress
      } = req.body;

      console.log("REQUEST BODY:", req.body);

      if (!rollNumber) {
        return res.status(400).json({
          message: "Roll number is required"
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Check if student with roll number exists
      const existingStudent = await Student.findOne({ 'personalDetails.rollNumber': rollNumber });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student with this roll number already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create User
      const newUser = new User({
        name,
        email,
        passwordHash,
        role: UserRole.STUDENT,
        phone
      });
      await newUser.save();

      // Create Student
      const firstName = name.split(' ')[0];
      const lastName = name.split(' ').slice(1).join(' ') || 'Unknown';

      const newStudent = new Student({
        userId: newUser._id,

        rollNumber: rollNumber,
        email: email,
        personalDetails: {
          rollNumber,
          firstName,
          lastName,
          department,
          year,
          gender: gender || 'Other',
          dob: null,
          phone,
          email
        },
        parentDetails: {
          parentName,
          parentPhone,
          parentEmail
        },
        guardianDetails: {
          guardianName,
          guardianPhone,
          guardianRelation
        },
        address: {
          permanentAddress,
          currentAddress
        }
      });
      await newStudent.save();

      res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
      console.error('Register student error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  export const getAllStudents = async (req: AuthRequest, res: Response) => {
    try {
      const assignedStudentIds = await Bed.find({ studentId: { $ne: null } })
        .distinct('studentId');

      let query: any = {};

      // If it's for room assignment, we might want to exclude assigned students
      // But for a general directory, we might want all.
      // Let's check if the request asks for unassigned only
      if (req.query.unassigned === 'true') {
        query._id = { $nin: assignedStudentIds };
      }

      // If it's for parent linking, we might want to exclude students already linked to a parent
      if (req.query.unlinkedOnly === 'true') {
        if (req.query.parentId) {
          query.$or = [{ parentId: null }, { parentId: req.query.parentId }];
        } else {
          query.parentId = null;
        }
      }

      

      if (req.user?.role === "HOD") {
        console.log(`HOD filtering students by department: "${req.user.department}"`);
        query['personalDetails.department'] = req.user.department;
      }
      if (req.user?.role === "WARDEN" && req.user.hostelId) {
        console.log(`Warden filtering students by hostelId: "${req.user.hostelId}"`);
        query.hostelId = req.user.hostelId;
      }
      console.log('Final query:', JSON.stringify(query));
      if (req.user?.role === "STUDENT") {
        query.userId = req.user.userId;
      }
      if (req.user?.role === "PARENT" && req.user.studentIds) {
        query._id = { $in: req.user.studentIds };
      }

      // Add filters from query parameters
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      if (req.query.year) {
        query['personalDetails.year'] = req.query.year;
      }
      if (req.query.department) {
        query['personalDetails.department'] = req.query.department;
      }

      const students = await Student.find(query)
        .populate('userId', 'email')
        .populate('hostelId', 'name')
        .populate('roomId', 'roomNumber');
      res.status(200).json(students);
    } catch (error) {
      console.error('Get all students error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Create student profile
  export const createStudentProfile = async (req: AuthRequest, res: Response) => {
    try {
      let userId = req.user?.userId;
      const { rollNumber, name, firstName, lastName, department, year, phone, email, parentName, parentPhone, hostel, localGuardian } = req.body;

      let studentEmail = email || `${rollNumber}@student.com`;
      let studentFirstName = firstName || (name ? name.split(' ')[0] : 'Unknown');
      let studentLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : 'Unknown');
      
      let guardianData = localGuardian || {
        name: parentName || 'Unknown',
        relation: 'Parent',
        phone: parentPhone || phone,
        address: 'Unknown'
      };

      if (req.user?.role === UserRole.SUPER_ADMIN) {
        // Create User account for the student
        const existingUser = await User.findOne({ email: studentEmail });
        if (existingUser) {
          return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        const newUser = new User({
          name: name || `${studentFirstName} ${studentLastName}`,
          email: studentEmail,
          passwordHash: 'password123', // Default password
          role: UserRole.STUDENT
        });
        await newUser.save();
        userId = newUser._id.toString();
      }
      // Check if student profile already exists for this user
      const existingProfile = await Student.findOne({ userId });
      if (existingProfile) {
        return res.status(400).json({ message: 'Student profile already exists for this user' });
      }

      // Check if roll number or email is already taken
      const duplicateStudent = await Student.findOne({ 
        $or: [
          { 'personalDetails.rollNumber': rollNumber }, 
          { 'personalDetails.email': studentEmail }
        ] 
      });
      
      if (duplicateStudent) {
        return res.status(400).json({ message: 'Student with this roll number or email already exists' });
      }

      const student = new Student({
        userId,
        personalDetails: {
          rollNumber,
          firstName: studentFirstName,
          lastName: studentLastName,
          department,
          year,
          gender: req.body.gender || '',
          dob: req.body.dob || null,
          phone: phone || '',
          email: studentEmail
        },
        parentDetails: {
          parentName: parentName || '',
          parentPhone: parentPhone || '',
          parentEmail: req.body.parentEmail || ''
        },
        guardianDetails: {
          guardianName: (localGuardian && localGuardian.name) || '',
          guardianPhone: (localGuardian && localGuardian.phone) || '',
          guardianRelation: (localGuardian && localGuardian.relation) || ''
        },
        address: {
          permanentAddress: (req.body.address && req.body.address.permanentAddress) || '',
          currentAddress: (req.body.address && req.body.address.currentAddress) || ''
        },
        hostelId: hostel || undefined
      });

      await student.save();
      res.status(201).json({ message: 'Student profile created successfully', student });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Get current student profile
  export const getMyProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      console.log('Fetching profile for userId:', userId);
      const student = await Student.findOne({ userId })
    .populate('hostelId', 'name')
    .populate('roomId', 'roomNumber')
    .populate('bedId', 'bedNumber');
      console.log('Student found:', student);
      
      if (!student) {
        console.warn('Student profile not found for userId:', userId);
        res.status(404).json({ message: 'Student profile not found' });
        return;
      }

      res.status(200).json({ student });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Update student profile
  export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      // Prevent updating critical fields like rollNumber or email through this endpoint
      const updateData = { ...req.body };
      delete updateData.rollNumber;
      delete updateData.email;
      delete updateData.userId;

      const student = await Student.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!student) {
        res.status(404).json({ message: 'Student profile not found' });
        return;
      }

      res.status(200).json({ message: 'Profile updated successfully', student });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Upload profile picture
  export const uploadProfilePicture = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      if (!req.file) {
        res.status(400).json({ message: 'No image file provided' });
        return;
      }

      const profilePictureUrl = req.file.path.startsWith('http') 
        ? req.file.path 
        : `/uploads/${req.file.filename}`;

      const student = await Student.findOneAndUpdate(
        { userId },
        { $set: { profilePicture: profilePictureUrl } },
        { new: true }
      );

      if (!student) {
        res.status(404).json({ message: 'Student profile not found' });
        return;
      }

      res.status(200).json({ 
        message: 'Profile picture uploaded successfully', 
        profilePicture: profilePictureUrl 
      });
    } catch (error) {
      console.error('Upload picture error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Parent linking
  export const linkParent = async (req: AuthRequest, res: Response) => {
    try {
      const parentId = req.user?.userId;
      const { rollNumber } = req.body;

      const student = await Student.findOne({ 'personalDetails.rollNumber': rollNumber });
      
      if (!student) {
        res.status(404).json({ message: 'Student not found with the provided roll number' });
        return;
      }

      const parentUser = await User.findById(parentId);
      if (parentUser?.studentIds?.includes(student._id)) {
        res.status(400).json({ message: 'Student is already linked to your account' });
        return;
      }

      await User.findByIdAndUpdate(parentId, {
        $addToSet: { studentIds: student._id }
      });

      // Sync parentId to Student model
      await Student.findByIdAndUpdate(student._id, { parentId });

      res.status(200).json({ message: 'Parent linked successfully to student', student });
    } catch (error) {
      console.error('Link parent error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // Get linked students for parent
  export const getLinkedStudent = async (req: AuthRequest, res: Response) => {
    try {
      const studentIds = req.user?.studentIds || [];
      console.log('Fetching linked students for studentIds:', studentIds);
      // For backward compatibility, return the first student as 'student', and all as 'students'
      const students = await Student.find({ _id: { $in: studentIds } });
      console.log('Linked students found:', students);
      
      if (!students || students.length === 0) {
        console.warn('No student linked to this parent account, studentIds:', studentIds);
        res.status(404).json({ message: 'No student linked to this parent account' });
        return;
      }

      res.status(200).json({ student: students[0], students });
    } catch (error) {
      console.error('Get linked student error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  export const getStudentById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const student = await Student.findById(id)
        .populate('userId', 'email name')
        .populate('hostelId', 'name')
        .populate('roomId', 'roomNumber')
        .populate({
      path: 'bedId',
      select: 'bedNumber',
    });

      if (!student) {
        res.status(404).json({ message: 'Student not found' });
        return;
      }

      // Authorization check
      const user = req.user!;
      console.log("WARDEN ID:", user.hostelId);
  console.log("STUDENT HOSTEL:", student.hostelId);
      
      if (user.role === UserRole.STUDENT && student.userId.toString() !== user.userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      if (user.role === UserRole.PARENT && !user.studentIds?.includes(student._id.toString())) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      if (user.role === UserRole.HOD && student.personalDetails?.department?.trim().toLowerCase() !== user.department?.trim().toLowerCase()) {
        console.log(`Access denied for HOD. Student Dept: "${student.personalDetails?.department}", User Dept: "${user.department}"`);
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      if (user.role === UserRole.WARDEN && user.hostelId && String(student.hostelId?._id) !== String(user.hostelId)) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      res.status(200).json(student);
    } catch (error) {
      console.error('Get student by id error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  // TEMPORARY: Fix legacy data migration
  export const fixLegacyData = async (req: Request, res: Response) => {
    try {
      const students = await Student.find({});
      let updatedCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      for (const student of students) {
        try {
          const studentObj = student.toObject() as any;
          let needsUpdate = false;
          
          // 1. Check personalDetails
          const pd = student.personalDetails;
          const isPdMissing = !pd;
          const isPdEmpty = pd && (Object.keys(pd).length === 0 || !pd.firstName);

          if (isPdMissing || isPdEmpty) {
            const legacyFirstName = studentObj.firstName || "Not Provided";
            const legacyLastName = studentObj.lastName || "Not Provided";
            const legacyRollNumber = studentObj.rollNumber || `LEGACY_${student._id}`;
            const legacyDepartment = studentObj.department || "Not Provided";

            student.personalDetails = {
              firstName: legacyFirstName,
              lastName: legacyLastName,
              rollNumber: legacyRollNumber,
              department: legacyDepartment,
              year: pd?.year || "",
              gender: pd?.gender || "",
              dob: (pd?.dob === "Unknown" || !pd?.dob) ? null : pd.dob,
              phone: pd?.phone || "",
              email: pd?.email || (legacyRollNumber ? `${legacyRollNumber}@example.com` : "")
            } as any;
            student.markModified('personalDetails');
            needsUpdate = true;
          }

          // 2. Check parentDetails (Required by schema)
          if (!student.parentDetails || !student.parentDetails.parentName) {
            student.parentDetails = {
              parentName: studentObj.parentName || "Not Provided",
              parentPhone: studentObj.parentPhone || "Not Provided",
              parentEmail: studentObj.parentEmail || "notprovided@example.com"
            };
            student.markModified('parentDetails');
            needsUpdate = true;
          }

          // 3. Check guardianDetails (Required by schema)
          if (!student.guardianDetails || !student.guardianDetails.guardianName) {
            student.guardianDetails = {
              guardianName: studentObj.guardianName || "Not Provided",
              guardianPhone: studentObj.guardianPhone || "Not Provided",
              guardianRelation: studentObj.guardianRelation || "Not Provided"
            };
            student.markModified('guardianDetails');
            needsUpdate = true;
          }

          // 4. Check address (Required by schema)
          if (!student.address || !student.address.permanentAddress) {
            student.address = {
              permanentAddress: studentObj.permanentAddress || "Not Provided",
              currentAddress: studentObj.currentAddress || "Not Provided"
            };
            student.markModified('address');
            needsUpdate = true;
          }

          if (needsUpdate) {
            await student.save();
            updatedCount++;
          }
        } catch (err: any) {
          errorCount++;
          errors.push({ id: student._id, error: err.message });
          console.error(`Error fixing student ${student._id}:`, err);
        }
      }

      res.status(200).json({ 
        message: 'Data migration completed', 
        total: students.length, 
        updated: updatedCount,
        errors: errorCount,
        details: errors
      });
    } catch (error) {
      console.error('Fix legacy data error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  };
