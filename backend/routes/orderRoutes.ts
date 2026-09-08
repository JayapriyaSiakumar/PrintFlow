import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} from '../controllers/orderController';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuth, getOrders);
router.get('/:id', optionalAuth, getOrderById);
router.post('/', optionalAuth, createOrder);
router.put('/:id/status', updateOrderStatus);

export default router;
