import { Router } from 'express';
import {
  getSystemStats,
  getOccupancyStats,
  getRevenueStats,
  getComplaintStats,
  getOccupancyAnalytics,
  getComplaintAnalytics,
  getFeeAnalytics,
  getLeaveAnalytics,
  getStudentDistribution,
  getCommonComplaintCategories
} from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// All analytics routes require SUPER_ADMIN or WARDEN role
router.use(authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN));

// New routes for Super Admin Analytics
router.get('/stats', getSystemStats);
router.get('/occupancy', getOccupancyStats);
router.get('/revenue', getRevenueStats);
router.get('/complaints', getComplaintStats);
router.get('/complaints/common', getCommonComplaintCategories);

// Old routes (used by AdminDashboard and WardenDashboard)
router.get('/dashboard/occupancy', getOccupancyAnalytics);
router.get('/dashboard/complaints', getComplaintAnalytics);
router.get('/dashboard/fees', getFeeAnalytics);
router.get('/dashboard/leaves', getLeaveAnalytics);
router.get('/dashboard/departments', getStudentDistribution);

export default router;
