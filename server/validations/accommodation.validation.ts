import { z } from 'zod';

export const assignAccommodationSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    bedId: z.string().min(1, 'Bed ID is required')
  })
});

export const transferAccommodationSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    newBedId: z.string().min(1, 'New Bed ID is required')
  })
});

export const vacateAccommodationSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required')
  })
});
