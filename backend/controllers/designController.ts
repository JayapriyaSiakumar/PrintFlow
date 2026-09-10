import { Response } from 'express';
import mongoose from 'mongoose';
import CustomDesign from '../models/CustomDesign';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  uploadBase64ToCloudinary,
  deleteFromCloudinary,
  CLOUDINARY_FOLDERS,
} from '../config/cloudinary';

/**
 * @desc    Get user custom designs (admin gets all)
 * @route   GET /api/designs
 * @access  Private / Optional
 */
export const getDesigns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json({ designs: [] });
    }

    const isAdmin = req.user.role === 'admin';

    if (mongoose.connection.readyState === 1) {
      const query = isAdmin ? {} : { userId: req.user.id };
      const designs = await CustomDesign.find(query).sort({ createdAt: -1 });
      return res.json({ designs });
    }

    if (isAdmin) {
      return res.json({ designs: memoryStore.designs });
    }

    const userDesigns = memoryStore.designs.filter((d) => d.userId === req.user?.id);
    res.json({ designs: userDesigns });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Save new custom apparel design
 * @route   POST /api/designs
 * @access  Private / Optional
 */
export const saveDesign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      productId,
      productName,
      productImage,
      selectedColorHex,
      selectedSize,
      designText,
      designTextColor,
      designFont,
      graphicUrl,
      placement,
      previewDataUrl,
      previewFrontUrl,
      previewBackUrl,
      sides,
      designConfig,
    } = req.body;

    const designId = `dsg-${Date.now()}`;
    const userId = req.user ? req.user.id : `guest-${Date.now()}`;

    let finalPreviewFront = previewFrontUrl || previewDataUrl || '';
    let finalPreviewFrontPublicId = req.body.previewFrontPublicId || req.body.previewDataUrlPublicId || '';
    let finalPreviewBack = previewBackUrl || '';
    let finalPreviewBackPublicId = req.body.previewBackPublicId || '';
    let finalGraphicUrl = graphicUrl || '';
    let finalGraphicPublicId = req.body.graphicPublicId || '';

    // If previews are base64 data URLs, upload them to Cloudinary
    if (finalPreviewFront && finalPreviewFront.startsWith('data:image/')) {
      try {
        const uploadRes = await uploadBase64ToCloudinary(finalPreviewFront, {
          folder: CLOUDINARY_FOLDERS.PREVIEWS,
          publicIdPrefix: `preview_front_${designId}`,
          tags: ['printflow', 'design-preview', 'front'],
        });
        finalPreviewFront = uploadRes.secure_url || uploadRes.url;
        finalPreviewFrontPublicId = uploadRes.publicId;
      } catch (err) {
        console.error('Failed to upload preview front to Cloudinary:', err);
      }
    }

    if (finalPreviewBack && finalPreviewBack.startsWith('data:image/')) {
      try {
        const uploadRes = await uploadBase64ToCloudinary(finalPreviewBack, {
          folder: CLOUDINARY_FOLDERS.PREVIEWS,
          publicIdPrefix: `preview_back_${designId}`,
          tags: ['printflow', 'design-preview', 'back'],
        });
        finalPreviewBack = uploadRes.secure_url || uploadRes.url;
        finalPreviewBackPublicId = uploadRes.publicId;
      } catch (err) {
        console.error('Failed to upload preview back to Cloudinary:', err);
      }
    }

    if (finalGraphicUrl && finalGraphicUrl.startsWith('data:image/')) {
      try {
        const uploadRes = await uploadBase64ToCloudinary(finalGraphicUrl, {
          folder: CLOUDINARY_FOLDERS.CUSTOMER_FILES,
          publicIdPrefix: `art_${designId}`,
          tags: ['printflow', 'customer-artwork'],
        });
        finalGraphicUrl = uploadRes.secure_url || uploadRes.url;
        finalGraphicPublicId = uploadRes.publicId;
      } catch (err) {
        console.error('Failed to upload customer artwork to Cloudinary:', err);
      }
    }

    if (mongoose.connection.readyState === 1) {
      const design = await CustomDesign.create({
        designId,
        userId,
        name: name || 'Untitled Custom Creation',
        productId,
        productName,
        productImage,
        selectedColorHex,
        selectedSize: selectedSize || 'M',
        designText,
        designTextColor,
        designFont,
        graphicUrl: finalGraphicUrl,
        graphicPublicId: finalGraphicPublicId,
        placement: placement || 'front',
        previewDataUrl: finalPreviewFront,
        previewDataUrlPublicId: finalPreviewFrontPublicId,
        previewFrontUrl: finalPreviewFront,
        previewFrontPublicId: finalPreviewFrontPublicId,
        previewBackUrl: finalPreviewBack,
        previewBackPublicId: finalPreviewBackPublicId,
        sides: sides || { front: { elements: [] }, back: { elements: [] } },
        designConfig,
      });

      return res.status(201).json(design);
    }

    const newDesign = {
      id: designId,
      userId,
      name: name || 'Untitled Custom Creation',
      productId,
      productName,
      productImage,
      selectedColorHex: selectedColorHex || '#ffffff',
      selectedSize: selectedSize || 'M',
      designText,
      designTextColor,
      designFont,
      graphicUrl: finalGraphicUrl,
      graphicPublicId: finalGraphicPublicId,
      placement: placement || 'front',
      previewDataUrl: finalPreviewFront,
      previewDataUrlPublicId: finalPreviewFrontPublicId,
      previewFrontUrl: finalPreviewFront,
      previewFrontPublicId: finalPreviewFrontPublicId,
      previewBackUrl: finalPreviewBack,
      previewBackPublicId: finalPreviewBackPublicId,
      sides: sides || { front: { elements: [] }, back: { elements: [] } },
      designConfig,
      createdAt: new Date().toISOString(),
    };

    memoryStore.designs.unshift(newDesign as any);
    res.status(201).json(newDesign);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get single custom design by ID
 * @route   GET /api/designs/:id
 * @access  Private / Optional
 */
