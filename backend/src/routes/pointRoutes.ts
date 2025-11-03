import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  convertLikesToPoints,
  getPointBalance,
  getPointHistory,
} from '../controllers/pointController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/convert', convertLikesToPoints);
router.get('/balance', getPointBalance);
router.get('/history', getPointHistory);

export default router;