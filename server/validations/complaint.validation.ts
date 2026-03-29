import { z } from 'zod';
import { ComplaintCategory, ComplaintStatus, ComplaintUrgency } from '../models/Complaint';

export const createComplaintSchema = z.object({
  body: z.object({
    roomId: z.string().min(1, 'Room ID is required'),
    bedId: z.string().min(1, 'Bed ID is required'),
    category: z.nativeEnum(ComplaintCategory, { error: 'Invalid category' }),
    title: z.string().min(5, 'Title must be at least 5 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    urgency: z.nativeEnum(ComplaintUrgency).optional()
  })
});

export const updateComplaintStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ComplaintStatus, { error: 'Invalid status' })
  })
});

export const updateComplaintPrioritySchema = z.object({
  body: z.object({
    urgency: z.nativeEnum(ComplaintUrgency, { error: 'Invalid urgency' })
  })
});

export const assignStaffSchema = z.object({
  body: z.object({
    assignedStaff: z.string().min(1, 'Assigned staff name is required')
  })
});

export const assignWardenSchema = z.object({
  body: z.object({
    wardenId: z.string().min(1, 'Warden ID is required')
  })
});
