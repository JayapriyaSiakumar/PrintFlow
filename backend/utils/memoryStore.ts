import bcrypt from 'bcryptjs';
import { INITIAL_PRODUCTS } from '../../src/data/initialData';
import { Product, Order, User, CustomDesign, LiveNotification } from '../../src/types';

/**
 * In-Memory fallback store used when running without a persistent MongoDB URI.
 * This guarantees zero downtime or crashes in local development or preview mode.
 */
class MemoryStore {
  products: Product[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  users: (User & { passwordHash: string })[] = [];
  orders: Order[] = [];
  designs: CustomDesign[] = [];
  notifications: LiveNotification[] = [];
  subscribers: string[] = ['alex@example.com', 'designstudio@creators.io'];
  resetTokens: Map<string, { email: string; expiresAt: number }> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const salt = bcrypt.genSaltSync(10);

    // Initial Categories
    this.categories = [
      {
        id: 'cat-apparel',
        name: 'Apparel',
        slug: 'apparel',
        description: 'Premium custom t-shirts, hoodies, sweatshirts, and apparel blanks.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat-home-decor',
        name: 'Home Decor',
        slug: 'home-decor',
        description: 'Museum-quality archival canvases, ceramic mugs, and living essentials.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat-accessories',
        name: 'Accessories',
        slug: 'accessories',
        description: 'Heavy-duty canvas totes, embroidered dad hats, and daily lifestyle accents.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'cat-stationery',
        name: 'Stationery',
        slug: 'stationery',
        description: 'Hardcover ruled journals, custom die-cut sticker packs, and paper goods.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    // Initial Subcategories
    this.subcategories = [
      {
        id: 'subcat-t-shirts',
        name: 'T-Shirts',
        slug: 't-shirts',
        category: 'cat-apparel',
        description: 'Classic crewnecks, relaxed fits, heavyweight cotton blanks.',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-hoodies',
        name: 'Hoodies & Fleece',
        slug: 'hoodies-fleece',
        category: 'cat-apparel',
        description: 'Plush fleece pullovers, zip hoodies, heavyweight streetwear.',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-polos-tops',
        name: 'Polos & Active Tops',
        slug: 'polos-active-tops',
        category: 'cat-apparel',
        description: 'Performance pique, moisture-wicking collars, activewear.',
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-canvas-wall-art',
        name: 'Canvas & Wall Art',
        slug: 'canvas-wall-art',
        category: 'cat-home-decor',
        description: 'Archival gallery wrapped timber frame canvas prints.',
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-drinkware-mugs',
        name: 'Drinkware & Mugs',
        slug: 'drinkware-mugs',
        category: 'cat-home-decor',
        description: 'Gloss ceramic sublimation mugs and insulated drinkware.',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-totes-bags',
        name: 'Bags & Totes',
        slug: 'bags-totes',
        category: 'cat-accessories',
        description: 'Heavy bull denim canvas everyday tote bags.',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-hats-headwear',
        name: 'Hats & Headwear',
        slug: 'hats-headwear',
        category: 'cat-accessories',
        description: 'Unstructured chino dad hats, baseball caps, and beanies.',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-journals-notebooks',
        name: 'Notebooks & Journals',
        slug: 'notebooks-journals',
        category: 'cat-stationery',
        description: 'Casebound matte hardcover journals with acid-free ruled paper.',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'subcat-stickers-decals',
        name: 'Stickers & Decals',
        slug: 'stickers-decals',
        category: 'cat-stationery',
        description: 'Contour die-cut UV-laminated waterproof vinyl sticker packs.',
        image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=800&q=80',
        status: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    // Map initial products with category and subcategory links
    const subcatMap: Record<string, { catId: string; subId: string; subName: string }> = {
      'prod-1': { catId: 'cat-apparel', subId: 'subcat-t-shirts', subName: 'T-Shirts' },
      'prod-2': { catId: 'cat-apparel', subId: 'subcat-hoodies', subName: 'Hoodies & Fleece' },
      'prod-3': { catId: 'cat-apparel', subId: 'subcat-t-shirts', subName: 'T-Shirts' },
      'prod-4': { catId: 'cat-apparel', subId: 'subcat-polos-tops', subName: 'Polos & Active Tops' },
      'prod-5': { catId: 'cat-apparel', subId: 'subcat-hoodies', subName: 'Hoodies & Fleece' },
      'prod-6': { catId: 'cat-apparel', subId: 'subcat-t-shirts', subName: 'T-Shirts' },
      'prod-7': { catId: 'cat-home-decor', subId: 'subcat-canvas-wall-art', subName: 'Canvas & Wall Art' },
      'prod-8': { catId: 'cat-home-decor', subId: 'subcat-drinkware-mugs', subName: 'Drinkware & Mugs' },
      'prod-9': { catId: 'cat-accessories', subId: 'subcat-totes-bags', subName: 'Bags & Totes' },
      'prod-10': { catId: 'cat-accessories', subId: 'subcat-hats-headwear', subName: 'Hats & Headwear' },
      'prod-11': { catId: 'cat-stationery', subId: 'subcat-journals-notebooks', subName: 'Notebooks & Journals' },
      'prod-12': { catId: 'cat-stationery', subId: 'subcat-stickers-decals', subName: 'Stickers & Decals' },
    };

    this.products = INITIAL_PRODUCTS.map((p) => {
      const mapping = subcatMap[p.id];
      const catObj = mapping ? this.categories.find((c) => c.id === mapping.catId) : null;
      const subObj = mapping ? this.subcategories.find((s) => s.id === mapping.subId) : null;

      return {
        ...p,
        category: catObj ? { id: catObj.id, name: catObj.name, slug: catObj.slug, status: catObj.status } : (p.category as any),
        subcategory: subObj ? { id: subObj.id, name: subObj.name, slug: subObj.slug, status: subObj.status, category: subObj.category } : undefined,
        categoryName: catObj ? catObj.name : (typeof p.category === 'string' ? p.category : ''),
        subcategoryName: subObj ? subObj.name : (mapping ? mapping.subName : ''),
      };
    });
    this.users = [
      {
        id: 'usr-1',
        name: 'Alex Rivera',
        email: 'alex@printflow.io',
        passwordHash: bcrypt.hashSync('password123', salt),
        role: 'user',
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
        role: 'user',
        storeName: 'Elena Studio',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        createdAt: '2024-01-15T00:00:00Z',
      },
    ];

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

    this.designs = [
      {
        id: 'dsg-101',
        userId: 'usr-1',
        name: 'Cyber Tokyo Wave Tee',
        productId: tee.id,
        productName: tee.name,
        productImage: tee.image,
        selectedColorHex: '#1a1a1a',
        selectedSize: 'L',
        designText: 'TOKYO WAVE',
        designTextColor: '#38bdf8',
        designFont: 'Montserrat',
        graphicUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
        placement: 'front',
        previewDataUrl: tee.image,
        previewFrontUrl: tee.image,
        previewBackUrl: tee.image,
        sides: {
          front: {
            elements: [
              {
                id: 'el-img-1',
                type: 'image',
                x: 60,
                y: 80,
                width: 180,
                height: 180,
                rotation: 0,
                src: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
                naturalWidth: 600,
                naturalHeight: 600,
                dpiQuality: 'high',
              },
              {
                id: 'el-txt-1',
                type: 'text',
                x: 40,
                y: 280,
                width: 220,
                height: 40,
                rotation: 0,
                text: 'TOKYO WAVE',
                fontSize: 26,
                fontFamily: 'Montserrat',
                fill: '#38bdf8',
                fontStyle: 'bold',
                align: 'center',
              },
            ],
          },
          back: {
            elements: [
              {
                id: 'el-txt-2',
                type: 'text',
                x: 50,
                y: 100,
                width: 200,
                height: 30,
                rotation: 0,
                text: 'LIMITED EDITION',
                fontSize: 16,
                fontFamily: 'Inter',
                fill: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
              },
            ],
          },
        },
        createdAt: '2024-03-01T10:00:00Z',
      },
      {
        id: 'dsg-102',
        userId: 'usr-1',
        name: 'Horizon Minimal Hoodie',
        productId: hoodie.id,
        productName: hoodie.name,
        productImage: hoodie.image,
        selectedColorHex: '#2b2d42',
        selectedSize: 'XL',
        designText: 'CREATOR CLUB',
        designTextColor: '#f8fafc',
        designFont: 'Inter',
        placement: 'front',
        previewDataUrl: hoodie.image,
        previewFrontUrl: hoodie.image,
        previewBackUrl: hoodie.image,
        sides: {
          front: {
            elements: [
              {
                id: 'el-txt-3',
                type: 'text',
                x: 45,
                y: 120,
                width: 210,
                height: 50,
                rotation: 0,
                text: 'CREATOR CLUB',
                fontSize: 24,
                fontFamily: 'Inter',
                fill: '#f8fafc',
                fontStyle: 'bold',
                align: 'center',
              },
            ],
          },
          back: { elements: [] },
        },
        createdAt: '2024-03-02T15:30:00Z',
      },
    ];

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

export const memoryStore = new MemoryStore();
export default memoryStore;
