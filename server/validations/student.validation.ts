import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const registerStudentSchema = z.object({
  body: z.object({
    rollNumber: z.string().min(1, 'Roll number is required'),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    department: z.string().min(1, 'Department is required'),
    year: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    email: z.string().email('Invalid email address').optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    hostel: z.string().optional(),
    localGuardian: z.object({
      name: z.string().min(1, 'Guardian name is required'),
      relation: z.string().min(1, 'Guardian relation is required'),
      phone: z.string().regex(phoneRegex, 'Invalid guardian phone number format'),
      address: z.string().min(1, 'Guardian address is required'),
    }).optional()
  })
});

export const updateStudentSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    department: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format').optional(),
    localGuardian: z.object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phone: z.string().regex(phoneRegex, 'Invalid guardian phone number format').optional(),
      address: z.string().optional(),
    }).optional()
  })
});

export const linkParentSchema = z.object({
  body: z.object({
    rollNumber: z.string().min(1, 'Roll number is required')
  })
});
