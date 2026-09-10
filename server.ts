import './backend/config/envSanitizer';
import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';

// Backend modules
import connectDB from './backend/config/db';
import { seedInitialDatabase } from './backend/utils/seedData';
import memoryStore from './backend/utils/memoryStore';
import {
  protect as authenticateJWT,
  adminOnly as requireAdmin,
  optionalAuth as optionalJWT,
  AuthenticatedRequest,
} from './backend/middleware/authMiddleware';
import { errorHandler } from './backend/middleware/errorMiddleware';

// Route modules
import authRoutes from './backend/routes/authRoutes';
import productRoutes from './backend/routes/productRoutes';
import categoryRoutes from './backend/routes/categoryRoutes';
import orderRoutes from './backend/routes/orderRoutes';
import designRoutes from './backend/routes/designRoutes';
import adminRoutes from './backend/routes/adminRoutes';
import notificationRoutes from './backend/routes/notificationRoutes';
import publicRoutes from './backend/routes/publicRoutes';
import uploadRoutes from './backend/routes/uploadRoutes';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB().then(async (conn) => {
  if (conn) {
    await seedInitialDatabase();
  }
});

// Bind strictly to Port 3000 as required by nginx reverse proxy
const PORT = 3000;

// Re-export for compatibility with tests and helpers
export const db = memoryStore;
export { authenticateJWT, requireAdmin, optionalJWT };
export type { AuthenticatedRequest };

export async function createExpressApp(ioInstance?: SocketIOServer) {
  const app = express();

  // 1. CORS & Body Parsers
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Socket notification forwarder middleware
  if (ioInstance) {
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.io = ioInstance;
      next();
    });
  }

  // 2. Connect Backend Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/designs', designRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api', publicRoutes);

  // Safe image proxy to prevent tainted canvas in client-side preview exports
  app.get('/api/proxy-image', async (req: Request, res: Response) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'URL parameter is required.' });
    }
    try {
      const fetchRes = await fetch(imageUrl);
      if (!fetchRes.ok) {
        return res.status(fetchRes.status).send('Failed to fetch remote image');
      }
      const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Backward compatibility aliases for root level routes
  app.use('/register', (req, res, next) => {
    req.url = '/register';
    authRoutes(req, res, next);
  });
  app.use('/login', (req, res, next) => {
    req.url = '/login';
    authRoutes(req, res, next);
  });
  app.use('/logout', (req, res, next) => {
    req.url = '/logout';
    authRoutes(req, res, next);
  });
  app.use('/me', (req, res, next) => {
    req.url = '/me';
    authRoutes(req, res, next);
  });
  app.use('/admin', adminRoutes);

  // 3. Error Handling Middleware (only for API routes)
  app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  io.on('connection', (socket) => {
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

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 PrintFlow MERN + Socket.IO Server running on http://0.0.0.0:${PORT}`);
  });

  return server;
}

// Start server unless under test environment
const isTestExecution = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('test'));
if (!isTestExecution) {
  startServer();
}
