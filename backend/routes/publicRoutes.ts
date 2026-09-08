import { Router } from 'express';
import {
  getHealth,
  getStats,
  subscribeNewsletter,
} from '../controllers/publicController';

const router = Router();

router.get('/health', getHealth);
router.get('/stats', getStats);
router.post('/newsletter', subscribeNewsletter);

export default router;
