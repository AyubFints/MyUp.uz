import express from 'express';
import {
  getAllStations,
  createStation,
  updateStationStatus,
  updateFuelPrice,
  deleteStation,
} from '../controllers/stationController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getAllStations);
router.post('/', optionalAuth, createStation);
router.patch('/:id/status', optionalAuth, updateStationStatus);
router.put('/:id/fuels/:fuelType', optionalAuth, updateFuelPrice);
router.delete('/:id', optionalAuth, deleteStation);

export default router;
