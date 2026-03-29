import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import HostelFee, { FeeStatus } from '../models/HostelFee';
import Student from '../models/Student';
import AccommodationHistory from '../models/AccommodationHistory';
import Alert from '../models/Alert';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.service';

import User, { UserRole } from '../models/User';

// Admin / Warden APIs
export const createFee = async (req: Request, res: Response) => {
  try {
    const { studentId, hostelId, feeName, amount, dueDate } = req.body;

    if (hostelId) {
      const hostelIds = Array.isArray(hostelId) ? hostelId : [hostelId];
      
      // Find all students in these hostels
      const students = await Student.find({ hostelId: { $in: hostelIds } });
      
      if (students.length === 0) {
        return res.status(404).json({ message: 'No students found in the selected hostels' });
      }

      const fees = students.map(student => ({
        studentId: student._id,
        rollNumber: student.personalDetails?.rollNumber,
        feeName: feeName || 'Hostel Fee',
        amount,
        dueDate: new Date(dueDate),
        status: FeeStatus.PENDING
      }));

      await HostelFee.insertMany(fees);

      const alerts = students.map(student => ({
        userId: student.userId,
        title: 'New Fee Generated',
        message: `A new fee of ₹${amount} has been generated. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'WARNING'
      }));
      await Alert.insertMany(alerts);

      return res.status(201).json({ message: `Fee records created successfully for ${students.length} students across ${hostelIds.length} hostels` });
    } else if (studentId) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const fee = new HostelFee({
        studentId: student._id,
        rollNumber: student.personalDetails?.rollNumber,
        feeName: feeName || 'Hostel Fee',
        amount,
        dueDate: new Date(dueDate),
        status: FeeStatus.PENDING
      });

      await fee.save();

      await Alert.create({
        userId: student.userId,
        title: 'New Fee Generated',
        message: `A new fee of ₹${amount} has been generated. Due date: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'WARNING'
      });

      return res.status(201).json({ message: 'Fee record created successfully', fee });
    } else {
      return res.status(400).json({ message: 'Either studentId or hostelId is required' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const fees = await HostelFee.find({ studentId }).sort({ dueDate: -1 });
    res.status(200).json(fees);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getHostelFees = async (req: Request, res: Response) => {
  try {
    const { hostelId } = req.params;
    
    // Find all active accommodations in this hostel
    const accommodations = await AccommodationHistory.find({
      hostelId,
      vacatedAt: { $exists: false }
    });

    const studentIds = accommodations.map(acc => acc.studentId);

    const fees = await HostelFee.find({
      studentId: { $in: studentIds }
    }).populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department');

    const formattedFees = fees.map(f => ({
      ...f.toObject(),
      student: f.studentId ? {
        personalDetails: {
          firstName: (f.studentId as any).personalDetails?.firstName || '',
          lastName: (f.studentId as any).personalDetails?.lastName || '',
          rollNumber: (f.studentId as any).personalDetails?.rollNumber || '',
          department: (f.studentId as any).personalDetails?.department || ''
        }
      } : null
    }));

    res.status(200).json(formattedFees);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRevenue = async (req: AuthRequest, res: Response) => {
  try {
    // Get revenue by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const matchStage: any = {
      status: FeeStatus.PAID,
      paidAt: { $gte: sixMonthsAgo }
    };

    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ 'personalDetails.department': req.user.department }).select('_id');
      matchStage.studentId = { $in: students.map(s => s._id) };
    }

    const revenue = await HostelFee.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$paidAt" }
          },
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $sort: {
          "_id": 1
        }
      }
    ]);

    // Format for the frontend chart
    // const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // // Create an array of the last 6 months to ensure we have data points even if revenue is 0
    // const formattedData = [];
    // for (let i = 5; i >= 0; i--) {
    //   const d = new Date();
    //   d.setMonth(d.getMonth() - i);
    //   const year = d.getFullYear();
    //   const month = d.getMonth() + 1; // 1-12
    //   const monthStr = month < 10 ? `0${month}` : `${month}`;
    //   const dateStr = `${year}-${monthStr}`;
      
    //   const found = revenue.find(r => r._id === dateStr);
      
    //   formattedData.push({
    //     month: `${monthNames[month - 1]} ${year}`,
    //     amount: found ? found.totalAmount : 0
    //   });
    // }

    // res.status(200).json(formattedData);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ✅ Create lookup map (O(1) access)
const revenueMap = new Map();
revenue.forEach(r => {
  revenueMap.set(r._id, r.totalAmount);
});

const formattedData = [];

for (let i = 5; i >= 0; i--) {
  // ✅ FIX: create fresh date each iteration
  const d = new Date();
  d.setDate(1); // prevent overflow issues
  d.setMonth(d.getMonth() - i);

  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const dateStr = `${year}-${monthStr}`;

  formattedData.push({
    month: `${monthNames[month - 1]} ${year}`,
    amount: revenueMap.get(dateStr) || 0
  });
}

res.status(200).json(formattedData);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllFees = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};

    if (req.user?.role === "WARDEN" && req.user.hostelId) {
      const students = await Student.find({ hostelId: req.user.hostelId }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "HOD" && req.user.department) {
      const students = await Student.find({ 'personalDetails.department': req.user.department }).select('_id');
      filter.studentId = { $in: students.map(s => s._id) };
    } else if (req.user?.role === "STUDENT") {
      const student = await Student.findOne({ userId: req.user.userId }).select('_id');
      filter.studentId = student ? student._id : null;
    } else if (req.user?.role === "PARENT" && req.user.studentIds) {
      filter.studentId = { $in: req.user.studentIds };
    }

    const fees = await HostelFee.find(filter)
      .populate('studentId', 'personalDetails.firstName personalDetails.lastName personalDetails.rollNumber personalDetails.department')
      .sort({ dueDate: -1 });

    const formattedFees = fees.map(f => ({
      ...f.toObject(),
      student: f.studentId ? {
        personalDetails: {
          firstName: (f.studentId as any).personalDetails?.firstName || '',
          lastName: (f.studentId as any).personalDetails?.lastName || '',
          rollNumber: (f.studentId as any).personalDetails?.rollNumber || '',
          department: (f.studentId as any).personalDetails?.department || ''
        }
      } : null
    }));

    res.status(200).json(formattedFees);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Student APIs
export const getMyFees = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const student = await Student.findOne({ userId });
    
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const fees = await HostelFee.find({ studentId: student._id }).sort({ dueDate: -1 });
    res.status(200).json(fees);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { feeId } = req.body;

    const student = await Student.findOne({ userId });
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const fee = await HostelFee.findOne({ _id: feeId, studentId: student._id });
    if (!fee) {
      res.status(404).json({ message: 'Fee record not found' });
      return;
    }

    if (fee.status === FeeStatus.PAID) {
      res.status(400).json({ message: 'Fee is already paid' });
      return;
    }

    const order = await createRazorpayOrder(fee.amount, fee._id.toString());
    
    fee.razorpayOrderId = order.id;
    await fee.save();

    res.status(200).json({ 
      order, 
      keyId: process.env.RAZORPAY_KEY_ID 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { feeId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const student = await Student.findOne({ userId });
    if (!student) {
      res.status(404).json({ message: 'Student profile not found' });
      return;
    }

    const fee = await HostelFee.findOne({ _id: feeId, studentId: student._id });
    if (!fee) {
      res.status(404).json({ message: 'Fee record not found' });
      return;
    }

    if (fee.status === FeeStatus.PAID) {
      res.status(400).json({ message: 'Fee is already paid' });
      return;
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      res.status(400).json({ message: 'Invalid payment signature' });
      return;
    }

    fee.status = FeeStatus.PAID;
    fee.razorpayPaymentId = razorpayPaymentId;
    fee.paidAt = new Date();
    await fee.save();

    // Create alert for student
    await Alert.create({
      userId,
      title: 'Payment Successful',
      message: `Your payment of ₹${fee.amount} for ${fee.feeName} has been received.`,
      type: 'SUCCESS'
    });

    res.status(200).json({ message: 'Payment verified successfully', fee });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const dbUser = await User.findById(user.userId);
    if (!dbUser) return res.status(404).json({ message: 'User not found' });

    let query: any = {};

    if (dbUser.role === UserRole.STUDENT) {
      const student = await Student.findOne({ userId: dbUser._id });
      query.studentId = student?._id;
    } else if (dbUser.role === UserRole.PARENT) {
      query.studentId = { $in: dbUser.studentIds };
    } else if (dbUser.role === UserRole.HOD) {
      const students = await Student.find({ 'personalDetails.department': dbUser.department }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    } else if (dbUser.role === UserRole.WARDEN) {
      const students = await Student.find({ hostelId: dbUser.hostelId }).select('_id');
      query.studentId = { $in: students.map(s => s._id) };
    } else if (dbUser.role === UserRole.SUPER_ADMIN) {
      // All payments
    }

    const payments = await HostelFee.find(query)
      // .populate('studentId', 'firstName lastName rollNumber department')
      .populate({
        path: 'studentId',
        select: 'personalDetails' 
      })
      .sort({ paidAt: -1, createdAt: -1 });

    const formattedPayments = payments.map(p => ({
      _id: p._id,
      // student: {
      //   name: p.studentId ? `${(p.studentId as any).firstName} ${(p.studentId as any).lastName}` : 'N/A',
      //   rollNumber: (p.studentId as any)?.rollNumber || 'N/A',
      //   department: (p.studentId as any)?.department || 'N/A'
      // },
      student: p.studentId ? {
        personalDetails: {
          firstName: (p.studentId as any).personalDetails?.firstName || '',
          lastName: (p.studentId as any).personalDetails?.lastName || '',
          rollNumber: (p.studentId as any).personalDetails?.rollNumber || '',
          department: (p.studentId as any).personalDetails?.department || ''
        }
      } : null,
      amount: p.amount,
      status: p.status,
      transactionId: p.razorpayPaymentId || 'N/A',
      date: p.paidAt || p.createdAt
    }));

    res.status(200).json(formattedPayments);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFeeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = req.user!;

    // Authorization check
    if (user.role === UserRole.HOD) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      if (student.personalDetails?.department?.trim().toLowerCase() !== user.department?.trim().toLowerCase()) {
        return res.status(403).json({ message: 'Access denied: Student does not belong to your department' });
      }
    } else if (user.role === UserRole.WARDEN) {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      if (student.hostelId?.toString() !== user.hostelId) {
        return res.status(403).json({ message: 'Access denied: Student does not belong to your hostel' });
      }
    } else if (user.role === UserRole.STUDENT) {
      const student = await Student.findOne({ userId: user.userId });
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Access denied: You can only view your own fee status' });
      }
    } else if (user.role === UserRole.PARENT) {
      if (!user.studentIds?.includes(studentId)) {
        return res.status(403).json({ message: 'Access denied: Student not linked to your account' });
      }
    }
    
    const fees = await HostelFee.find({ studentId });
    
    const totalAmount = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidAmount = fees.filter(f => f.status === FeeStatus.PAID).reduce((sum, f) => sum + f.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    
    const lastPayment = fees
      .filter(f => f.status === FeeStatus.PAID && f.paidAt)
      .sort((a, b) => (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0))[0];

    res.status(200).json({
      isPaid: pendingAmount <= 0,
      totalAmount,
      paidAmount,
      pendingAmount,
      lastPaymentDate: lastPayment ? lastPayment.paidAt : null
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
