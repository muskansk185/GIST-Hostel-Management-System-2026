import { Router } from 'express';
import { getSystemInfo, toggleMaintenanceMode } from '../controllers/system.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.use(authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN));

router.get('/info', getSystemInfo);
router.post('/maintenance', toggleMaintenanceMode);

export default router;
