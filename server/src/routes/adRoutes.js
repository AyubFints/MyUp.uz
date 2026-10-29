import express from 'express';
import {
  getActiveAds,
  getAllAdminAds,
  createAd,
  toggleAdStatus,
  deleteAd,
  recordAdView,
  recordAdClick,
} from '../controllers/adController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Ommaviy (A-Maps va MyUp client ilovasi uchun faol reklamalar)
router.get('/', getActiveAds);
router.post('/', createAd); // Super Admin /api/ads ga to'g'ridan-to'g'ri so'rov yuborsa ham qabul qiladi

// Reklama ko'rilgani va bosilganini qayd etish (ommaviy)
router.post('/:id/view', recordAdView);
router.post('/:id/click', recordAdClick);

// Super Admin boshqaruvi (Billing, Statistika va Yangi video reklama joylash)
router.get('/admin', requireAdmin, getAllAdminAds);
router.post('/admin', requireAdmin, createAd);
router.patch('/admin/:id/status', requireAdmin, toggleAdStatus);
router.patch('/:id/status', toggleAdStatus);
router.delete('/admin/:id', requireAdmin, deleteAd);
router.delete('/:id', deleteAd);

export default router;
