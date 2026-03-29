import { Router } from 'express';
import { getSettings, updateMaintenanceMode } from '../controllers/settings.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { updateMaintenanceSchema } from '../validations/settings.validation';
import { UserRole } from '../models/User';

const router = Router();

router.get('/', getSettings);
router.patch('/maintenance', 
  authenticateJWT, 
  authorizeRoles(UserRole.SUPER_ADMIN), 
  validateRequest(updateMaintenanceSchema),
  updateMaintenanceMode
);

export default router;
