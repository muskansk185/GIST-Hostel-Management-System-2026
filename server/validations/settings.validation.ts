import { z } from 'zod';

export const updateMaintenanceSchema = z.object({
  body: z.object({
    maintenanceMode: z.boolean(),
    message: z.string().optional(),
  }),
});
