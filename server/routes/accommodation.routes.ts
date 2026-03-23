import { Router } from 'express';
import {
  assignAccommodation,
  transferAccommodation,
  vacateAccommodation,
  getStudentAccommodation,
  getMyAccommodation,
  getRoomOccupants,
  getHostelOccupancyStats
} from '../controllers/accommodation.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import {
  assignAccommodationSchema,
  transferAccommodationSchema,
  vacateAccommodationSchema
} from '../validations/accommodation.validation';
import { UserRole } from '../models/User';

const router = Router();

// Warden/Admin APIs
router.post('/assign', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(assignAccommodationSchema), assignAccommodation);
router.post('/transfer', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(transferAccommodationSchema), transferAccommodation);
router.post('/vacate', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), validateRequest(vacateAccommodationSchema), vacateAccommodation);

// Query APIs
router.get('/me', authenticateJWT, authorizeRoles(UserRole.STUDENT), getMyAccommodation);
router.get('/student/:studentId', authenticateJWT, getStudentAccommodation);
router.get('/room/:roomId', authenticateJWT, getRoomOccupants);
router.get('/hostel/:hostelId', authenticateJWT, getHostelOccupancyStats);

export default router;
