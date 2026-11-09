import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/profile', optionalAuth, updateProfile);

export default router;
