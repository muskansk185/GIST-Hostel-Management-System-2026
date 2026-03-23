import { z } from 'zod';

export const applyLeaveSchema = z.object({
  body: z.object({
    fromDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid fromDate' }),
    toDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid toDate' }),
    reason: z.string().min(5, 'Reason must be at least 5 characters long'),
    emergencyContact: z.string().min(10, 'Emergency contact must be at least 10 characters long')
  }).refine((data) => new Date(data.fromDate) <= new Date(data.toDate), {
    message: 'toDate must be after or equal to fromDate',
    path: ['toDate']
  })
});

export const approveRejectLeaveSchema = z.object({
  params: z.object({
    leaveId: z.string().min(1, 'Leave ID is required')
  })
});
