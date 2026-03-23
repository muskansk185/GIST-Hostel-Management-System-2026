import { z } from 'zod';

export const createFeeSchema = z.object({
  body: z.object({
    studentId: z.string().optional(),
    hostelId: z.string().optional(),
    feeName: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid dueDate' })
  }).refine(data => data.studentId || data.hostelId, {
    message: "Either studentId or hostelId is required",
    path: ["studentId"]
  })
});

export const createOrderSchema = z.object({
  body: z.object({
    feeId: z.string().min(1, 'Fee ID is required')
  })
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    feeId: z.string().min(1, 'Fee ID is required'),
    razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
    razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
    razorpaySignature: z.string().min(1, 'Razorpay Signature is required')
  })
});
