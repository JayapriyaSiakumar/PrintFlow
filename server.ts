import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS } from './src/data/initialData';
import { Product, Order, User, CustomDesign, LiveNotification } from './src/types';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'printflow_secure_jwt_secret_key_2024_xyz';

// In-memory Database Store with Initial Seed Data
class Database {
  products: Product[] = [...INITIAL_PRODUCTS];
  users: (User & { passwordHash: string })[] = [];
  orders: Order[] = [];
  designs: CustomDesign[] = [];
  notifications: LiveNotification[] = [];
  subscribers: string[] = ['alex@example.com', 'designstudio@creators.io'];

  constructor() {
    this.seedUsers();
    this.seedOrders();
    this.seedNotifications();
  }

  private seedUsers() {
    const salt = bcrypt.genSaltSync(10);
    this.users = [
      {
        id: 'usr-1',
        name: 'Alex Rivera',
        email: 'alex@printflow.io',
        passwordHash: bcrypt.hashSync('password123', salt),
        role: 'creator',
        storeName: 'Rivera Streetwear Co.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'usr-2',
        name: 'Jordan Hayes (Admin)',
        email: 'admin@printflow.io',
        passwordHash: bcrypt.hashSync('admin123', salt),
        role: 'admin',
        storeName: 'PrintFlow Headquarters',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'usr-3',
        name: 'Elena Rostova',
        email: 'elena@gmail.com',
        passwordHash: bcrypt.hashSync('customer123', salt),
        role: 'customer',
        storeName: 'Elena Studio',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        createdAt: '2024-01-15T00:00:00Z',
      },
    ];
  }

  private seedOrders() {
    const hoodie = this.products.find((p) => p.id === 'prod-2') || this.products[0];
    const tee = this.products.find((p) => p.id === 'prod-1') || this.products[0];

    this.orders = [
      {
        id: 'PF-98421',
        userId: 'usr-1',
        customerName: 'Alex Rivera',
        customerEmail: 'alex@printflow.io',
        items: [
          {
            id: 'item-1',
            productId: hoodie.id,
            product: hoodie,
            size: 'L',
            color: hoodie.colors[0],
            quantity: 2,
            unitPrice: hoodie.price,
            totalPrice: hoodie.price * 2,
            customDesign: {
              text: 'RIVERA APPAREL',
              textColor: '#ffffff',
              fontFamily: 'Montserrat',
              placement: 'front',
            },
          },
        ],
        subtotal: 96.0,
        shipping: 5.99,
        discount: 10.0,
        total: 91.99,
        shippingAddress: {
          street: '742 Evergreen Terrace',
          city: 'Portland',
          state: 'OR',
          zip: '97201',
          country: 'United States',
        },
        status: 'printing',
        trackingNumber: 'USPS-94001000982348',
        timeline: [
          { status: 'pending', label: 'Order Received', timestamp: '2024-03-01T14:20:00Z', description: 'Order validated and queued for DTG printing.' },
          { status: 'processing', label: 'Color Separation', timestamp: '2024-03-01T14:35:00Z', description: 'High-res artwork rasterized for Kornit Avalanche.' },
          { status: 'printing', label: 'Garment Printing', timestamp: '2024-03-01T15:10:00Z', description: 'Heavyweight black fleece loaded into print bed.' },
        ],
        createdAt: '2024-03-01T14:20:00Z',
        updatedAt: '2024-03-01T15:10:00Z',
      },
      {
        id: 'PF-98418',
        userId: 'usr-3',
        customerName: 'Elena Rostova',
        customerEmail: 'elena@gmail.com',
        items: [
          {
            id: 'item-2',
            productId: tee.id,
            product: tee,
            size: 'M',
            color: tee.colors[1],
            quantity: 3,
            unitPrice: tee.price,
            totalPrice: tee.price * 3,
            customDesign: {
              text: 'MINIMAL WAVE',
              textColor: '#2170e4',
              fontFamily: 'Montserrat',
              placement: 'chest',
            },
          },
        ],
        subtotal: 72.0,
        shipping: 0.0,
        discount: 0.0,
        total: 72.0,
        shippingAddress: {
          street: '120 Broadway Ave, Apt 4B',
          city: 'New York',
          state: 'NY',
          zip: '10006',
          country: 'United States',
        },
        status: 'shipped',
        trackingNumber: 'FDX-7749129034',
        timeline: [
          { status: 'pending', label: 'Order Received', timestamp: '2024-02-28T09:12:00Z', description: 'Order received and confirmed.' },
          { status: 'processing', label: 'Artwork Verified', timestamp: '2024-02-28T09:30:00Z', description: 'Artwork pre-flight passed 300 DPI check.' },
          { status: 'printing', label: 'Direct to Garment Print', timestamp: '2024-02-28T11:00:00Z', description: 'Eco-certified pigment ink cured at 180°C.' },
          { status: 'quality_check', label: 'Passed QA Inspection', timestamp: '2024-02-28T14:00:00Z', description: '100% Cotton wash-tested & packed.' },
          { status: 'shipped', label: 'Dispatched via FedEx', timestamp: '2024-02-28T16:45:00Z', description: 'Package picked up from Fulfillment Hub #3.' },
        ],
        createdAt: '2024-02-28T09:12:00Z',
        updatedAt: '2024-02-28T16:45:00Z',
      },
    ];
  }

