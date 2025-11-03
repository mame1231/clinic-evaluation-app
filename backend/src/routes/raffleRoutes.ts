import express from 'express';
import {
  drawRaffle,
  getUserRaffleHistory,
  getAllRaffleHistory,
  getRaffleSettings,
  updateRaffleSettings,
  updateUserRank,
} from '../controllers/raffleController';
import { authenticate, isAdmin } from '../middleware/auth';

const router = express.Router();

// User routes
router.post('/draw', authenticate, drawRaffle);
router.get('/history', authenticate, getUserRaffleHistory);
router.get('/settings', authenticate, getRaffleSettings);

// Admin routes
router.get('/admin/history', authenticate, isAdmin, getAllRaffleHistory);
router.put('/admin/settings', authenticate, isAdmin, updateRaffleSettings);
router.put('/admin/user-rank', authenticate, isAdmin, updateUserRank);

export default router;
