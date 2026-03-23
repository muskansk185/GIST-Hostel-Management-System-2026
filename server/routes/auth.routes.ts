import { Router } from 'express';
import { register, login, changePassword } from '../controllers/auth.controller';
import { authenticateJWT, authorizeRoles, AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.post('/change-password', authenticateJWT, changePassword);

// Protected route example
router.get('/me', authenticateJWT, (req: AuthRequest, res) => {
  res.json({ message: 'User profile data', user: req.user });
});

// Admin only route example
router.get('/admin-only', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), (req, res) => {
  res.json({ message: 'Admin data accessed successfully' });
});

import User from '../models/User';

router.get('/users', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN), async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
