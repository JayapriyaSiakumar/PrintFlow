export type Category = 'Apparel' | 'Home Decor' | 'Accessories' | 'Stationery';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL';
export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export interface ProductColor {
  name: string;
  hex: string;
  bgClass: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  spec: string;
  description: string;
  sizes: Size[];
  colors: ProductColor[];
  image: string;
  tag?: 'Bestseller' | 'New' | 'Popular' | 'Eco';
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  stock: number;
  createdAt: string;
  details: {
    material: string;
    weight: string;
    fit: string;
    care: string;
    origin: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'creator' | 'admin';
  avatar?: string;
  storeName?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  size: Size;
  color: ProductColor;
  quantity: number;
  customDesign?: {
    text?: string;
    textColor?: string;
    fontFamily?: string;
    graphicUrl?: string;
    placement?: 'front' | 'back' | 'chest';
  };
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'processing' | 'printing' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string;
  description: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  status: OrderStatus;
  trackingNumber?: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomDesign {
  id: string;
  userId: string;
  name: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedColorHex: string;
  designText?: string;
  designTextColor?: string;
  designFont?: string;
  graphicUrl?: string;
  placement: 'front' | 'back' | 'chest';
  previewDataUrl?: string;
  createdAt: string;
}

export interface LiveNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'production' | 'promo';
  timestamp: string;
  read: boolean;
  orderId?: string;
  actionUrl?: string;
}

export interface FilterState {
  category: Category;
  sizes: Size[];
  colors: string[]; // hex codes
  minPrice: string;
  maxPrice: string;
  sortBy: SortOption;
  searchQuery: string;
}

export interface TestSuiteResult {
  name: string;
  tests: {
    title: string;
    status: 'pass' | 'fail' | 'running';
    durationMs: number;
    error?: string;
  }[];
  passedCount: number;
  totalCount: number;
  durationMs: number;
}
