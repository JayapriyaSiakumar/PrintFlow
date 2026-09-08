import { Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Notification from '../models/Notification';
import memoryStore from '../utils/memoryStore';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

/**
 * @desc    Get orders (Admin views all, user views own)
 * @route   GET /api/orders
 * @access  Private / Optional
 */
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json({ orders: [] });
    }

    const isAdmin = req.user.role === 'admin';

    if (mongoose.connection.readyState === 1) {
      const query = isAdmin ? {} : { userId: req.user.id };
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.json({ orders });
    }

    if (isAdmin) {
      return res.json({ orders: memoryStore.orders });
    }

    const userOrders = memoryStore.orders.filter((o) => o.userId === req.user?.id);
    res.json({ orders: userOrders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private / Optional
 */
export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let order = await Order.findOne({ orderId: id });
      if (!order && mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (req.user && req.user.role !== 'admin' && req.user.id !== order.userId) {
        return res.status(403).json({ success: false, error: 'Access forbidden: You cannot view this order.' });
      }

      return res.json(order);
    }

    const order = memoryStore.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (req.user && req.user.role !== 'admin' && req.user.id !== order.userId) {
      return res.status(403).json({ success: false, error: 'Access forbidden: You cannot view this order.' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Public / Optional auth
 */
export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, customerName, customerEmail, shippingAddress, subtotal, shipping, discount, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart items are required.' });
    }

    const orderId = `PF-${Math.floor(10000 + Math.random() * 90000)}`;
    const userId = req.user ? req.user.id : `guest-${Date.now()}`;
    const name = customerName || (req.user ? req.user.name : 'Valued Creator');
    const email = customerEmail || (req.user ? req.user.email : 'guest@example.com');
    const trackingNumber = `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const initialTimeline = [
      {
        status: 'pending',
        label: 'Order Placed',
        timestamp: new Date(),
        description: 'Payment verified. Print routing initiated to nearest automated hub.',
      },
    ];

    if (mongoose.connection.readyState === 1) {
      const newOrder = await Order.create({
        orderId,
        userId,
        customerName: name,
        customerEmail: email,
        items,
        subtotal: subtotal || 0,
        shipping: shipping || 0,
        discount: discount || 0,
        total: total || 0,
        shippingAddress: shippingAddress || {
          street: '100 Innovation Way',
          city: 'San Francisco',
          state: 'CA',
          zip: '94107',
          country: 'United States',
        },
        status: 'pending',
        trackingNumber,
        timeline: initialTimeline,
      });

      await Notification.create({
        notifId: `notif-${Date.now()}`,
        title: `Order Confirmed: #${orderId}`,
        message: `Your order of ${items.length} item(s) has been routed to the print queue.`,
        type: 'order',
        read: false,
        orderId,
      });

      return res.status(201).json(newOrder);
    }

    // Fallback store
    const newOrder = {
      id: orderId,
      userId,
      customerName: name,
      customerEmail: email,
      items,
      subtotal: subtotal || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      total: total || 0,
      shippingAddress: shippingAddress || {
        street: '100 Innovation Way',
        city: 'San Francisco',
        state: 'CA',
        zip: '94107',
        country: 'United States',
      },
      status: 'pending' as const,
      trackingNumber,
      timeline: [
        {
          status: 'pending' as const,
          label: 'Order Placed',
          timestamp: new Date().toISOString(),
          description: 'Payment verified. Print routing initiated to nearest automated hub.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryStore.orders.unshift(newOrder as any);

    memoryStore.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Order Confirmed: #${orderId}`,
      message: `Your order of ${items.length} item(s) has been routed to the print queue.`,
      type: 'order',
      timestamp: new Date().toISOString(),
      read: false,
      orderId,
    });

    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update order lifecycle status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin or system)
 */
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pending', 'processing', 'printing', 'quality_check', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid order status value.' });
    }

    const statusDescriptions: Record<string, { label: string; desc: string }> = {
      pending: { label: 'Order Queued', desc: 'Order placed and waiting in queue.' },
      processing: { label: 'Artwork Rasterization', desc: 'High-definition color profiling & pre-treatment complete.' },
      printing: { label: 'Active Direct-to-Garment Printing', desc: 'Kornit industrial printer applying eco pigment inks.' },
      quality_check: { label: 'QA Inspection Passed', desc: 'Garment cured and inspected for color fidelity.' },
      shipped: { label: 'Dispatched to Carrier', desc: 'Package handed to courier.' },
      delivered: { label: 'Delivered', desc: 'Delivered to customer doorstep.' },
      cancelled: { label: 'Order Cancelled', desc: 'Order voided upon request.' },
    };

    const currentInfo = statusDescriptions[status] || { label: status, desc: note || 'Status changed' };

    if (mongoose.connection.readyState === 1) {
      let order = await Order.findOne({ orderId: req.params.id });
      if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
        order = await Order.findById(req.params.id);
      }

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      order.status = status;
      order.timeline.push({
        status,
        label: currentInfo.label,
        timestamp: new Date(),
        description: note || currentInfo.desc,
      });

      await order.save();

      await Notification.create({
        notifId: `notif-${Date.now()}`,
        title: `Order #${order.orderId} Updated: ${currentInfo.label}`,
        message: note || currentInfo.desc,
        type: status === 'shipped' || status === 'delivered' ? 'order' : 'production',
        read: false,
        orderId: order.orderId,
      });

      return res.json(order);
    }

    const order = memoryStore.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status,
      label: currentInfo.label,
      timestamp: new Date().toISOString(),
      description: note || currentInfo.desc,
    });

    memoryStore.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Order #${order.id} Updated: ${currentInfo.label}`,
      message: note || currentInfo.desc,
      type: status === 'shipped' || status === 'delivered' ? 'order' : 'production',
      timestamp: new Date().toISOString(),
      read: false,
      orderId: order.id,
    });

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
