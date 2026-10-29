import express from 'express';
import {
  getDashboardStats,
  approveStation,
  getAllUsers,
  getAllStationsAdmin,
  deleteUser,
  updateStationVerificationPhotos,
} from '../controllers/adminController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Barcha admin marshrutlari super_admin uchun ochiq
router.use(requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/stations', getAllStationsAdmin);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/stations/:id/approve', approveStation);
router.patch('/stations/:id/photos', updateStationVerificationPhotos);

export default router;