  private seedNotifications() {
    this.notifications = [
      {
        id: 'notif-1',
        title: 'Production Update: Order #PF-98421',
        message: 'Your Heavyweight Pullover Hoodie is now on the DTG printing line.',
        type: 'production',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        read: false,
        orderId: 'PF-98421',
      },
      {
        id: 'notif-2',
        title: 'Order Shipped: #PF-98418',
        message: 'Your package is on its way via FedEx. Estimated delivery: 2 business days.',
        type: 'order',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        read: true,
        orderId: 'PF-98418',
      },
      {
        id: 'notif-3',
        title: 'Spring Creator Boost',
        message: 'Get free sample shipping on all custom sample apparel orders this week with code SPRINGPRINT.',
        type: 'promo',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: true,
      },
    ];
  }
}

export const db = new Database();

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// JWT Authentication Middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional JWT Auth Middleware (for guest or logged in)
export const optionalJWT = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as User;
      req.user = decoded;
    } catch {
      // Ignore invalid optional tokens
    }
  }
  next();
};

export async function createExpressApp(ioInstance?: SocketIOServer) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Helper to emit socket events
  const emitSocket = (event: string, data: any, room?: string) => {
    if (!ioInstance) return;
    if (room) {
      ioInstance.to(room).emit(event, data);
    } else {
      ioInstance.emit(event, data);
    }
  };

  // --- HEALTH CHECK ---
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'PrintFlow MERN REST & Socket Engine',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      activeSockets: ioInstance ? ioInstance.engine.clientsCount : 0,
      totalProducts: db.products.length,
      totalOrders: db.orders.length,
    });
  });

  // --- STATS ENDPOINT ---
  app.get('/api/stats', (_req, res) => {
    const totalRevenue = db.orders.reduce((acc, curr) => acc + curr.total, 0);
    const printedItems = db.orders.reduce((acc, curr) => acc + curr.items.reduce((sum, item) => sum + item.quantity, 0), 0) + 12450;
    res.json({
      totalOrders: db.orders.length + 8430,
      printedItems,
      activeCreators: 3420,
      globalFulfillmentCenters: 8,
      averageFulfillmentHours: 24,
      totalRevenue: Math.round(totalRevenue + 284500),
    });
  });

  // --- PRODUCTS REST API ---
  app.get('/api/products', (req, res) => {
    let result = [...db.products];
    const { category, sizes, colors, minPrice, maxPrice, sort, search } = req.query;

    if (category && typeof category === 'string' && category !== 'All') {
      result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
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

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.spec.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (sort === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'popular') {
      result.sort((a, b) => b.rating * b.reviewsCount - a.rating * a.reviewsCount);
    } else {
      // Default: newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      products: result,
      total: result.length,
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });

  // --- AUTHENTICATION REST API ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role = 'creator', storeName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: (role === 'admin' ? 'admin' : role === 'customer' ? 'customer' : 'creator'),
      storeName: storeName || `${name}'s Collection`,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(email)}`,
      createdAt: new Date().toISOString(),
    };

    db.users.push({ ...newUser, passwordHash });

    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    // Emit live event for user joined
    emitSocket('activity:live', {
      type: 'user_joined',
      text: `${newUser.name} just joined the PrintFlow creator community!`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      token,
      user: newUser,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRecord = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, userRecord.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      storeName: userRecord.storeName,
      avatar: userRecord.avatar,
      createdAt: userRecord.createdAt,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user,
    });
  });

  app.get('/api/auth/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  app.put('/api/auth/profile', authenticateJWT, (req: AuthenticatedRequest, res) => {
    const userIndex = db.users.findIndex((u) => u.id === req.user?.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, storeName, avatar } = req.body;
    if (name) db.users[userIndex].name = name;
    if (storeName) db.users[userIndex].storeName = storeName;
    if (avatar) db.users[userIndex].avatar = avatar;

    const updatedUser: User = {
      id: db.users[userIndex].id,
      name: db.users[userIndex].name,
      email: db.users[userIndex].email,
      role: db.users[userIndex].role,
      storeName: db.users[userIndex].storeName,
      avatar: db.users[userIndex].avatar,
      createdAt: db.users[userIndex].createdAt,
    };

    const token = jwt.sign(updatedUser, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: updatedUser });
  });

  // --- ORDERS REST API ---
  app.get('/api/orders', optionalJWT, (req: AuthenticatedRequest, res) => {
    if (req.user && req.user.role === 'admin') {
      return res.json({ orders: db.orders });
    }
    if (req.user) {
      const userOrders = db.orders.filter((o) => o.userId === req.user?.id);
      return res.json({ orders: userOrders });
    }
    // Return sample/public recent orders if guest or demo
    res.json({ orders: db.orders.slice(0, 5) });
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  app.post('/api/orders', optionalJWT, (req: AuthenticatedRequest, res) => {
    const { items, customerName, customerEmail, shippingAddress, subtotal, shipping, discount, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    const orderId = `PF-${Math.floor(10000 + Math.random() * 90000)}`;
    const userId = req.user ? req.user.id : `guest-${Date.now()}`;
    const name = customerName || (req.user ? req.user.name : 'Valued Creator');
    const email = customerEmail || (req.user ? req.user.email : 'guest@example.com');

    const newOrder: Order = {
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
      status: 'pending',
      trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
      timeline: [
        {
          status: 'pending',
          label: 'Order Placed',
          timestamp: new Date().toISOString(),
          description: 'Payment verified. Print routing initiated to nearest automated hub.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);

    // Create notification
    const notification: LiveNotification = {
      id: `notif-${Date.now()}`,
      title: `Order Confirmed: #${orderId}`,
      message: `Your order of ${items.length} item(s) has been routed to the print queue.`,
      type: 'order',
      timestamp: new Date().toISOString(),
      read: false,
      orderId,
    };
    db.notifications.unshift(notification);

    // Emit Real-Time Socket Events
    emitSocket('order:created', {
      order: newOrder,
      message: `New order #${orderId} received from ${name}`,
    });

    emitSocket('notification:new', notification);

    emitSocket('activity:live', {
      type: 'order_placed',
      text: `${name} just placed an order for ${items[0]?.product?.name || 'custom apparel'}!`,
      timestamp: new Date().toISOString(),
      orderId,
    });

    res.status(201).json(newOrder);
  });

  app.put('/api/orders/:id/status', (req, res) => {
    const { status, note } = req.body;
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const validStatuses = ['pending', 'processing', 'printing', 'quality_check', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    order.status = status;
    order.updatedAt = new Date().toISOString();

    const statusDescriptions: Record<string, { label: string; desc: string }> = {
      pending: { label: 'Order Queued', desc: 'Order placed and waiting in queue.' },
      processing: { label: 'Artwork Rasterization', desc: 'High-definition color profiling & pre-treatment complete.' },
      printing: { label: 'Active Direct-to-Garment Printing', desc: 'Kornit industrial printer applying eco pigment inks.' },
      quality_check: { label: 'QA Inspection Passed', desc: 'Garment cured and inspected for color fidelity.' },
      shipped: { label: 'Dispatched to Carrier', desc: `Package handed to courier. Tracking: ${order.trackingNumber}` },
      delivered: { label: 'Delivered', desc: 'Delivered to customer doorstep.' },
      cancelled: { label: 'Order Cancelled', desc: 'Order voided upon request.' },
    };

    const currentInfo = statusDescriptions[status] || { label: status, desc: note || 'Status changed' };

    order.timeline.push({
      status,
      label: currentInfo.label,
      timestamp: new Date().toISOString(),
      description: note || currentInfo.desc,
    });

    const notif: LiveNotification = {
      id: `notif-${Date.now()}`,
      title: `Order #${order.id} Updated: ${currentInfo.label}`,
      message: note || currentInfo.desc,
      type: status === 'shipped' || status === 'delivered' ? 'order' : 'production',
      timestamp: new Date().toISOString(),
      read: false,
      orderId: order.id,
    };
    db.notifications.unshift(notif);

    // Real-time broadcast
    emitSocket('order:status_updated', {
      orderId: order.id,
      status,
      timeline: order.timeline,
      order,
    });

    emitSocket('notification:new', notif);

    emitSocket('activity:live', {
      type: 'status_update',
      text: `Order #${order.id} transitioned to: ${currentInfo.label}`,
      timestamp: new Date().toISOString(),
      orderId: order.id,
    });

    res.json(order);
  });

  // --- CUSTOM DESIGNS API ---
  app.get('/api/designs', optionalJWT, (req: AuthenticatedRequest, res) => {
    const userId = req.user ? req.user.id : 'demo-user';
    const userDesigns = db.designs.filter((d) => d.userId === userId || d.userId === 'demo-user');
    res.json({ designs: userDesigns });
  });

  app.post('/api/designs', optionalJWT, (req: AuthenticatedRequest, res) => {
    const { name, productId, productName, productImage, selectedColorHex, designText, designTextColor, designFont, graphicUrl, placement, previewDataUrl } = req.body;

    const newDesign: CustomDesign = {
      id: `dsg-${Date.now()}`,
      userId: req.user ? req.user.id : 'demo-user',
      name: name || 'Untitled Custom Creation',
      productId,
      productName,
      productImage,
      selectedColorHex,
      designText,
      designTextColor,
      designFont,
      graphicUrl,
      placement: placement || 'front',
      previewDataUrl,
      createdAt: new Date().toISOString(),
    };

    db.designs.unshift(newDesign);

    emitSocket('activity:live', {
      type: 'design_created',
      text: `${req.user ? req.user.name : 'A creator'} designed a custom ${productName}!`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(newDesign);
  });

  app.delete('/api/designs/:id', optionalJWT, (req, res) => {
    const index = db.designs.findIndex((d) => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Design not found' });
    }
    db.designs.splice(index, 1);
    res.json({ success: true, message: 'Design deleted successfully' });
  });

  // --- NOTIFICATIONS API ---
  app.get('/api/notifications', (_req, res) => {
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/read', (req, res) => {
    const { id } = req.body;
    if (id) {
      const notif = db.notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
    } else {
      db.notifications.forEach((n) => (n.read = true));
    }
    res.json({ success: true });
  });

  // --- ADMIN LIVE BROADCAST API (For real-time testing and simulations) ---
  app.post('/api/admin/broadcast', (req, res) => {
    const { title, message, type = 'system', orderId } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message required' });
    }

    const notif: LiveNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      orderId,
    };
    db.notifications.unshift(notif);

    emitSocket('broadcast:announcement', notif);
    emitSocket('notification:new', notif);

    res.json({ success: true, notification: notif });
  });

  // --- NEWSLETTER SUBSCRIPTION API ---
  app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!db.subscribers.includes(email.toLowerCase())) {
      db.subscribers.push(email.toLowerCase());
    }
    res.json({ success: true, message: 'Thank you for subscribing to PrintFlow Creator Digest!' });
  });

  return app;
}

export async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Send immediate welcome ping with live statistics
    socket.emit('socket:connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to PrintFlow Live WebSocket Engine',
    });

    socket.on('join:room', (room: string) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  // Mount API router
  const apiApp = await createExpressApp(io);
  app.use(apiApp);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PrintFlow MERN + Socket.IO Server running on http://0.0.0.0:${PORT}`);
  });

  return server;
}

// Start server in dev/prod unless in test environment
const isTestExecution = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));
if (!isTestExecution) {
  startServer();
}
