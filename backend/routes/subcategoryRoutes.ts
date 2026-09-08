import express from 'express';
import {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryStatus,
} from '../controllers/subcategoryController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getSubcategories);
router.get('/:id', getSubcategoryById);

// Admin-only protected routes
router.post('/', protect, adminOnly, createSubcategory);
router.put('/:id', protect, adminOnly, updateSubcategory);
router.delete('/:id', protect, adminOnly, deleteSubcategory);
router.patch('/:id/toggle', protect, adminOnly, toggleSubcategoryStatus);

export default router;
