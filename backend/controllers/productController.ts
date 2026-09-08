import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import Subcategory from '../models/Subcategory';
import memoryStore from '../utils/memoryStore';

/**
 * @desc    Get all products with filtering, searching, and sorting
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, subcategory, sizes, colors, minPrice, maxPrice, sort, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const queryObj: any = {};

      if (category && typeof category === 'string' && category !== 'All') {
        const catVal = category.trim();
        if (mongoose.Types.ObjectId.isValid(catVal)) {
          queryObj.category = catVal;
        } else {
          // Look up Category by slug or name
          const catDoc = await Category.findOne({
            $or: [{ slug: catVal.toLowerCase() }, { name: new RegExp(`^${catVal}$`, 'i') }],
          });
          if (catDoc) {
            queryObj.category = catDoc._id;
          } else {
            // Also allow matching string category on legacy products
            queryObj.$or = [{ category: catVal }];
          }
        }
      }

      if (subcategory && typeof subcategory === 'string' && subcategory !== 'All') {
        const subVal = subcategory.trim();
        if (mongoose.Types.ObjectId.isValid(subVal)) {
          queryObj.subcategory = subVal;
        } else {
          // Look up Subcategory by slug or name
          const subDoc = await Subcategory.findOne({
            $or: [{ slug: subVal.toLowerCase() }, { name: new RegExp(`^${subVal}$`, 'i') }],
          });
          if (subDoc) {
            queryObj.subcategory = subDoc._id;
          } else {
            queryObj.$or = [{ subcategory: subVal }];
          }
        }
      }

      if (sizes && typeof sizes === 'string') {
        queryObj.sizes = { $in: sizes.split(',') };
      }

      if (colors && typeof colors === 'string') {
        const hexes = colors.split(',');
        queryObj['colors.hex'] = { $in: hexes };
      }

      if (minPrice || maxPrice) {
        queryObj.price = {};
        if (minPrice && !isNaN(Number(minPrice))) queryObj.price.$gte = Number(minPrice);
        if (maxPrice && !isNaN(Number(maxPrice))) queryObj.price.$lte = Number(maxPrice);
      }

      if (search && typeof search === 'string' && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        queryObj.$or = [
          { name: regex },
          { spec: regex },
          { description: regex },
        ];
      }

      let sortObj: any = { createdAt: -1 };
      if (sort === 'price-asc') sortObj = { price: 1 };
      else if (sort === 'price-desc') sortObj = { price: -1 };
      else if (sort === 'popular') sortObj = { rating: -1, reviewsCount: -1 };

      const products = await Product.find(queryObj)
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status')
        .sort(sortObj);

      return res.json({
        products,
        total: products.length,
      });
    }

    // Memory Store Fallback
    let result = [...memoryStore.products];

    if (category && typeof category === 'string' && category !== 'All') {
      const catVal = category.trim().toLowerCase();
      result = result.filter((p) => {
        const pCat = p.category;
        if (typeof pCat === 'object' && pCat !== null) {
          const cObj = pCat as any;
          return (
            (cObj.id && cObj.id.toLowerCase() === catVal) ||
            (cObj.slug && cObj.slug.toLowerCase() === catVal) ||
            (cObj.name && cObj.name.toLowerCase() === catVal)
          );
        }
        const memCat = memoryStore.categories.find(
          (c) => c.id === pCat || c.slug === pCat || c.name.toLowerCase() === (pCat as string).toLowerCase()
        );
        return (
          (pCat as string).toLowerCase() === catVal ||
          (memCat && (memCat.id === catVal || memCat.slug === catVal || memCat.name.toLowerCase() === catVal))
        );
      });
    }

    if (subcategory && typeof subcategory === 'string' && subcategory !== 'All') {
      const subVal = subcategory.trim().toLowerCase();
      result = result.filter((p) => {
        const pSub = p.subcategory;
        if (!pSub) return false;
        if (typeof pSub === 'object' && pSub !== null) {
          const sObj = pSub as any;
          return (
            (sObj.id && sObj.id.toLowerCase() === subVal) ||
            (sObj.slug && sObj.slug.toLowerCase() === subVal) ||
            (sObj.name && sObj.name.toLowerCase() === subVal)
          );
        }
        const memSub = memoryStore.subcategories.find(
          (s) => s.id === pSub || s.slug === pSub || s.name.toLowerCase() === (pSub as string).toLowerCase()
        );
        return (
          (pSub as string).toLowerCase() === subVal ||
          (memSub && (memSub.id === subVal || memSub.slug === subVal || memSub.name.toLowerCase() === subVal))
        );
      });
    }

    if (sizes && typeof sizes === 'string') {
      const sizeArray = sizes.split(',');
      result = result.filter((p) => p.sizes.some((s) => sizeArray.includes(s)));
    }

    if (colors && typeof colors === 'string') {
      const colorArray = colors.split(',');
      result = result.filter((p) => p.colors.some((c) => colorArray.includes(c.hex.toLowerCase())));
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      result = result.filter((p) => p.price >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      result = result.filter((p) => p.price <= Number(maxPrice));
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.spec.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (sort === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      result.sort((a, b) => b.rating * b.reviewsCount - a.rating * a.reviewsCount);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      products: result,
      total: result.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let product = await Product.findOne({ productId: id })
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status');
      if (!product && mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id)
          .populate('category', 'name slug status')
          .populate('subcategory', 'name slug status');
      }
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      return res.json(product);
    }

    const product = memoryStore.products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
