export type Category = string;
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL';
export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export interface CategoryItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status: boolean;
  productCount?: number;
  subcategoriesCount?: number;
  subcategories?: SubcategoryItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SubcategoryItem {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  category: string | CategoryItem;
  description?: string;
  image?: string;
  status: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  bgClass: string;
}

export interface Product {
  id: string;
  productId?: string;
  name: string;
  price: number;
  category: string | CategoryItem;
  subcategory?: string | SubcategoryItem;
  categoryName?: string;
  subcategoryName?: string;
  spec: string;
  description: string;
  sizes: Size[];
  colors: ProductColor[];
  image: string;
  tag?: 'Bestseller' | 'New' | 'Popular' | 'Eco' | string;
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

export type UserRole = 'user' | 'admin' | 'creator' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  storeName?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type DesignSide = 'front' | 'back' | 'left' | 'right';
export type DesignElementType = 'text' | 'image';

export interface DesignElement {
  id: string;
  type: DesignElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  zIndex?: number;
  locked?: boolean;
  visible?: boolean;
  opacity?: number;
  
  // Text element specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic';
  align?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  
  // Image element specific
  src?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  aspectRatio?: number;
  dpiQuality?: 'high' | 'medium' | 'low';
}

export interface SideDesignState {
  elements: DesignElement[];
  previewDataUrl?: string;
}

export interface ProductCustomizationConfig {
  sides: {
    front: SideDesignState;
    back: SideDesignState;
    [key: string]: SideDesignState | undefined;
  };
  activeSide: DesignSide;
  selectedColorHex: string;
  selectedSize: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  lastSavedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  size: Size;
  color: ProductColor;
  quantity: number;
  customDesign?: {
    designId?: string;
    text?: string;
    textColor?: string;
    fontFamily?: string;
    graphicUrl?: string;
    placement?: 'front' | 'back' | 'chest';
    previewDataUrl?: string;
    previewDataUrlBack?: string;
    sides?: {
      front?: SideDesignState;
      back?: SideDesignState;
      [key: string]: any;
    };
    designConfig?: ProductCustomizationConfig;
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
  selectedSize?: string;
  designText?: string;
  designTextColor?: string;
  designFont?: string;
  graphicUrl?: string;
  placement: 'front' | 'back' | 'chest';
  previewDataUrl?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  sides?: {
    front?: SideDesignState;
    back?: SideDesignState;
    [key: string]: any;
  };
  designConfig?: ProductCustomizationConfig;
  createdAt: string;
  updatedAt?: string;
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
  subcategory?: string;
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

export interface AdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalDesigns: number;
  pendingOrders: number;
  recentOrders: Order[];
  recentUsers: User[];
  ordersByStatus: Record<string, number>;
}

