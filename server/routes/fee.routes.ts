import { Router } from 'express';
import {
  createFee,
  getStudentFees,
  getHostelFees,
  getMyFees,
  createOrder,
  verifyPayment,
  getRevenue,
  getAllFees,
  getPaymentHistory,
  getFeeStatus
} from '../controllers/fee.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createFeeSchema, createOrderSchema, verifyPaymentSchema } from '../validations/fee.validation';
import { UserRole } from '../models/User';

const router = Router();

// Common APIs
router.get('/history', authenticateJWT, getPaymentHistory);

// Admin / Warden APIs
router.get('/revenue', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), getRevenue);
router.get('/all', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), getAllFees);
router.post('/', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(createFeeSchema), createFee);
router.post('/create', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(createFeeSchema), createFee);
router.get('/student/:studentId', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.PARENT), getStudentFees);
router.get('/status/:studentId', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.PARENT, UserRole.STUDENT, UserRole.HOD), getFeeStatus);
router.get('/hostel/:hostelId', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), getHostelFees);

// Student APIs
router.get('/me', authenticateJWT, authorizeRoles(UserRole.STUDENT), getMyFees);
router.get('/my-fees', authenticateJWT, authorizeRoles(UserRole.STUDENT), getMyFees);
router.post('/create-order', authenticateJWT, authorizeRoles(UserRole.STUDENT), validateRequest(createOrderSchema), createOrder);
router.post('/verify-payment', authenticateJWT, authorizeRoles(UserRole.STUDENT), validateRequest(verifyPaymentSchema), verifyPayment);

export default router;
