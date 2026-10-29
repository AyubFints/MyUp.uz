import express from 'express';
import { recordVisit, getTrafficStats } from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/visit', recordVisit);
router.get('/live', getTrafficStats);

export default router;
