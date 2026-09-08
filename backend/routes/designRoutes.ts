import { Router } from 'express';
import {
  getDesigns,
  getDesignById,
  saveDesign,
  deleteDesign,
} from '../controllers/designController';
import { optionalAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', optionalAuth, getDesigns);
router.get('/:id', optionalAuth, getDesignById);
router.post('/', optionalAuth, saveDesign);
router.delete('/:id', optionalAuth, deleteDesign);

export default router;
