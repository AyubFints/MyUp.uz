import express from 'express';
import { createFeedback, getFeedbacks, replyFeedback, deleteFeedback } from '../controllers/feedbackController.js';
import { requireAuth, requireRole, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/', optionalAuth, getFeedbacks);
router.delete('/:id', deleteFeedback);
router.patch('/:id/reply', requireAuth, requireRole('super_admin'), replyFeedback);

export default router;