export const getDesignById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let design = await CustomDesign.findOne({ designId: id });
      if (!design && mongoose.Types.ObjectId.isValid(id)) {
        design = await CustomDesign.findById(id);
      }

      if (!design) {
        return res.status(404).json({ success: false, error: 'Design not found' });
      }

      return res.json({ design });
    }

    const design = memoryStore.designs.find((d) => d.id === id || (d as any).designId === id);
    if (!design) {
      return res.status(404).json({ success: false, error: 'Design not found' });
    }

    res.json({ design });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete custom design
 * @route   DELETE /api/designs/:id
 * @access  Private
 */
export const deleteDesign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let design = await CustomDesign.findOne({ designId: id });
      if (!design && mongoose.Types.ObjectId.isValid(id)) {
        design = await CustomDesign.findById(id);
      }

      if (!design) {
        return res.status(404).json({ success: false, error: 'Design not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== design.userId) {
        return res.status(403).json({ success: false, error: 'Access denied: You cannot delete another user\'s design.' });
      }

      // Clean up Cloudinary assets (with automatic order preservation protection)
      if (design.previewFrontPublicId) await deleteFromCloudinary(design.previewFrontPublicId);
      if (design.previewBackPublicId) await deleteFromCloudinary(design.previewBackPublicId);
      if (design.previewDataUrlPublicId && design.previewDataUrlPublicId !== design.previewFrontPublicId) {
        await deleteFromCloudinary(design.previewDataUrlPublicId);
      }
      if (design.graphicPublicId) await deleteFromCloudinary(design.graphicPublicId);

      await design.deleteOne();
      return res.json({ success: true, message: 'Design deleted successfully' });
    }

    const index = memoryStore.designs.findIndex((d) => d.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Design not found' });
    }

    const design = memoryStore.designs[index];
    if (req.user && req.user.role !== 'admin' && req.user.id !== design.userId) {
      return res.status(403).json({ success: false, error: 'Access denied: You cannot delete another user\'s design.' });
    }

    if ((design as any).previewFrontPublicId) await deleteFromCloudinary((design as any).previewFrontPublicId);
    if ((design as any).previewBackPublicId) await deleteFromCloudinary((design as any).previewBackPublicId);
    if ((design as any).graphicPublicId) await deleteFromCloudinary((design as any).graphicPublicId);

    memoryStore.designs.splice(index, 1);
    res.json({ success: true, message: 'Design deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
