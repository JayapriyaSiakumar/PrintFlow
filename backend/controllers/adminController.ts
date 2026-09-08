import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Product from '../models/Product';
import Category from '../models/Category';
import Subcategory from '../models/Subcategory';
import Order from '../models/Order';
import CustomDesign from '../models/CustomDesign';
import Notification from '../models/Notification';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * @desc    Get admin dashboard stats and KPIs
 * @route   GET /api/admin/dashboard
 * @access  Private / Admin
 */
export const getAdminDashboard = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [totalUsers, totalProducts, totalOrders, totalDesigns, orders, recentUsers] =
        await Promise.all([
          User.countDocuments(),
          Product.countDocuments(),
          Order.countDocuments(),
          CustomDesign.countDocuments(),
          Order.find(),
          User.find().select('-password').sort({ createdAt: -1 }).limit(8),
        ]);

      const totalRevenue = Math.round(orders.reduce((acc, curr) => acc + curr.total, 0) * 100) / 100;
      const pendingOrders = orders.filter(
        (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'printing'
      ).length;

      const ordersByStatus: Record<string, number> = {
        pending: 0,
        processing: 0,
        printing: 0,
        quality_check: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      orders.forEach((o) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      const recentOrders = orders.slice(0, 8);

      return res.json({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        totalDesigns,
        pendingOrders,
        ordersByStatus,
        recentOrders,
        recentUsers,
      });
    }

    // Memory Store fallback
    const totalRevenue = Math.round(memoryStore.orders.reduce((acc, curr) => acc + curr.total, 0) * 100) / 100;
    const pendingOrders = memoryStore.orders.filter(
      (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'printing'
    ).length;

    const ordersByStatus: Record<string, number> = {
      pending: 0,
      processing: 0,
      printing: 0,
      quality_check: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    memoryStore.orders.forEach((o) => {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
    });

    res.json({
      totalRevenue,
      totalOrders: memoryStore.orders.length,
      totalUsers: memoryStore.users.length,
      totalProducts: memoryStore.products.length,
      totalDesigns: memoryStore.designs.length,
      pendingOrders,
      ordersByStatus,
      recentOrders: memoryStore.orders.slice(0, 8),
      recentUsers: memoryStore.users
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          storeName: u.storeName,
          avatar: u.avatar,
          createdAt: u.createdAt,
        }))
        .slice(-8)
        .reverse(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get all users for admin with search & role filters
 * @route   GET /api/admin/users
 * @access  Private / Admin
 */
export const getAdminUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { q, role } = req.query;

    if (mongoose.connection.readyState === 1) {
      const queryObj: any = {};
      if (role && typeof role === 'string' && role !== 'all') {
        queryObj.role = role;
      }
      if (q && typeof q === 'string') {
        const regex = new RegExp(q.trim(), 'i');
        queryObj.$or = [{ name: regex }, { email: regex }, { storeName: regex }];
      }

      const users = await User.find(queryObj).select('-password').sort({ createdAt: -1 });
      return res.json({ users, total: users.length });
    }

    let result = memoryStore.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      storeName: u.storeName,
      avatar: u.avatar,
      createdAt: u.createdAt,
    }));

    if (role && typeof role === 'string' && role !== 'all') {
      result = result.filter((u) => u.role === role);
    }
    if (q && typeof q === 'string') {
      const query = q.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.storeName && u.storeName.toLowerCase().includes(query))
      );
    }

    res.json({ users: result, total: result.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private / Admin
 */
export const getAdminUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id).select('-password');
      }
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.json({ success: true, user });
    }

    const userRecord = memoryStore.users.find((u) => u.id === id);
    if (!userRecord) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const safeUser = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      storeName: userRecord.storeName,
      avatar: userRecord.avatar,
      createdAt: userRecord.createdAt,
    };

    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update user (e.g. promote/demote role, update storeName)
 * @route   PUT /api/admin/users/:id
 * @access  Private / Admin
 */
