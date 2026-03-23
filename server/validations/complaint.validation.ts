import { z } from 'zod';
import { ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../models/Complaint';

export const createComplaintSchema = z.object({
  body: z.object({
    roomId: z.string().min(1, 'Room ID is required'),
    bedId: z.string().min(1, 'Bed ID is required'),
    category: z.nativeEnum(ComplaintCategory, { error: 'Invalid category' }),
    title: z.string().min(5, 'Title must be at least 5 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    priority: z.nativeEnum(ComplaintPriority).optional()
  })
});

export const updateComplaintStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ComplaintStatus, { error: 'Invalid status' })
  })
});

export const updateComplaintPrioritySchema = z.object({
  body: z.object({
    priority: z.nativeEnum(ComplaintPriority, { error: 'Invalid priority' })
  })
});

export const assignStaffSchema = z.object({
  body: z.object({
    assignedStaff: z.string().min(1, 'Assigned staff name is required')
  })
});
