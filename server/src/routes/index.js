import { Router } from 'express';
import authRoutes from './authRoutes.js';
import stationRoutes from './stationRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import adminRoutes from './adminRoutes.js';
import adRoutes from './adRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const apiRouter = Router();

// Barcha API marshrutlarini markazlashtirilgan holda ulash
apiRouter.use('/auth', authRoutes);
apiRouter.use('/stations', stationRoutes);
apiRouter.use('/feedbacks', feedbackRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/ads', adRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;
