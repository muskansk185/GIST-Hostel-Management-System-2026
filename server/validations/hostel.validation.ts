import { z } from 'zod';

export const createHostelSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Hostel name is required'),
    type: z.enum(['BOYS', 'GIRLS', 'MIXED']),
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    wardenId: z.string().optional(),
    description: z.string().optional()
  })
});

export const updateHostelSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Hostel name is required').optional(),
    type: z.enum(['BOYS', 'GIRLS', 'MIXED']).optional(),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
    wardenId: z.string().optional(),
    description: z.string().optional()
  })
});

export const createBlockSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Block name is required'),
    hostelId: z.string().min(1, 'Hostel ID is required')
  })
});

export const updateBlockSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Block name is required').optional(),
    hostelId: z.string().min(1, 'Hostel ID is required').optional()
  })
});

export const createFloorSchema = z.object({
  body: z.object({
    floorNumber: z.number().int(),
    blockId: z.string().min(1, 'Block ID is required')
  })
});

export const updateFloorSchema = z.object({
  body: z.object({
    floorNumber: z.number().int().optional(),
    blockId: z.string().min(1, 'Block ID is required').optional()
  })
});

export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, 'Room number is required'),
    floorId: z.string().min(1, 'Floor ID is required'),
    capacity: z.number().int().min(1, 'Capacity must be at least 1')
  })
});

export const updateRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1, 'Room number is required').optional(),
    floorId: z.string().min(1, 'Floor ID is required').optional(),
    capacity: z.number().int().min(1, 'Capacity must be at least 1').optional()
  })
});

export const createBedSchema = z.object({
  body: z.object({
    bedNumber: z.string().min(1, 'Bed number is required'),
    roomId: z.string().min(1, 'Room ID is required')
  })
});

export const assignBedSchema = z.object({
  body: z.object({
    studentId: z.string().min(1, 'Student ID is required')
  })
});

export const updateBedStatusSchema = z.object({
  body: z.object({
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'])
  })
});
