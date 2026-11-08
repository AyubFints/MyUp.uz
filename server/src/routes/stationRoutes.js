import express from 'express';
import {
  getAllStations,
  getMyStations,
  createStation,
  updateStationStatus,
  updateFuelPrice,
  deleteFuel,
  deleteStation,
} from '../controllers/stationController.js';
import { optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getAllStations);
router.get('/my', optionalAuth, getMyStations);
router.post('/', optionalAuth, createStation);
router.patch('/:id/status', optionalAuth, updateStationStatus);
router.put('/:id/fuels/:fuelType', optionalAuth, updateFuelPrice);
router.delete('/:id/fuels/:fuelType', optionalAuth, deleteFuel);
router.delete('/:id', optionalAuth, deleteStation);

export default router;
