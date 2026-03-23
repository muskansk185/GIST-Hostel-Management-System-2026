import express from 'express';
import { getAlerts, markAsRead, markAllAsRead } from '../controllers/alert.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getAlerts);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
