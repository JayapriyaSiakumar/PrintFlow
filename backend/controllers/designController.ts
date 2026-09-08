import { Response } from 'express';
import mongoose from 'mongoose';
import CustomDesign from '../models/CustomDesign';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

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
        graphicUrl,
        placement: placement || 'front',
        previewDataUrl: previewDataUrl || previewFrontUrl,
        previewFrontUrl,
        previewBackUrl,
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
      graphicUrl,
      placement: placement || 'front',
      previewDataUrl: previewDataUrl || previewFrontUrl,
      previewFrontUrl,
      previewBackUrl,
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

    memoryStore.designs.splice(index, 1);
    res.json({ success: true, message: 'Design deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
