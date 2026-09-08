import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category';
import Subcategory from '../models/Subcategory';
import Product from '../models/Product';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { generateSlug } from './categoryController';

/**
 * @desc    Get all subcategories (supports filtering by category ID/slug, search, status)
 * @route   GET /api/subcategories
 * @access  Public / Admin
 */
export const getSubcategories = async (req: Request, res: Response) => {
  try {
    const { category, search, all, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      const queryObj: any = {};

      if (category && typeof category === 'string' && category.trim()) {
        const catVal = category.trim();
        if (mongoose.Types.ObjectId.isValid(catVal)) {
          queryObj.category = catVal;
        } else {
          // Look up category by slug or name
          const parentCat = await Category.findOne({
            $or: [{ slug: catVal.toLowerCase() }, { name: new RegExp(`^${catVal}$`, 'i') }],
          });
          if (parentCat) {
            queryObj.category = parentCat._id;
          } else {
            // Category not found, return empty array
            return res.json({ success: true, subcategories: [], total: 0 });
          }
        }
      }

      if (status === 'active') {
        queryObj.status = true;
      } else if (status === 'inactive') {
        queryObj.status = false;
      } else if (all !== 'true') {
        queryObj.status = true;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        queryObj.$or = [{ name: regex }, { slug: regex }, { description: regex }];
      }

      const subcategories = await Subcategory.find(queryObj)
        .populate('category', 'name slug status')
        .sort({ name: 1 });

      const subcategoriesWithCounts = await Promise.all(
        subcategories.map(async (sub) => {
          const productCount = await Product.countDocuments({
            $or: [{ subcategory: sub._id }, { subcategory: sub.id }, { subcategory: sub.name }],
          });
          return {
            ...sub.toJSON(),
            productCount,
          };
        })
      );

      return res.json({
        success: true,
        subcategories: subcategoriesWithCounts,
        total: subcategoriesWithCounts.length,
      });
    }

    // In-memory fallback
    let result = [...memoryStore.subcategories];

    if (category && typeof category === 'string' && category.trim()) {
      const catVal = category.trim().toLowerCase();
      result = result.filter((s) => {
        const catId = typeof s.category === 'object' ? (s.category as any).id : s.category;
        const catObj = memoryStore.categories.find((c) => c.id === catId);
        return (
          catId === catVal ||
          (catObj && (catObj.slug === catVal || catObj.name.toLowerCase() === catVal))
        );
      });
    }

    if (status === 'active') {
      result = result.filter((s) => s.status === true);
    } else if (status === 'inactive') {
      result = result.filter((s) => s.status === false);
    } else if (all !== 'true') {
      result = result.filter((s) => s.status === true);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    const subcategoriesWithCounts = result.map((sub) => {
      const catId = typeof sub.category === 'object' ? (sub.category as any).id : sub.category;
      const parentCat = memoryStore.categories.find((c) => c.id === catId);

      const productCount = memoryStore.products.filter(
        (p) =>
          p.subcategory === sub.id ||
          p.subcategory === sub.name ||
          (typeof p.subcategory === 'object' && ((p.subcategory as any).id === sub.id || (p.subcategory as any).name === sub.name))
      ).length;

      return {
        ...sub,
        category: parentCat ? { id: parentCat.id, name: parentCat.name, slug: parentCat.slug, status: parentCat.status } : sub.category,
        productCount,
      };
    });

    res.json({
      success: true,
      subcategories: subcategoriesWithCounts,
      total: subcategoriesWithCounts.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get single subcategory by ID or slug
 * @route   GET /api/subcategories/:id
 * @access  Public
 */
export const getSubcategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let subcategory = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        subcategory = await Subcategory.findById(id).populate('category', 'name slug status');
      }
      if (!subcategory) {
        subcategory = await Subcategory.findOne({ slug: id.toLowerCase() }).populate('category', 'name slug status');
      }

      if (!subcategory) {
        return res.status(404).json({ success: false, error: 'Subcategory not found.' });
      }

      const productCount = await Product.countDocuments({
        $or: [{ subcategory: subcategory._id }, { subcategory: subcategory.name }],
      });

      return res.json({
        success: true,
        subcategory: {
          ...subcategory.toJSON(),
          productCount,
        },
      });
    }

    const subcategory = memoryStore.subcategories.find(
      (s) => s.id === id || s.slug === id.toLowerCase() || s.name.toLowerCase() === id.toLowerCase()
    );

    if (!subcategory) {
      return res.status(404).json({ success: false, error: 'Subcategory not found.' });
    }

    const catId = typeof subcategory.category === 'object' ? (subcategory.category as any).id : subcategory.category;
    const parentCat = memoryStore.categories.find((c) => c.id === catId);

    const productCount = memoryStore.products.filter(
      (p) =>
        p.subcategory === subcategory.id ||
        p.subcategory === subcategory.name ||
        (typeof p.subcategory === 'object' && ((p.subcategory as any).id === subcategory.id || (p.subcategory as any).name === subcategory.name))
    ).length;

    res.json({
      success: true,
      subcategory: {
        ...subcategory,
        category: parentCat ? { id: parentCat.id, name: parentCat.name, slug: parentCat.slug, status: parentCat.status } : subcategory.category,
        productCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Create new subcategory
 * @route   POST /api/subcategories
 * @access  Private / Admin
 */
export const createSubcategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, description = '', image = '', slug, status = true } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Subcategory name is required.' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ success: false, error: 'Parent category is required.' });
    }

    const trimmedName = name.trim();
    const finalSlug = slug && typeof slug === 'string' && slug.trim()
      ? generateSlug(slug.trim())
      : generateSlug(trimmedName);

    if (mongoose.connection.readyState === 1) {
      // Validate parent category exists
      let parentCategory = null;
      if (mongoose.Types.ObjectId.isValid(category.trim())) {
        parentCategory = await Category.findById(category.trim());
      }
      if (!parentCategory) {
        parentCategory = await Category.findOne({
          $or: [{ slug: category.trim().toLowerCase() }, { name: new RegExp(`^${category.trim()}$`, 'i') }],
        });
      }

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: 'Parent category does not exist. Please select a valid category.',
        });
      }

      // Check unique slug within the same category
      const existing = await Subcategory.findOne({
        category: parentCategory._id,
        $or: [{ slug: finalSlug }, { name: new RegExp(`^${trimmedName}$`, 'i') }],
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: `A subcategory with name "${trimmedName}" or slug "${finalSlug}" already exists under category "${parentCategory.name}".`,
        });
      }

      const subcategory = await Subcategory.create({
        name: trimmedName,
        category: parentCategory._id,
        slug: finalSlug,
        description: description.trim(),
        image: image.trim(),
        status: Boolean(status),
      });

      const populatedSub = await Subcategory.findById(subcategory._id).populate('category', 'name slug status');

      return res.status(201).json({
        success: true,
        subcategory: populatedSub?.toJSON() || subcategory.toJSON(),
        message: `Subcategory "${trimmedName}" created successfully under "${parentCategory.name}".`,
      });
    }

    // In-memory fallback
    const parentCategory = memoryStore.categories.find(
      (c) => c.id === category || c.slug === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
    );

    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        error: 'Parent category does not exist. Please select a valid category.',
      });
    }

    const exists = memoryStore.subcategories.some(
      (s) =>
        (s.category === parentCategory.id || (typeof s.category === 'object' && (s.category as any).id === parentCategory.id)) &&
        (s.name.toLowerCase() === trimmedName.toLowerCase() || s.slug === finalSlug)
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        error: `A subcategory with name "${trimmedName}" or slug "${finalSlug}" already exists under category "${parentCategory.name}".`,
      });
    }

    const newSub = {
      id: `subcat-${Date.now()}`,
      name: trimmedName,
      category: { id: parentCategory.id, name: parentCategory.name, slug: parentCategory.slug, status: parentCategory.status },
      slug: finalSlug,
      description: description.trim(),
      image: image.trim(),
      status: Boolean(status),
      createdAt: new Date().toISOString(),
    };

    memoryStore.subcategories.push(newSub as any);

    res.status(201).json({
      success: true,
      subcategory: newSub,
      message: `Subcategory "${trimmedName}" created successfully under "${parentCategory.name}".`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update existing subcategory
 * @route   PUT /api/subcategories/:id
 * @access  Private / Admin
 */
export const updateSubcategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, description, image, slug, status } = req.body;

    if (mongoose.connection.readyState === 1) {
      let subcategory = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        subcategory = await Subcategory.findById(id);
      }
      if (!subcategory) {
        subcategory = await Subcategory.findOne({ slug: id.toLowerCase() });
      }

      if (!subcategory) {
        return res.status(404).json({ success: false, error: 'Subcategory not found.' });
      }

      // If category is changing, validate new category
      if (category && typeof category === 'string' && category.trim()) {
        let newParentCategory = null;
        if (mongoose.Types.ObjectId.isValid(category.trim())) {
          newParentCategory = await Category.findById(category.trim());
        }
        if (!newParentCategory) {
          newParentCategory = await Category.findOne({
            $or: [{ slug: category.trim().toLowerCase() }, { name: new RegExp(`^${category.trim()}$`, 'i') }],
          });
        }
        if (!newParentCategory) {
          return res.status(400).json({
            success: false,
            error: 'Selected parent category does not exist.',
          });
        }
        subcategory.category = newParentCategory._id;
      }

      if (name && typeof name === 'string' && name.trim()) {
        const trimmedName = name.trim();
        const duplicate = await Subcategory.findOne({
          _id: { $ne: subcategory._id },
          category: subcategory.category,
          name: new RegExp(`^${trimmedName}$`, 'i'),
        });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            error: `Another subcategory with name "${trimmedName}" already exists in this category.`,
          });
        }
        subcategory.name = trimmedName;
      }

      if (slug && typeof slug === 'string' && slug.trim()) {
        const finalSlug = generateSlug(slug.trim());
        const duplicateSlug = await Subcategory.findOne({
          _id: { $ne: subcategory._id },
          category: subcategory.category,
          slug: finalSlug,
        });
        if (duplicateSlug) {
          return res.status(400).json({
            success: false,
            error: `Another subcategory with slug "${finalSlug}" already exists in this category.`,
          });
        }
        subcategory.slug = finalSlug;
      }

      if (description !== undefined) subcategory.description = description.trim();
      if (image !== undefined) subcategory.image = image.trim();
      if (status !== undefined) subcategory.status = Boolean(status);

      await subcategory.save();
      const populated = await Subcategory.findById(subcategory._id).populate('category', 'name slug status');

      return res.json({
        success: true,
        subcategory: populated?.toJSON() || subcategory.toJSON(),
        message: `Subcategory "${subcategory.name}" updated successfully.`,
      });
    }

    // In-memory fallback
    const subIndex = memoryStore.subcategories.findIndex((s) => s.id === id || s.slug === id);
    if (subIndex === -1) {
      return res.status(404).json({ success: false, error: 'Subcategory not found.' });
    }

    const sub = memoryStore.subcategories[subIndex];

    if (category && typeof category === 'string' && category.trim()) {
      const newParent = memoryStore.categories.find(
        (c) => c.id === category || c.slug === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
      );
      if (!newParent) {
        return res.status(400).json({ success: false, error: 'Selected parent category does not exist.' });
      }
      sub.category = { id: newParent.id, name: newParent.name, slug: newParent.slug, status: newParent.status } as any;
    }

    const currentCatId = typeof sub.category === 'object' ? (sub.category as any).id : sub.category;

    if (name && typeof name === 'string' && name.trim()) {
      const trimmedName = name.trim();
      const duplicate = memoryStore.subcategories.find(
        (other) =>
          other.id !== sub.id &&
          (typeof other.category === 'object' ? (other.category as any).id : other.category) === currentCatId &&
          other.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `Another subcategory with name "${trimmedName}" already exists in this category.`,
        });
      }
      sub.name = trimmedName;
    }

    if (slug && typeof slug === 'string' && slug.trim()) {
      const finalSlug = generateSlug(slug.trim());
      const duplicate = memoryStore.subcategories.find(
        (other) =>
          other.id !== sub.id &&
          (typeof other.category === 'object' ? (other.category as any).id : other.category) === currentCatId &&
          other.slug === finalSlug
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `Another subcategory with slug "${finalSlug}" already exists in this category.`,
        });
      }
      sub.slug = finalSlug;
    }

    if (description !== undefined) sub.description = description.trim();
    if (image !== undefined) sub.image = image.trim();
    if (status !== undefined) sub.status = Boolean(status);

    res.json({
      success: true,
      subcategory: sub,
      message: `Subcategory "${sub.name}" updated successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete subcategory (guarded by product usage)
 * @route   DELETE /api/subcategories/:id
 * @access  Private / Admin
 */
export const deleteSubcategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let subcategory = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        subcategory = await Subcategory.findById(id);
      }
      if (!subcategory) {
        subcategory = await Subcategory.findOne({ slug: id.toLowerCase() });
      }

      if (!subcategory) {
        return res.status(404).json({ success: false, error: 'Subcategory not found.' });
      }

      // Check product usage
      const productCount = await Product.countDocuments({
        $or: [{ subcategory: subcategory._id }, { subcategory: subcategory.id }, { subcategory: subcategory.name }],
      });

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete subcategory: "${subcategory.name}" is currently being used by ${productCount} existing product(s). Please reassign or delete these products before deleting this subcategory.`,
          productCount,
        });
      }

      await subcategory.deleteOne();

      return res.json({
        success: true,
        message: `Subcategory "${subcategory.name}" deleted successfully.`,
      });
    }

    // In-memory fallback
    const subIndex = memoryStore.subcategories.findIndex((s) => s.id === id || s.slug === id);
    if (subIndex === -1) {
      return res.status(404).json({ success: false, error: 'Subcategory not found.' });
    }

    const sub = memoryStore.subcategories[subIndex];

    const productsUsing = memoryStore.products.filter(
      (p) =>
        p.subcategory === sub.id ||
        p.subcategory === sub.name ||
        (typeof p.subcategory === 'object' && ((p.subcategory as any).id === sub.id || (p.subcategory as any).name === sub.name))
    );

    if (productsUsing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete subcategory: "${sub.name}" is currently being used by ${productsUsing.length} existing product(s). Please reassign or delete these products first.`,
        productCount: productsUsing.length,
      });
    }

    memoryStore.subcategories.splice(subIndex, 1);

    res.json({
      success: true,
      message: `Subcategory "${sub.name}" deleted successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Toggle subcategory status (active / inactive)
 * @route   PATCH /api/subcategories/:id/toggle
 * @access  Private / Admin
 */
export const toggleSubcategoryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let subcategory = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        subcategory = await Subcategory.findById(id).populate('category', 'name slug status');
      }
      if (!subcategory) {
        subcategory = await Subcategory.findOne({ slug: id.toLowerCase() }).populate('category', 'name slug status');
      }

      if (!subcategory) {
        return res.status(404).json({ success: false, error: 'Subcategory not found.' });
      }

      subcategory.status = !subcategory.status;
      await subcategory.save();

      return res.json({
        success: true,
        subcategory: subcategory.toJSON(),
        status: subcategory.status,
        message: `Subcategory "${subcategory.name}" is now ${subcategory.status ? 'Active' : 'Inactive'}.`,
      });
    }

    // In-memory fallback
    const sub = memoryStore.subcategories.find((s) => s.id === id || s.slug === id);
    if (!sub) {
      return res.status(404).json({ success: false, error: 'Subcategory not found.' });
    }

    sub.status = !sub.status;

    res.json({
      success: true,
      subcategory: sub,
      status: sub.status,
      message: `Subcategory "${sub.name}" is now ${sub.status ? 'Active' : 'Inactive'}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
