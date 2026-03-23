import { Router } from 'express';
import { seedDatabase, clearDatabase } from '../controllers/seed.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

router.post('/seed', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), seedDatabase);
router.post('/clear', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), clearDatabase);

export default router;
