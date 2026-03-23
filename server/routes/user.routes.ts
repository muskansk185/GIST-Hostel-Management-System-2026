import { Router } from 'express';
import { getUsers, createUser, updateUser, updateUserRole, updateUserStatus } from '../controllers/user.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Get users (allow WARDEN and HOD for fetching parent details)
router.get('/', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN, UserRole.HOD), getUsers);

// Protect all other routes with JWT and SUPER_ADMIN role
router.use(authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN));

router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', updateUserStatus);

export default router;
