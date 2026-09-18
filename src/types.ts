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
  imagePublicId?: string;
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
  categoryName?: string;
  spec: string;
  description: string;
  sizes: Size[];
  colors: ProductColor[];
  image: string;
  imagePublicId?: string;
  mockupImages?: { side?: 'front' | 'back' | string; url: string; publicId?: string }[];
  tag?: 'Bestseller' | 'New' | 'Popular' | 'Eco' | string;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  stock: number;
  createdAt: string;
  customizationConfig?: GenericCustomizationConfig;
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

export type DesignSide = 'front' | 'back' | 'left' | 'right' | string;
export type DesignElementType = 'text' | 'image';
export type PrintableAreaShape = 'rectangle' | 'rounded' | 'circle';

export interface PrintableAreaDefinition {
  x: number; // percentage (0-100) or virtual pixels (e.g. 135)
  y: number; // percentage (0-100) or virtual pixels (e.g. 110)
  width: number; // percentage or px
  height: number; // percentage or px
  isPercentage?: boolean; // whether coordinates are normalized 0-100
  shape?: PrintableAreaShape;
  borderRadius?: number;
  safeMargin?: number;
}

export interface ProductCustomizationView {
  id: string; // e.g. 'front', 'back', 'wrap', 'left_sleeve', 'top_lid', 'case_back'
  name: string; // e.g. 'Front View', 'Back View', 'Panoramic Wrap', 'Left Sleeve'
  mockupUrl: string; // Blank product mockup image for this angle/view
  mockupPublicId?: string;
  overlayUrl?: string; // Optional texture or mask overlay
  overlayPublicId?: string;
  printableArea: PrintableAreaDefinition;
  allowedElementTypes?: ('text' | 'image')[];
  maxElements?: number;
  description?: string;
}

export interface GenericCustomizationConfig {
  enabled: boolean;
  previewType?: 'canvas_2d' | '3d_mockup' | 'flat';
  views: ProductCustomizationView[];
  colorTinting?: {
    enabled: boolean;
    blendMode?: 'multiply' | 'overlay' | 'source-atop';
    opacity?: number;
  };
  allowedSizes?: string[];
  pricingPerView?: number;
  extraViewPrice?: number;
  pricingPerElement?: number;
  instructions?: string;
}

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
  publicId?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  aspectRatio?: number;
  dpiQuality?: 'high' | 'medium' | 'low';
}

export interface SideDesignState {
  elements: DesignElement[];
  previewDataUrl?: string;
  previewDataUrlPublicId?: string;
}

export interface ProductCustomizationConfig {
  sides: {
    front?: SideDesignState;
    back?: SideDesignState;
    [key: string]: SideDesignState | undefined;
  };
  views?: Record<string, SideDesignState>;
  customizationConfig?: GenericCustomizationConfig;
  activeSide: DesignSide;
  activeViewId?: string;
  selectedColorHex: string;
  selectedSize: string;
  previewFrontUrl?: string;
  previewFrontPublicId?: string;
  previewBackUrl?: string;
  previewBackPublicId?: string;
  previewsByView?: Record<string, string>;
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
    graphicPublicId?: string;
    placement?: 'front' | 'back' | 'chest';
    previewDataUrl?: string;
    previewDataUrlPublicId?: string;
    previewDataUrlBack?: string;
    previewDataUrlBackPublicId?: string;
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
  graphicPublicId?: string;
  placement: 'front' | 'back' | 'chest';
  previewDataUrl?: string;
  previewDataUrlPublicId?: string;
  previewFrontUrl?: string;
  previewFrontPublicId?: string;
  previewBackUrl?: string;
  previewBackPublicId?: string;
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

