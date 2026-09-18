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

    // All categories cleared as requested; admin can create new categories in Category Management
    this.categories = [];

    // All products removed as requested; admin can create products or click 'Load Sample Products'
    this.products = [];
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

    this.orders = [];
    this.designs = [];
    this.notifications = [];
  }
}

export const memoryStore = new MemoryStore();
export default memoryStore;
