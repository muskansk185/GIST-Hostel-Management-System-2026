import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';
import { getDepartmentStudents, getDepartmentAnalytics } from '../controllers/hod.controller';

const router = express.Router();

// All routes require HOD role
router.use(authenticateJWT, authorizeRoles(UserRole.HOD, UserRole.SUPER_ADMIN));

router.get('/students', getDepartmentStudents);
router.get('/analytics', getDepartmentAnalytics);

export default router;
