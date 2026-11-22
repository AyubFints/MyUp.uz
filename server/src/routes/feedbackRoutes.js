import express from 'express';
import {
  createFeedback,
  getFeedbacks,
  replyFeedback,
  deleteFeedback,
  markFeedbackAsRead,
  markAllFeedbacksAsRead,
} from '../controllers/feedbackController.js';
import { requireAdmin, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/', optionalAuth, getFeedbacks);
router.patch('/mark-read', requireAdmin, markAllFeedbacksAsRead);
router.patch('/:id/read', requireAdmin, markFeedbackAsRead);
router.patch('/:id/reply', requireAdmin, replyFeedback);
router.delete('/:id', requireAdmin, deleteFeedback);

export default router;
