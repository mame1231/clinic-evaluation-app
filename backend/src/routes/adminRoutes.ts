import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import {
  getAllUsers,
  chargePoints,
  deleteUser,
  getSystemStats,
  resetUserPassword,
  getSettings,
  updateSettings,
  getAllLikes,
} from '../controllers/adminController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

router.get('/users', getAllUsers);
router.post('/charge-points', chargePoints);
router.post('/reset-password', resetUserPassword);
router.delete('/users/:userId', deleteUser);
router.get('/stats', getSystemStats);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/likes', getAllLikes);

export default router;