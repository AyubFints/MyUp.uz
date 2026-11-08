import express from 'express';
import {
  getDashboardStats,
  approveStation,
  getAllUsers,
  getAllStationsAdmin,
  deleteUser,
  updateStationVerificationPhotos,
  getAdminLogs,
  createAdminLog,
  getAdminCards,
  createAdminCard,
  setPrimaryAdminCard,
  deleteAdminCard,
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

// Audit Jurnali (PostgreSQL admin_logs)
router.get('/logs', getAdminLogs);
router.post('/logs', createAdminLog);

// Billing & Kartalar (PostgreSQL admin_cards)
router.get('/cards', getAdminCards);
router.post('/cards', createAdminCard);
router.patch('/cards/:id/primary', setPrimaryAdminCard);
router.delete('/cards/:id', deleteAdminCard);

export default router;
