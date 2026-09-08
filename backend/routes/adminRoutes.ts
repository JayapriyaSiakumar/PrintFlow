import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleAdminProductStock,
  getAdminOrders,
  updateAdminOrder,
  deleteAdminOrder,
  getAdminDesigns,
  deleteAdminDesign,
  sendAdminBroadcast,
} from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

// Apply protect & adminOnly to ALL admin routes
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// User Management
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUserById);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

// Product Management
router.post('/products', createAdminProduct);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);
router.patch('/products/:id/toggle', toggleAdminProductStock);

// Order Management
router.get('/orders', getAdminOrders);
router.put('/orders/:id', updateAdminOrder);
router.delete('/orders/:id', deleteAdminOrder);

// Design Moderation
router.get('/designs', getAdminDesigns);
router.delete('/designs/:id', deleteAdminDesign);

// Broadcast Announcement
router.post('/broadcast', sendAdminBroadcast);

export default router;