export const updateAdminUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, storeName } = req.body;

    if (mongoose.connection.readyState === 1) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
      }
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (name) user.name = name.trim();
      if (email) user.email = email.trim().toLowerCase();
      if (storeName !== undefined) user.storeName = storeName;

      if (role && (role === 'user' || role === 'admin')) {
        // Prevent accidental lockout of the last administrator
        if (req.user?.id === id && role !== 'admin') {
          const adminCount = await User.countDocuments({ role: 'admin' });
          if (adminCount <= 1) {
            return res.status(400).json({
              success: false,
              error: 'Cannot remove administrative privileges from the only remaining administrator.',
            });
          }
        }
        user.role = role;
      }

      await user.save();

      const updated = {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        storeName: user.storeName,
        avatar: user.avatar,
        createdAt: user.createdAt?.toISOString(),
      };

      return res.json({ success: true, user: updated, message: 'User updated successfully.' });
    }

    const userIndex = memoryStore.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (name) memoryStore.users[userIndex].name = name.trim();
    if (email) memoryStore.users[userIndex].email = email.trim().toLowerCase();
    if (storeName !== undefined) memoryStore.users[userIndex].storeName = storeName;

    if (role && (role === 'user' || role === 'admin')) {
      if (req.user?.id === memoryStore.users[userIndex].id && role !== 'admin') {
        const adminCount = memoryStore.users.filter((u) => u.role === 'admin').length;
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            error: 'Cannot remove administrative privileges from the only remaining administrator.',
          });
        }
      }
      memoryStore.users[userIndex].role = role;
    }

    const updated = {
      id: memoryStore.users[userIndex].id,
      name: memoryStore.users[userIndex].name,
      email: memoryStore.users[userIndex].email,
      role: memoryStore.users[userIndex].role,
      storeName: memoryStore.users[userIndex].storeName,
      avatar: memoryStore.users[userIndex].avatar,
      createdAt: memoryStore.users[userIndex].createdAt,
    };

    res.json({ success: true, user: updated, message: 'User updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete user account
 * @route   DELETE /api/admin/users/:id
 * @access  Private / Admin
 */
export const deleteAdminUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own active administrator account.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      let user = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await User.findById(id);
      }
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      await user.deleteOne();
      return res.json({ success: true, message: `User ${user.name} was successfully removed.` });
    }

    const userIndex = memoryStore.users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const deleted = memoryStore.users.splice(userIndex, 1)[0];
    res.json({ success: true, message: `User ${deleted.name} was successfully removed.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Create new product (admin catalog)
 * @route   POST /api/admin/products
 * @access  Private / Admin
 */
export const createAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      price,
      category,
      subcategory,
      spec,
      description,
      image,
      stock = 100,
      sizes,
      colors,
      tag,
      featured,
    } = req.body;

    if (!name || !price || !category || !subcategory) {
      return res.status(400).json({
        success: false,
        error: 'Product name, price, category, and subcategory are all required.',
      });
    }

    const productId = `prod-${Date.now()}`;

    if (mongoose.connection.readyState === 1) {
      // 1. Validate Category exists
      let catDoc = null;
      if (mongoose.Types.ObjectId.isValid(category)) {
        catDoc = await Category.findById(category);
      }
      if (!catDoc) {
        catDoc = await Category.findOne({
          $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }],
        });
      }
      if (!catDoc) {
        return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
      }

      // 2. Validate Subcategory exists
      let subDoc = null;
      if (mongoose.Types.ObjectId.isValid(subcategory)) {
        subDoc = await Subcategory.findById(subcategory);
      }
      if (!subDoc) {
        subDoc = await Subcategory.findOne({
          $or: [{ slug: subcategory.toLowerCase() }, { name: new RegExp(`^${subcategory}$`, 'i') }],
        });
      }
      if (!subDoc) {
        return res.status(400).json({ success: false, error: 'Selected subcategory does not exist.' });
      }

      // 3. Backend validate: Subcategory MUST belong to Category
      if (subDoc.category.toString() !== catDoc._id.toString()) {
        return res.status(400).json({
          success: false,
          error: `Selected subcategory "${subDoc.name}" does not belong to category "${catDoc.name}".`,
        });
      }

      const product = await Product.create({
        productId,
        name: name.trim(),
        price: Number(price),
        category: catDoc._id,
        subcategory: subDoc._id,
        spec: spec || '100% Premium Combed Cotton',
        description: description || 'High-grade custom apparel blank designed for precision on-demand printing.',
        sizes: sizes || ['S', 'M', 'L', 'XL', '2XL'],
        colors: colors || [
          { name: 'Pure White', hex: '#ffffff', bgClass: 'bg-white' },
          { name: 'Onyx Black', hex: '#111111', bgClass: 'bg-neutral-900' },
        ],
        image: image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        tag: tag || 'New',
        rating: 5.0,
        reviewsCount: 1,
        featured: Boolean(featured),
        stock: Number(stock),
      });

      const populated = await Product.findById(product._id)
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status');

      return res.status(201).json({
        success: true,
        product: populated || product,
        message: 'Product successfully added.',
      });
    }

    // Memory Store fallback
    const parentCat = memoryStore.categories.find(
      (c) => c.id === category || c.slug === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
    );
    if (!parentCat) {
      return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
    }

    const parentSub = memoryStore.subcategories.find(
      (s) => s.id === subcategory || s.slug === subcategory.toLowerCase() || s.name.toLowerCase() === subcategory.toLowerCase()
    );
    if (!parentSub) {
      return res.status(400).json({ success: false, error: 'Selected subcategory does not exist.' });
    }

    const subCatId = typeof parentSub.category === 'object' ? (parentSub.category as any).id : parentSub.category;
    if (subCatId !== parentCat.id) {
      return res.status(400).json({
        success: false,
        error: `Selected subcategory "${parentSub.name}" does not belong to category "${parentCat.name}".`,
      });
    }

    const newProduct = {
      id: productId,
      name: name.trim(),
      price: Number(price),
      category: { id: parentCat.id, name: parentCat.name, slug: parentCat.slug, status: parentCat.status } as any,
      subcategory: { id: parentSub.id, name: parentSub.name, slug: parentSub.slug, status: parentSub.status } as any,
      categoryName: parentCat.name,
      subcategoryName: parentSub.name,
      spec: spec || '100% Premium Combed Cotton',
      description: description || 'High-grade custom apparel blank designed for precision on-demand printing.',
      sizes: sizes || ['S', 'M', 'L', 'XL', '2XL'],
      colors: colors || [
        { name: 'Pure White', hex: '#ffffff', bgClass: 'bg-white' },
        { name: 'Onyx Black', hex: '#111111', bgClass: 'bg-neutral-900' },
      ],
      image: image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      tag: tag || 'New',
      rating: 5.0,
      reviewsCount: 1,
      featured: Boolean(featured),
      stock: Number(stock),
      createdAt: new Date().toISOString(),
      details: {
        material: '100% Combed Cotton',
        weight: '240 GSM Heavyweight',
        fit: 'Regular Fit',
        care: 'Machine wash cold with like colors',
        origin: 'PrintFlow Hub #1',
      },
    };

    memoryStore.products.unshift(newProduct as any);
    res.status(201).json({ success: true, product: newProduct, message: 'Product successfully added.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/admin/products/:id
 * @access  Private / Admin
 */
export const updateAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, category, subcategory, spec, description, image, stock, tag, featured } = req.body;

    if (mongoose.connection.readyState === 1) {
      let product = await Product.findOne({ productId: id });
      if (!product && mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      let targetCatId = product.category;
      let targetSubId = product.subcategory;

      // Validate new category if provided
      if (category) {
        let catDoc = null;
        if (mongoose.Types.ObjectId.isValid(category)) {
          catDoc = await Category.findById(category);
        }
        if (!catDoc) {
          catDoc = await Category.findOne({
            $or: [{ slug: category.toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }],
          });
        }
        if (!catDoc) {
          return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
        }
        targetCatId = catDoc._id;
        product.category = catDoc._id;
      }

      // Validate new subcategory if provided
      if (subcategory) {
        let subDoc = null;
        if (mongoose.Types.ObjectId.isValid(subcategory)) {
          subDoc = await Subcategory.findById(subcategory);
        }
        if (!subDoc) {
          subDoc = await Subcategory.findOne({
            $or: [{ slug: subcategory.toLowerCase() }, { name: new RegExp(`^${subcategory}$`, 'i') }],
          });
        }
        if (!subDoc) {
          return res.status(400).json({ success: false, error: 'Selected subcategory does not exist.' });
        }
        targetSubId = subDoc._id;
        product.subcategory = subDoc._id;
      }

      // Backend relationship verification
      if (targetCatId && targetSubId) {
        const subDoc = await Subcategory.findById(targetSubId);
        if (subDoc && subDoc.category.toString() !== targetCatId.toString()) {
          return res.status(400).json({
            success: false,
            error: 'Selected subcategory does not belong to the selected category.',
          });
        }
      }

      if (name) product.name = name.trim();
      if (price !== undefined) product.price = Number(price);
      if (spec) product.spec = spec;
      if (description) product.description = description;
      if (image) product.image = image;
      if (stock !== undefined) product.stock = Number(stock);
      if (tag !== undefined) product.tag = tag;
      if (featured !== undefined) product.featured = Boolean(featured);

      await product.save();

      const populated = await Product.findById(product._id)
        .populate('category', 'name slug status')
        .populate('subcategory', 'name slug status');

      return res.json({
        success: true,
        product: populated || product,
        message: 'Product updated successfully.',
      });
    }

    const productIndex = memoryStore.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const p = memoryStore.products[productIndex];

    let currentCat = typeof p.category === 'object' ? (p.category as any).id : p.category;
    let currentSub = typeof p.subcategory === 'object' ? (p.subcategory as any).id : p.subcategory;

    if (category) {
      const parentCat = memoryStore.categories.find(
        (c) => c.id === category || c.slug === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
      );
      if (!parentCat) {
        return res.status(400).json({ success: false, error: 'Selected category does not exist.' });
      }
      p.category = { id: parentCat.id, name: parentCat.name, slug: parentCat.slug, status: parentCat.status } as any;
      p.categoryName = parentCat.name;
      currentCat = parentCat.id;
    }

    if (subcategory) {
      const parentSub = memoryStore.subcategories.find(
        (s) => s.id === subcategory || s.slug === subcategory.toLowerCase() || s.name.toLowerCase() === subcategory.toLowerCase()
      );
      if (!parentSub) {
        return res.status(400).json({ success: false, error: 'Selected subcategory does not exist.' });
      }
      p.subcategory = { id: parentSub.id, name: parentSub.name, slug: parentSub.slug, status: parentSub.status } as any;
      p.subcategoryName = parentSub.name;
      currentSub = parentSub.id;
    }

    // Verify subcategory belongs to category
    if (currentSub) {
      const parentSub = memoryStore.subcategories.find((s) => s.id === currentSub);
      if (parentSub) {
        const subParentCatId = typeof parentSub.category === 'object' ? (parentSub.category as any).id : parentSub.category;
        if (subParentCatId !== currentCat) {
          return res.status(400).json({
            success: false,
            error: 'Selected subcategory does not belong to the selected category.',
          });
        }
      }
    }

    if (name) p.name = name.trim();
    if (price !== undefined) p.price = Number(price);
    if (spec) p.spec = spec;
    if (description) p.description = description;
    if (image) p.image = image;
    if (stock !== undefined) p.stock = Number(stock);
    if (tag !== undefined) p.tag = tag;
    if (featured !== undefined) p.featured = Boolean(featured);

    res.json({ success: true, product: p, message: 'Product updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/admin/products/:id
 * @access  Private / Admin
 */
export const deleteAdminProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let product = await Product.findOne({ productId: id });
      if (!product && mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      await product.deleteOne();
      return res.json({ success: true, message: `Product "${product.name}" deleted successfully.` });
    }

    const productIndex = memoryStore.products.findIndex((p) => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const removed = memoryStore.products.splice(productIndex, 1)[0];
    res.json({ success: true, message: `Product "${removed.name}" deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Toggle product in-stock / out-of-stock
 * @route   PATCH /api/admin/products/:id/toggle
 * @access  Private / Admin
 */
export const toggleAdminProductStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let product = await Product.findOne({ productId: id });
      if (!product && mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      product.stock = product.stock > 0 ? 0 : 50;
      await product.save();
      return res.json({ success: true, product, inStock: product.stock > 0 });
    }

    const product = memoryStore.products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    product.stock = product.stock > 0 ? 0 : 50;
    res.json({ success: true, product, inStock: product.stock > 0 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get all orders for admin
 * @route   GET /api/admin/orders
 * @access  Private / Admin
 */
export const getAdminOrders = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ orders, total: orders.length });
    }
    res.json({ orders: memoryStore.orders, total: memoryStore.orders.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update order tracking or details
 * @route   PUT /api/admin/orders/:id
 * @access  Private / Admin
 */
export const updateAdminOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { trackingNumber, shippingAddress } = req.body;

    if (mongoose.connection.readyState === 1) {
      let order = await Order.findOne({ orderId: id });
      if (!order && mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (shippingAddress) order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };

      await order.save();
      return res.json({ success: true, order, message: 'Order updated successfully.' });
    }

    const order = memoryStore.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingAddress) order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
    order.updatedAt = new Date().toISOString();

    res.json({ success: true, order, message: 'Order updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete order
 * @route   DELETE /api/admin/orders/:id
 * @access  Private / Admin
 */
export const deleteAdminOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let order = await Order.findOne({ orderId: id });
      if (!order && mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found.' });
      }

      await order.deleteOne();
      return res.json({ success: true, message: `Order #${order.orderId} deleted successfully.` });
    }

    const orderIndex = memoryStore.orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const deleted = memoryStore.orders.splice(orderIndex, 1)[0];
    res.json({ success: true, message: `Order #${deleted.id} deleted successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get all custom designs for moderation
 * @route   GET /api/admin/designs
 * @access  Private / Admin
 */
export const getAdminDesigns = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const designs = await CustomDesign.find().sort({ createdAt: -1 });
      return res.json({ designs, total: designs.length });
    }
    res.json({ designs: memoryStore.designs, total: memoryStore.designs.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete design (admin moderation)
 * @route   DELETE /api/admin/designs/:id
 * @access  Private / Admin
 */
export const deleteAdminDesign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let design = await CustomDesign.findOne({ designId: id });
      if (!design && mongoose.Types.ObjectId.isValid(id)) {
        design = await CustomDesign.findById(id);
      }
      if (!design) {
        return res.status(404).json({ success: false, error: 'Design not found.' });
      }

      await design.deleteOne();
      return res.json({ success: true, message: 'Design removed by administrator.' });
    }

    const index = memoryStore.designs.findIndex((d) => d.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Design not found.' });
    }

    memoryStore.designs.splice(index, 1);
    res.json({ success: true, message: 'Design removed by administrator.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Send broadcast announcement notification
 * @route   POST /api/admin/broadcast
 * @access  Private / Admin
 */
export const sendAdminBroadcast = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, type = 'system', orderId } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required.' });
    }

    const notifId = `notif-${Date.now()}`;

    if (mongoose.connection.readyState === 1) {
      const notification = await Notification.create({
        notifId,
        title,
        message,
        type,
        read: false,
        orderId,
      });
      return res.json({ success: true, notification });
    }

    const notif = {
      id: notifId,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      orderId,
    };

    memoryStore.notifications.unshift(notif);
    res.json({ success: true, notification: notif });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
