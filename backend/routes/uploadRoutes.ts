import { Router } from 'express';
import {
  getStatus,
  uploadProductImage,
  uploadMockupImage,
  uploadCategoryImage,
  uploadCustomerArtwork,
  uploadPreview,
  deleteAsset,
} from '../controllers/uploadController';
import { protect, adminOnly, optionalAuth } from '../middleware/authMiddleware';
import { handleSingleUpload } from '../middleware/uploadMiddleware';

const router = Router();

// Diagnostics
router.get('/status', getStatus);

// Admin catalog uploads
router.post('/product', protect, adminOnly, handleSingleUpload('image'), uploadProductImage);
router.post('/mockup', protect, adminOnly, handleSingleUpload('image'), uploadMockupImage);
router.post('/category', protect, adminOnly, handleSingleUpload('image'), uploadCategoryImage);

// Customer customization uploads
router.post('/customer-file', optionalAuth, handleSingleUpload('file'), uploadCustomerArtwork);
router.post('/preview', optionalAuth, handleSingleUpload('file'), uploadPreview);

// Safe asset deletion with order preservation check
router.delete('/:publicId(*)', protect, deleteAsset);
router.delete('/', protect, deleteAsset);

export default router;
