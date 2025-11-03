import { Router } from 'express';
import { register, login, getProfile, changePassword, resetPasswordByEmail } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);
router.post('/reset-password', resetPasswordByEmail);

export default router;