import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';
import Order from '../models/Order';
import Notification from '../models/Notification';
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

    // 2. Seed Categories if none exist
    const defaultCategories = [
      {
        name: 'Apparel',
        slug: 'apparel',
        description: 'Premium custom t-shirts, hoodies, sweatshirts, and apparel blanks.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        status: true,
      },
      {
        name: 'Home Decor',
        slug: 'home-decor',
        description: 'Museum-quality archival canvases, ceramic mugs, and living essentials.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        status: true,
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Heavy-duty canvas totes, embroidered dad hats, and daily lifestyle accents.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        status: true,
      },
      {
        name: 'Stationery',
        slug: 'stationery',
        description: 'Hardcover ruled journals, custom die-cut sticker packs, and paper goods.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        status: true,
      },
    ];

    const categoryMap: Record<string, any> = {};
    for (const cat of defaultCategories) {
      let doc = await Category.findOne({ slug: cat.slug });
      if (!doc) {
        doc = await Category.create(cat);
      }
      categoryMap[cat.name] = doc;
    }

    // 3. Seed Products if none exist or migrate existing products
    const productCategoryAssignment: Record<string, string> = {
      'prod-1': 'Apparel',
      'prod-2': 'Apparel',
      'prod-3': 'Apparel',
      'prod-4': 'Apparel',
      'prod-5': 'Apparel',
      'prod-6': 'Apparel',
      'prod-7': 'Home Decor',
      'prod-8': 'Home Decor',
      'prod-9': 'Accessories',
      'prod-10': 'Accessories',
      'prod-11': 'Stationery',
      'prod-12': 'Stationery',
    };

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('🌱 Seeding default products in MongoDB with Category references...');
      const productsToInsert = INITIAL_PRODUCTS.map((p) => {
        const catName = productCategoryAssignment[p.id] || 'Apparel';
        const catDoc = categoryMap[catName] || categoryMap['Apparel'];

        return {
          productId: p.id,
          name: p.name,
          category: catDoc?._id,
          price: p.price,
          stock: p.stock || 50,
          spec: p.spec,
          description: p.description,
          sizes: p.sizes,
          colors: p.colors,
          image: p.image,
          tag: p.tag,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          featured: p.featured,
          details: p.details,
        };
      });
      await Product.insertMany(productsToInsert);
      console.log('✅ Products seeded successfully with category references.');
    }

    // 3. Seed sample Orders if none exist
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('🌱 Seeding default sample orders in MongoDB...');
      const hoodie = INITIAL_PRODUCTS.find((p) => p.id === 'prod-2') || INITIAL_PRODUCTS[0];
      const tee = INITIAL_PRODUCTS.find((p) => p.id === 'prod-1') || INITIAL_PRODUCTS[0];

      await Order.create([
        {
          orderId: 'PF-98421',
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
            { status: 'pending', label: 'Order Received', timestamp: new Date('2024-03-01T14:20:00Z'), description: 'Order validated and queued for DTG printing.' },
            { status: 'processing', label: 'Color Separation', timestamp: new Date('2024-03-01T14:35:00Z'), description: 'High-res artwork rasterized for Kornit Avalanche.' },
            { status: 'printing', label: 'Garment Printing', timestamp: new Date('2024-03-01T15:10:00Z'), description: 'Heavyweight black fleece loaded into print bed.' },
          ],
        },
        {
          orderId: 'PF-98418',
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
            { status: 'pending', label: 'Order Received', timestamp: new Date('2024-02-28T09:12:00Z'), description: 'Order received and confirmed.' },
            { status: 'processing', label: 'Artwork Verified', timestamp: new Date('2024-02-28T09:30:00Z'), description: 'Artwork pre-flight passed 300 DPI check.' },
            { status: 'printing', label: 'Direct to Garment Print', timestamp: new Date('2024-02-28T11:00:00Z'), description: 'Eco-certified pigment ink cured at 180°C.' },
            { status: 'quality_check', label: 'Passed QA Inspection', timestamp: new Date('2024-02-28T14:00:00Z'), description: '100% Cotton wash-tested & packed.' },
            { status: 'shipped', label: 'Dispatched via FedEx', timestamp: new Date('2024-02-28T16:45:00Z'), description: 'Package picked up from Fulfillment Hub #3.' },
          ],
        },
      ]);
      console.log('✅ Orders seeded successfully.');
    }

    // 4. Seed Notifications if none exist
    const notifCount = await Notification.countDocuments();
    if (notifCount === 0) {
      await Notification.create([
        {
          notifId: 'notif-1',
          title: 'Production Update: Order #PF-98421',
          message: 'Your Heavyweight Pullover Hoodie is now on the DTG printing line.',
          type: 'production',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          read: false,
          orderId: 'PF-98421',
        },
        {
          notifId: 'notif-2',
          title: 'Order Shipped: #PF-98418',
          message: 'Your package is on its way via FedEx. Estimated delivery: 2 business days.',
          type: 'order',
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          read: true,
          orderId: 'PF-98418',
        },
        {
          notifId: 'notif-3',
          title: 'Spring Creator Boost',
          message: 'Get free sample shipping on all custom sample apparel orders this week with code SPRINGPRINT.',
          type: 'promo',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          read: true,
        },
      ]);
    }
  } catch (err: any) {
    console.warn('⚠️ Seeding note:', err.message);
  }
};
