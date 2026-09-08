import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import { seedInitialDatabase } from './utils/seedData';
import { notFound, errorHandler } from './middleware/errorMiddleware';

// Route imports
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import designRoutes from './routes/designRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import publicRoutes from './routes/publicRoutes';

// 1. Load environment variables using dotenv
dotenv.config();

// 2. Connect to MongoDB before or during server startup
connectDB().then(async (conn) => {
  if (conn) {
    await seedInitialDatabase();
  }
});

// 3. Initialize the Express application
const app = express();

// 4. Configure middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 5. Connect all application routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', publicRoutes);

// Compatibility aliases
app.post('/register', (req, res, next) => {
  req.url = '/register';
  authRoutes(req, res, next);
});
app.post('/login', (req, res, next) => {
  req.url = '/login';
  authRoutes(req, res, next);
});

// 6. Global error-handling middleware
app.use(notFound);
app.use(errorHandler);

// 7. Start the server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Standalone Backend running on port ${PORT}`);
  });
}

export default app;
