import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Subscriber from '../models/Subscriber';
import Product from '../models/Product';
import Order from '../models/Order';
import memoryStore from '../utils/memoryStore';

/**
 * @desc    System Health & Diagnostics
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = async (_req: Request, res: Response) => {
  const isMongoConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'healthy',
    service: 'PrintFlow MERN Production Backend',
    database: isMongoConnected ? 'MongoDB (Mongoose)' : 'In-Memory Resilient Store',
    mongoConnectionState: mongoose.connection.readyState,
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
};

/**
 * @desc    Platform Statistics & Metrics
 * @route   GET /api/stats
 * @access  Public
 */
export const getStats = async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [orderCount, orders] = await Promise.all([
        Order.countDocuments(),
        Order.find().select('total items'),
      ]);

      const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
      const printedItems =
        orders.reduce((acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0), 0) +
        12450;

      return res.json({
        totalOrders: orderCount + 8430,
        printedItems,
        activeCreators: 3420,
        globalFulfillmentCenters: 8,
        averageFulfillmentHours: 24,
        totalRevenue: Math.round(totalRevenue + 284500),
      });
    }

    const totalRevenue = memoryStore.orders.reduce((acc, curr) => acc + curr.total, 0);
    const printedItems =
      memoryStore.orders.reduce((acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0), 0) +
      12450;

    res.json({
      totalOrders: memoryStore.orders.length + 8430,
      printedItems,
      activeCreators: 3420,
      globalFulfillmentCenters: 8,
      averageFulfillmentHours: 24,
      totalRevenue: Math.round(totalRevenue + 284500),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Newsletter subscription
 * @route   POST /api/newsletter
 * @access  Public
 */
export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const emailTrimmed = email.trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const exists = await Subscriber.findOne({ email: emailTrimmed });
      if (!exists) {
        await Subscriber.create({ email: emailTrimmed });
      }
      return res.json({
        success: true,
        message: 'Thank you for subscribing to PrintFlow Creator Digest!',
      });
    }

    if (!memoryStore.subscribers.includes(emailTrimmed)) {
      memoryStore.subscribers.push(emailTrimmed);
    }

    res.json({
      success: true,
      message: 'Thank you for subscribing to PrintFlow Creator Digest!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
