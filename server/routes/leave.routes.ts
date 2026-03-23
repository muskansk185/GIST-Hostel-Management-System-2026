import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getStudentLeaves,
  getPendingParentLeaves,
  approveParentLeave,
  rejectParentLeave,
  getPendingHODLeaves,
  approveHODLeave,
  rejectHODLeave,
  getPendingWardenLeaves,
  getWardenLeaveHistory,
  approveWardenLeave,
  rejectWardenLeave,
  getLeaveHistory
} from '../controllers/leave.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { applyLeaveSchema, approveRejectLeaveSchema } from '../validations/leave.validation';
import { UserRole } from '../models/User';

const router = Router();

// Common APIs
router.get('/history', authenticateJWT, getLeaveHistory);

// Student APIs
router.post('/apply', authenticateJWT, authorizeRoles(UserRole.STUDENT), validateRequest(applyLeaveSchema), applyLeave);
router.get('/my-leaves', authenticateJWT, authorizeRoles(UserRole.STUDENT), getMyLeaves);

// Parent APIs
router.get('/parent/pending', authenticateJWT, authorizeRoles(UserRole.PARENT), getPendingParentLeaves);
router.get('/student/:studentId', authenticateJWT, authorizeRoles(UserRole.PARENT, UserRole.SUPER_ADMIN, UserRole.WARDEN), getStudentLeaves);
router.put('/parent/:leaveId/approve', authenticateJWT, authorizeRoles(UserRole.PARENT), validateRequest(approveRejectLeaveSchema), approveParentLeave);
router.put('/parent/:leaveId/reject', authenticateJWT, authorizeRoles(UserRole.PARENT), validateRequest(approveRejectLeaveSchema), rejectParentLeave);

// HOD APIs
router.get('/hod/pending', authenticateJWT, authorizeRoles(UserRole.HOD), getPendingHODLeaves);
router.put('/hod/:leaveId/approve', authenticateJWT, authorizeRoles(UserRole.HOD), validateRequest(approveRejectLeaveSchema), approveHODLeave);
router.put('/hod/:leaveId/reject', authenticateJWT, authorizeRoles(UserRole.HOD), validateRequest(approveRejectLeaveSchema), rejectHODLeave);

// Warden APIs
router.get('/warden/pending', authenticateJWT, authorizeRoles(UserRole.WARDEN), getPendingWardenLeaves);
router.get('/warden/history', authenticateJWT, authorizeRoles(UserRole.WARDEN), getWardenLeaveHistory);
router.put('/warden/:leaveId/approve', authenticateJWT, authorizeRoles(UserRole.WARDEN), validateRequest(approveRejectLeaveSchema), approveWardenLeave);
router.put('/warden/:leaveId/reject', authenticateJWT, authorizeRoles(UserRole.WARDEN), validateRequest(approveRejectLeaveSchema), rejectWardenLeave);

export default router;
