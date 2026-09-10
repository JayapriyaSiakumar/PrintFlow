import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category';
import Product from '../models/Product';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Utility helper to create URL-safe slug
export const generateSlug = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * @desc    Get all categories (public: active only by default; admin: all)
 * @route   GET /api/categories
 * @access  Public / Admin
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const { search, all, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      const queryObj: any = {};

      // Filter by status unless specifically asking for all
      if (status === 'active') {
        queryObj.status = true;
      } else if (status === 'inactive') {
        queryObj.status = false;
      } else if (all !== 'true') {
        // By default public sees active only
        queryObj.status = true;
      }

      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        queryObj.$or = [{ name: regex }, { slug: regex }, { description: regex }];
      }

      const categories = await Category.find(queryObj).sort({ name: 1 });

      // Calculate product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (cat) => {
          const productCount = await Product.countDocuments({ category: cat._id });
          return {
            ...cat.toJSON(),
            productCount,
          };
        })
      );

      return res.json({
        success: true,
        categories: categoriesWithCounts,
        total: categoriesWithCounts.length,
      });
    }

    // In-memory fallback
    let result = [...memoryStore.categories];

    if (status === 'active') {
      result = result.filter((c) => c.status === true);
    } else if (status === 'inactive') {
      result = result.filter((c) => c.status === false);
    } else if (all !== 'true') {
      result = result.filter((c) => c.status === true);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    const categoriesWithCounts = result.map((cat) => {
      const productCount = memoryStore.products.filter(
        (p) =>
          p.category === cat.id ||
          p.category === cat.name ||
          (typeof p.category === 'object' && ((p.category as any).id === cat.id || (p.category as any).name === cat.name))
      ).length;
      return {
        ...cat,
        productCount,
      };
    });

    res.json({
      success: true,
      categories: categoriesWithCounts,
      total: categoriesWithCounts.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get single category by ID or slug
 * @route   GET /api/categories/:id
 * @access  Public
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let category = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        category = await Category.findById(id);
      }
      if (!category) {
        category = await Category.findOne({ slug: id.toLowerCase() });
      }

      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }

      const productCount = await Product.countDocuments({ category: category._id });

      return res.json({
        success: true,
        category: {
          ...category.toJSON(),
          productCount,
        },
      });
    }

    const category = memoryStore.categories.find(
      (c) => c.id === id || c.slug === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase()
    );

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const productCount = memoryStore.products.filter(
      (p) =>
        p.category === category.id ||
        p.category === category.name ||
        (typeof p.category === 'object' && ((p.category as any).id === category.id || (p.category as any).name === category.name))
    ).length;

    res.json({
      success: true,
      category: {
        ...category,
        productCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private / Admin
 */
export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description = '', image = '', imagePublicId = '', slug, status = true } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const trimmedName = name.trim();
    const finalSlug = slug && typeof slug === 'string' && slug.trim()
      ? generateSlug(slug.trim())
      : generateSlug(trimmedName);

    if (mongoose.connection.readyState === 1) {
      // Check for existing category with same name or slug
      const existing = await Category.findOne({
        $or: [
          { name: new RegExp(`^${trimmedName}$`, 'i') },
          { slug: finalSlug },
        ],
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: `A category with the name "${trimmedName}" or slug "${finalSlug}" already exists.`,
        });
      }

      const category = await Category.create({
        name: trimmedName,
        slug: finalSlug,
        description: description.trim(),
        image: image.trim(),
        imagePublicId: imagePublicId ? imagePublicId.trim() : '',
        status: Boolean(status),
      });

      return res.status(201).json({
        success: true,
        category: category.toJSON(),
        message: `Category "${category.name}" created successfully.`,
      });
    }

    // In-memory fallback
    const exists = memoryStore.categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() || c.slug === finalSlug
    );
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `A category with the name "${trimmedName}" or slug "${finalSlug}" already exists.`,
      });
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      slug: finalSlug,
      description: description.trim(),
      image: image.trim(),
      imagePublicId: imagePublicId ? imagePublicId.trim() : '',
      status: Boolean(status),
      createdAt: new Date().toISOString(),
    };

    memoryStore.categories.push(newCat);

    res.status(201).json({
      success: true,
      category: newCat,
      message: `Category "${newCat.name}" created successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update existing category
 * @route   PUT /api/categories/:id
 * @access  Private / Admin
 */
export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, image, imagePublicId, slug, status } = req.body;

    if (mongoose.connection.readyState === 1) {
      let category = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        category = await Category.findById(id);
      }
      if (!category) {
        category = await Category.findOne({ slug: id.toLowerCase() });
      }

      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }

      if (name && typeof name === 'string' && name.trim()) {
        const trimmedName = name.trim();
        // Check duplicate name on another category
        const duplicate = await Category.findOne({
          _id: { $ne: category._id },
          name: new RegExp(`^${trimmedName}$`, 'i'),
        });
        if (duplicate) {
          return res.status(400).json({
            success: false,
            error: `Another category with name "${trimmedName}" already exists.`,
          });
        }
        category.name = trimmedName;
      }

      if (slug && typeof slug === 'string' && slug.trim()) {
        const finalSlug = generateSlug(slug.trim());
        const duplicateSlug = await Category.findOne({
          _id: { $ne: category._id },
          slug: finalSlug,
        });
        if (duplicateSlug) {
          return res.status(400).json({
            success: false,
            error: `Another category with slug "${finalSlug}" already exists.`,
          });
        }
        category.slug = finalSlug;
      }

      if (description !== undefined) category.description = description.trim();
      if (image !== undefined) category.image = image.trim();
      if (imagePublicId !== undefined) category.imagePublicId = imagePublicId.trim();
      if (status !== undefined) category.status = Boolean(status);

      await category.save();

      return res.json({
        success: true,
        category: category.toJSON(),
        message: `Category "${category.name}" updated successfully.`,
      });
    }

    // In-memory fallback
    const catIndex = memoryStore.categories.findIndex((c) => c.id === id || c.slug === id);
    if (catIndex === -1) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const c = memoryStore.categories[catIndex];

    if (name && typeof name === 'string' && name.trim()) {
      const trimmedName = name.trim();
      const duplicate = memoryStore.categories.find(
        (other) => other.id !== c.id && other.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `Another category with name "${trimmedName}" already exists.`,
        });
      }
      c.name = trimmedName;
    }

    if (slug && typeof slug === 'string' && slug.trim()) {
      const finalSlug = generateSlug(slug.trim());
      const duplicateSlug = memoryStore.categories.find(
        (other) => other.id !== c.id && other.slug === finalSlug
      );
      if (duplicateSlug) {
        return res.status(400).json({
          success: false,
          error: `Another category with slug "${finalSlug}" already exists.`,
        });
      }
      c.slug = finalSlug;
    }

    if (description !== undefined) c.description = description.trim();
    if (image !== undefined) c.image = image.trim();
    if (imagePublicId !== undefined) c.imagePublicId = imagePublicId.trim();
    if (status !== undefined) c.status = Boolean(status);

    res.json({
      success: true,
      category: c,
      message: `Category "${c.name}" updated successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete category (guarded by product usage)
 * @route   DELETE /api/categories/:id
 * @access  Private / Admin
 */
export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let category = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        category = await Category.findById(id);
      }
      if (!category) {
        category = await Category.findOne({ slug: id.toLowerCase() });
      }

      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }

      // Check product usage
      const productCount = await Product.countDocuments({ category: category._id });

      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete category: "${category.name}" is currently being used by ${productCount} existing product(s). Please reassign or delete these products before deleting this category.`,
          productCount,
        });
      }

      await category.deleteOne();

      return res.json({
        success: true,
        message: `Category "${category.name}" deleted successfully.`,
      });
    }

    // In-memory fallback
    const catIndex = memoryStore.categories.findIndex((c) => c.id === id || c.slug === id);
    if (catIndex === -1) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    const cat = memoryStore.categories[catIndex];

    const productsUsing = memoryStore.products.filter(
      (p) =>
        p.category === cat.id ||
        p.category === cat.name ||
        (typeof p.category === 'object' && ((p.category as any).id === cat.id || (p.category as any).name === cat.name))
    );

    if (productsUsing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category: "${cat.name}" is currently being used by ${productsUsing.length} existing product(s). Please reassign or delete these products first.`,
        productCount: productsUsing.length,
      });
    }

    memoryStore.categories.splice(catIndex, 1);

    res.json({
      success: true,
      message: `Category "${cat.name}" deleted successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Toggle category status (active / inactive)
 * @route   PATCH /api/categories/:id/toggle
 * @access  Private / Admin
 */
export const toggleCategoryStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let category = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        category = await Category.findById(id);
      }
      if (!category) {
        category = await Category.findOne({ slug: id.toLowerCase() });
      }

      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found.' });
      }

      category.status = !category.status;
      await category.save();

      return res.json({
        success: true,
        category: category.toJSON(),
        status: category.status,
        message: `Category "${category.name}" is now ${category.status ? 'Active' : 'Inactive'}.`,
      });
    }

    // In-memory fallback
    const cat = memoryStore.categories.find((c) => c.id === id || c.slug === id);
    if (!cat) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    cat.status = !cat.status;

    res.json({
      success: true,
      category: cat,
      status: cat.status,
      message: `Category "${cat.name}" is now ${cat.status ? 'Active' : 'Inactive'}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
