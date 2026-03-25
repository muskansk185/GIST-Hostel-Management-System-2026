import { Router } from 'express';
import { 
  createStudentProfile, 
  getMyProfile, 
  updateProfile, 
  uploadProfilePicture, 
  linkParent, 
  getLinkedStudent,
  getAllStudents,
  getStudentById,
  registerStudent,
  fixLegacyData
} from '../controllers/student.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { upload } from '../middlewares/upload.middleware';
import { 
  registerStudentSchema, 
  updateStudentSchema, 
  linkParentSchema 
} from '../validations/student.validation';
import { UserRole } from '../models/User';

const router = Router();

// ==========================================
// STUDENT ROUTES
// ==========================================

// Public registration
router.post('/register', registerStudent);

// TEMPORARY: Fix legacy data migration
router.get(
  '/fix-data',
  authenticateJWT,
  authorizeRoles(UserRole.SUPER_ADMIN),
  fixLegacyData
);

// Get all students (Admin/Warden)
router.get(
  '/',
  authenticateJWT,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN),
  getAllStudents
);

// Get own student profile
router.get(
  '/me', 
  authenticateJWT, 
  authorizeRoles(UserRole.STUDENT), 
  getMyProfile
);

// Upload profile picture
router.post(
  '/profile-picture',
  authenticateJWT,
  authorizeRoles(UserRole.STUDENT),
  upload.single('profilePicture'),
  uploadProfilePicture
);

// Get linked student's information for parent
router.get(
  '/linked-student', 
  authenticateJWT, 
  authorizeRoles(UserRole.PARENT), 
  getLinkedStudent
);

// Link parent to student
router.post(
  '/link-parent',
  authenticateJWT,
  authorizeRoles(UserRole.PARENT),
  validateRequest(linkParentSchema),
  linkParent
);

// Get student by ID
router.get(
  '/:id',
  authenticateJWT,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.HOD, UserRole.PARENT, UserRole.STUDENT),
  getStudentById
);

export default router;
