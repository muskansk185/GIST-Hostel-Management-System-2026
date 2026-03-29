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

export const startNewYearSchema = z.object({
  body: z.object({
    newYear: z.string().regex(/^\d{4}-\d{4}$/, 'Invalid academic year format (e.g., 2025-2026)')
  })
});
