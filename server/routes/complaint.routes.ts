import { Router } from 'express';
import {
  createComplaint,
  getMyComplaints,
  getStudentComplaints,
  getAllComplaints,
  updateComplaintStatus,
  updateComplaintPriority,
  assignStaff,
  assignWarden,
  getRoomComplaints,
  getComplaintAnalytics
} from '../controllers/complaint.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  updateComplaintPrioritySchema,
  assignStaffSchema,
  assignWardenSchema
} from '../validations/complaint.validation';
import { UserRole } from '../models/User';

const router = Router();

// Analytics API (Must be before /:complaintId routes)
router.get('/analytics', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), getComplaintAnalytics);

// Student APIs
router.post('/create', authenticateJWT, authorizeRoles(UserRole.STUDENT), validateRequest(createComplaintSchema), createComplaint);
router.get('/my-complaints', authenticateJWT, authorizeRoles(UserRole.STUDENT), getMyComplaints);
router.get('/student/:studentId', authenticateJWT, authorizeRoles(UserRole.PARENT, UserRole.SUPER_ADMIN, UserRole.WARDEN), getStudentComplaints);

// Warden / Admin APIs
router.get('/', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), getAllComplaints);
router.patch('/:complaintId/status', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(updateComplaintStatusSchema), updateComplaintStatus);
router.patch('/:complaintId/priority', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(updateComplaintPrioritySchema), updateComplaintPriority);
router.patch('/:complaintId/assign-staff', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(assignStaffSchema), assignStaff);
router.patch('/:complaintId/assign', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(assignWardenSchema), assignWarden);

// Room Complaint API
router.get('/room/:roomId', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), getRoomComplaints);

export default router;
