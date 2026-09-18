import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Order from '../models/Order';
import Notification from '../models/Notification';
import CustomDesign from '../models/CustomDesign';
import { INITIAL_PRODUCTS } from '../../src/data/initialData';

export const seedInitialDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    // 1. Seed Users if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding default users in MongoDB...');
      const salt = await bcrypt.genSalt(10);
      await User.create([
        {
          name: 'Alex Rivera',
          email: 'alex@printflow.io',
          password: 'password123',
          role: 'user',
          storeName: 'Rivera Streetwear Co.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        },
        {
          name: 'Jordan Hayes (Admin)',
          email: 'admin@printflow.io',
          password: 'admin123',
          role: 'admin',
          storeName: 'PrintFlow Headquarters',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
        {
          name: 'Elena Rostova',
          email: 'elena@gmail.com',
          password: 'customer123',
          role: 'user',
          storeName: 'Elena Studio',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        },
      ]);
      console.log('✅ Users seeded successfully.');
    }

    // 2. Clear Categories (users preserved)
    await Category.deleteMany({});

    // 3. Clear Products, Orders, Notifications, Designs (keeping Users only)
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Notification.deleteMany({});
    await CustomDesign.deleteMany({});
    console.log('🧹 Database state cleared: Categories, Products, Orders, Designs, and Notifications wiped (Users kept).');
  } catch (err: any) {
    console.warn('⚠️ Seeding note:', err.message);
  }
};
