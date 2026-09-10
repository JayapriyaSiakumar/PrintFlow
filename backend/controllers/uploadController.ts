import { Request, Response } from 'express';
import {
  uploadBufferToCloudinary,
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  getCloudinaryStatus,
  CLOUDINARY_FOLDERS,
} from '../config/cloudinary';

/**
 * @desc    Get Cloudinary integration status and storage configuration
 * @route   GET /api/upload/status
 * @access  Public / Diagnostics
 */
export const getStatus = async (_req: Request, res: Response) => {
  try {
    const status = getCloudinaryStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Upload product image by Admin
 * @route   POST /api/upload/product
 * @access  Private / Admin
 */
export const uploadProductImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: CLOUDINARY_FOLDERS.PRODUCTS,
      filename: req.file.originalname,
      tags: ['printflow', 'product', 'catalog'],
    });

    res.status(201).json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      isMock: result.isMock,
    });
  } catch (error: any) {
    console.error('Product image upload failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Product image upload failed' });
  }
};

/**
 * @desc    Upload product mockup image
 * @route   POST /api/upload/mockup
 * @access  Private / Admin
 */
export const uploadMockupImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: CLOUDINARY_FOLDERS.MOCKUPS,
      filename: req.file.originalname,
      tags: ['printflow', 'mockup'],
    });

    res.status(201).json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      isMock: result.isMock,
    });
  } catch (error: any) {
    console.error('Mockup upload failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Mockup upload failed' });
  }
};

/**
 * @desc    Upload category image by Admin
 * @route   POST /api/upload/category
 * @access  Private / Admin
 */
export const uploadCategoryImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: CLOUDINARY_FOLDERS.CATEGORIES,
      filename: req.file.originalname,
      tags: ['printflow', 'category'],
    });

    res.status(201).json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.publicId,
      format: result.format,
      isMock: result.isMock,
    });
  } catch (error: any) {
    console.error('Category image upload failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Category image upload failed' });
  }
};

/**
 * @desc    Customer uploaded artwork or logos during product customization
 * @route   POST /api/upload/customer-file
 * @access  Public / Optional Auth
 */
export const uploadCustomerArtwork = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No artwork file uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: CLOUDINARY_FOLDERS.CUSTOMER_FILES,
      filename: req.file.originalname,
      tags: ['printflow', 'customer-artwork', 'customization'],
    });

    res.status(201).json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      isMock: result.isMock,
    });
  } catch (error: any) {
    console.error('Customer artwork upload failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Artwork upload failed' });
  }
};

/**
 * @desc    Generated customized product preview images (front/back rendering snapshot)
 * @route   POST /api/upload/preview
 * @access  Public / Optional Auth
 */
export const uploadPreview = async (req: Request, res: Response) => {
  try {
    // Check if multipart file or Base64 dataUrl in JSON body
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, req.file.mimetype, {
        folder: CLOUDINARY_FOLDERS.PREVIEWS,
        filename: req.file.originalname || `preview_${Date.now()}`,
        tags: ['printflow', 'custom-preview'],
      });

      return res.status(201).json({
        success: true,
        url: result.secure_url || result.url,
        publicId: result.publicId,
        format: result.format,
        isMock: result.isMock,
      });
    }

    const { dataUrl, base64, side } = req.body;
    const rawImage = dataUrl || base64;

    if (!rawImage || typeof rawImage !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a multipart file or base64 dataUrl in request body',
      });
    }

    const result = await uploadBase64ToCloudinary(rawImage, {
      folder: CLOUDINARY_FOLDERS.PREVIEWS,
      publicIdPrefix: `preview_${side || 'comp'}`,
      tags: ['printflow', 'custom-preview', side || 'general'],
    });

    res.status(201).json({
      success: true,
      url: result.secure_url || result.url,
      publicId: result.publicId,
      format: result.format,
      isMock: result.isMock,
    });
  } catch (error: any) {
    console.error('Preview upload failed:', error);
    res.status(500).json({ success: false, error: error.message || 'Preview upload failed' });
  }
};

/**
 * @desc    Safely delete an asset from Cloudinary (with order preservation protection)
 * @route   DELETE /api/upload/:publicId
 * @access  Private
 */
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const rawPublicId = req.params.publicId || req.body.publicId || (req.query.publicId as string);

    if (!rawPublicId) {
      return res.status(400).json({ success: false, error: 'publicId is required' });
    }

    // Decode URL components if slashes were encoded
    const publicId = decodeURIComponent(rawPublicId);

    const result = await deleteFromCloudinary(publicId, {
      force: req.query.force === 'true',
    });

    if (result.preserved) {
      return res.status(409).json({
        success: false,
        preserved: true,
        message: result.message,
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Asset deletion failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
