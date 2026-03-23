import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { createNotice, getNotices } from '../controllers/notice.controller';
import { UserRole } from '../models/User';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles(UserRole.SUPER_ADMIN, UserRole.WARDEN), createNotice);
router.get('/', authenticateJWT, getNotices);

export default router;
