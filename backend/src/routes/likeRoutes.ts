import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendLike,
  getReceivedLikes,
  getSentLikes,
  getAvailableReceivers,
} from '../controllers/likeController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/send', sendLike);
router.get('/received', getReceivedLikes);
router.get('/sent', getSentLikes);
router.get('/receivers', getAvailableReceivers);

export default router;