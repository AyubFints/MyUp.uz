import express from 'express';
import { getUserNotifications, deleteNotification, markNotificationsRead } from '../controllers/notificationController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getUserNotifications);
router.post('/mark-read', optionalAuth, markNotificationsRead);
router.patch('/mark-read', optionalAuth, markNotificationsRead);
router.delete('/:id', optionalAuth, deleteNotification);

export default router;
