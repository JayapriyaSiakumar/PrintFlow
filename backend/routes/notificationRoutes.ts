import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
} from '../controllers/notificationController';

const router = Router();

router.get('/', getNotifications);
router.post('/read', markNotificationRead);

export default router;
