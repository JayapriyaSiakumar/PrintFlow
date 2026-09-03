import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, User, CartItem, Order, CustomDesign, LiveNotification, FilterState, Category, Size, SortOption } from '../types';
import { api, getStoredToken } from '../services/api';
import { subscribeToSocketEvents } from '../services/socket';
import { INITIAL_PRODUCTS } from '../data/initialData';

export type ActiveView = 'products' | 'how-it-works' | 'pricing' | 'design-tool' | 'unit-tests';

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'production' | 'promo' | 'success';
}

interface AppContextType {
  // Navigation & View
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  // Products & Filters
  products: Product[];
  totalProducts: number;
  loadingProducts: boolean;
  filters: FilterState;
  setCategory: (cat: Category) => void;
  toggleSizeFilter: (size: Size) => void;
  toggleColorFilter: (hex: string) => void;
  setPriceRange: (min: string, max: string) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
  refreshProducts: () => Promise<void>;

  // Favorites / Wishlist
  favorites: string[];
  wishlistCount: number;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Selected Product for Quick View or Customizer
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  designingProduct: Product | null;
  setDesigningProduct: (product: Product | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Auth
  user: User | null;
  token: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role?: string, storeName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; storeName?: string; avatar?: string }) => Promise<void>;

  // User Dashboard Modal
  isDashboardOpen: boolean;
  setIsDashboardOpen: (open: boolean) => void;
  dashboardTab: 'orders' | 'designs' | 'wishlist' | 'profile' | 'admin';
  setDashboardTab: (tab: 'orders' | 'designs' | 'wishlist' | 'profile' | 'admin') => void;

  // Orders
  orders: Order[];
  loadingOrders: boolean;
  createOrder: (shippingAddress: any) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: string, note?: string) => Promise<void>;
  latestOrder: Order | null;
  setLatestOrder: (order: Order | null) => void;

  // Custom Designs
  savedDesigns: CustomDesign[];
  saveCustomDesign: (designData: Partial<CustomDesign>) => Promise<CustomDesign>;
  deleteCustomDesign: (designId: string) => Promise<void>;

  // Notifications & Realtime
  notifications: LiveNotification[];
  unreadCount: number;
  isNotificationDropdownOpen: boolean;
  setIsNotificationDropdownOpen: (open: boolean) => void;
  markNotificationsRead: (id?: string) => Promise<void>;
  socketConnected: boolean;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  sendLiveBroadcast: (data: { title: string; message: string; type?: string; orderId?: string }) => Promise<void>;

  // Live Activity feed stream
  liveActivities: { id: string; text: string; time: string; type: string }[];

  // Admin Demo Simulator Drawer
  isAdminSimulatorOpen: boolean;
  setIsAdminSimulatorOpen: (open: boolean) => void;
}

const defaultFilters: FilterState = {
  category: 'Apparel',
  sizes: [],
  colors: [],
  minPrice: '',
  maxPrice: '',
  sortBy: 'newest',
  searchQuery: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('products');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [totalProducts, setTotalProducts] = useState<number>(INITIAL_PRODUCTS.length);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('printflow_favorites');
      return saved ? JSON.parse(saved) : ['prod-3'];
    } catch {
      return ['prod-3'];
    }
  });

  // Modals & Drawers
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [designingProduct, setDesigningProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [dashboardTab, setDashboardTab] = useState<'orders' | 'designs' | 'wishlist' | 'profile' | 'admin'>('orders');
  const [isAdminSimulatorOpen, setIsAdminSimulatorOpen] = useState<boolean>(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('printflow_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());

  // Orders & Designs
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<CustomDesign[]>([]);

  // Real-time notifications & Sockets
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [liveActivities, setLiveActivities] = useState<{ id: string; text: string; time: string; type: string }[]>([
    { id: 'act-1', text: 'Alex in New York customized Heavyweight Pullover Hoodie', time: 'Just now', type: 'design_created' },
    { id: 'act-2', text: 'Elena placed order #PF-98418 for Essential Crewneck', time: '2m ago', type: 'order_placed' },
  ]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync favorites & cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('printflow_favorites', JSON.stringify(favorites));
    } catch {
      // Ignore
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('printflow_cart', JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  // Load Products with current filters
  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.getProducts(filters);
      setProducts(res.products);
      setTotalProducts(res.total);
    } catch (err) {
      console.warn('Fallback to local product catalog filter:', err);
      let local = [...INITIAL_PRODUCTS];
      if (filters.category && filters.category !== 'Apparel') {
        local = local.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase());
      } else if (filters.category) {
        local = local.filter((p) => p.category === filters.category);
      }
      if (filters.sizes.length > 0) {
        local = local.filter((p) => p.sizes.some((s) => filters.sizes.includes(s)));
      }
      if (filters.colors.length > 0) {
        local = local.filter((p) => p.colors.some((c) => filters.colors.includes(c.hex.toLowerCase())));
      }
      if (filters.minPrice) local = local.filter((p) => p.price >= Number(filters.minPrice));
      if (filters.maxPrice) local = local.filter((p) => p.price <= Number(filters.maxPrice));
      if (filters.sortBy === 'price-asc') local.sort((a, b) => a.price - b.price);
      else if (filters.sortBy === 'price-desc') local.sort((a, b) => b.price - a.price);
      else if (filters.sortBy === 'popular') local.sort((a, b) => b.rating * b.reviewsCount - a.rating * a.reviewsCount);
      else local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setProducts(local);
      setTotalProducts(local.length);
    } finally {
      setLoadingProducts(false);
    }
  }, [filters]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Initial Auth Check
  useEffect(() => {
    const initAuth = async () => {
      const existingToken = getStoredToken();
      if (existingToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          api.logout();
          setUser(null);
          setToken(null);
        }
      }
    };
    initAuth();
  }, []);

  // Fetch Notifications & Orders
  const loadInitialData = useCallback(async () => {
    try {
      const [notifsRes, ordersRes, designsRes] = await Promise.allSettled([
        api.getNotifications(),
        api.getOrders(),
        api.getDesigns(),
      ]);

      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.notifications);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders);
      if (designsRes.status === 'fulfilled') setSavedDesigns(designsRes.value.designs);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, user]);

  // Subscribe to Live Socket.io Events
  useEffect(() => {
    const unsubscribe = subscribeToSocketEvents({
      onStatusChange: (status) => setSocketConnected(status),
      onNotification: (notif) => {
        setNotifications((prev) => [notif, ...prev]);
        addToast({
          title: notif.title,
          message: notif.message,
          type: notif.type,
        });
      },
      onOrderStatusUpdated: (data) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === data.orderId ? { ...o, status: data.status as any, timeline: data.timeline } : o))
        );
        addToast({
          title: `Order #${data.orderId} Update`,
          message: `Status updated to: ${data.status.toUpperCase()}`,
          type: 'production',
        });
      },
      onOrderCreated: (data) => {
        setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)]);
      },
      onActivityLive: (activity) => {
        setLiveActivities((prev) => [
          { id: `act-${Date.now()}`, text: activity.text, time: 'Just now', type: activity.type },
          ...prev.slice(0, 15),
        ]);
      },
    });

    return () => unsubscribe();
  }, [addToast]);

  // Filter Actions
  const setCategory = (category: Category) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  const toggleSizeFilter = (size: Size) => {
    setFilters((prev) => {
      const exists = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: exists ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
      };
    });
  };

  const toggleColorFilter = (hex: string) => {
    const lower = hex.toLowerCase();
    setFilters((prev) => {
      const exists = prev.colors.includes(lower);
      return {
        ...prev,
        colors: exists ? prev.colors.filter((c) => c !== lower) : [...prev.colors, lower],
      };
    });
  };

  const setPriceRange = (minPrice: string, maxPrice: string) => {
    setFilters((prev) => ({ ...prev, minPrice, maxPrice }));
  };

  const setSortBy = (sortBy: SortOption) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const setSearchQuery = (searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  // Favorites Actions
  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      addToast({
        title: exists ? 'Removed from Favorites' : 'Saved to Favorites',
        message: exists ? 'Product removed from your wishlist' : 'Product saved to your wishlist',
        type: 'success',
      });
      return updated;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Cart Actions
  const addToCart = (item: Omit<CartItem, 'id' | 'totalPrice'>) => {
    const itemId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const totalPrice = item.unitPrice * item.quantity;
    const newItem: CartItem = {
      ...item,
      id: itemId,
      totalPrice,
    };

    setCart((prev) => [...prev, newItem]);
    setIsCartOpen(true);
    addToast({
      title: 'Added to Cart',
      message: `${item.product.name} (${item.size}, ${item.color.name}) added to cart`,
      type: 'success',
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity, totalPrice: i.unitPrice * quantity } : i))
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Auth Actions
  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setUser(res.user);
    setToken(res.token);
    closeAuthModal();
    addToast({
      title: 'Welcome Back!',
      message: `Signed in as ${res.user.name} (${res.user.role})`,
      type: 'success',
    });
  };

  const register = async (name: string, email: string, pass: string, role = 'creator', storeName?: string) => {
    const res = await api.register({ name, email, password: pass, role, storeName });
    setUser(res.user);
    setToken(res.token);
    closeAuthModal();
    addToast({
      title: 'Account Created!',
      message: `Welcome to PrintFlow, ${res.user.name}!`,
      type: 'success',
    });
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
    addToast({
      title: 'Signed Out',
      message: 'You have been signed out of your session',
      type: 'system',
    });
  };

  const updateProfile = async (data: { name?: string; storeName?: string; avatar?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    setToken(res.token);
    addToast({
      title: 'Profile Updated',
      message: 'Your creator details have been saved',
      type: 'success',
    });
  };

  // Orders Actions
  const createOrder = async (shippingAddress: any): Promise<Order> => {
    const shipping = cartSubtotal >= 75 ? 0 : 5.99;
    const discount = cartSubtotal > 100 ? 10.0 : 0;
    const total = cartSubtotal + shipping - discount;

    const orderPayload = {
      items: cart,
      subtotal: cartSubtotal,
      shipping,
      discount,
      total,
      shippingAddress,
      customerName: user ? user.name : shippingAddress.name || 'Valued Customer',
      customerEmail: user ? user.email : shippingAddress.email || 'customer@example.com',
    };

    const newOrder = await api.createOrder(orderPayload);
    setOrders((prev) => [newOrder, ...prev]);
    setLatestOrder(newOrder);
    clearCart();
    setIsCartOpen(false);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: string, note?: string) => {
    const updated = await api.updateOrderStatus(orderId, status, note);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  // Custom Designs Actions
  const saveCustomDesign = async (designData: Partial<CustomDesign>): Promise<CustomDesign> => {
    const saved = await api.saveDesign(designData);
    setSavedDesigns((prev) => [saved, ...prev]);
    addToast({
      title: 'Design Saved!',
      message: `Saved "${saved.name}" to your workspace`,
      type: 'success',
    });
    return saved;
  };

  const deleteCustomDesign = async (designId: string) => {
    await api.deleteDesign(designId);
    setSavedDesigns((prev) => prev.filter((d) => d.id !== designId));
    addToast({
      title: 'Design Removed',
      message: 'Custom design deleted from your collection',
      type: 'system',
    });
  };

  // Notifications Actions
  const markNotificationsRead = async (id?: string) => {
    await api.markNotificationRead(id);
    if (id) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const sendLiveBroadcast = async (data: { title: string; message: string; type?: string; orderId?: string }) => {
    await api.sendAdminBroadcast(data);
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        products,
        totalProducts,
        loadingProducts,
        filters,
        setCategory,
        toggleSizeFilter,
        toggleColorFilter,
        setPriceRange,
        setSortBy,
        setSearchQuery,
        resetFilters,
        refreshProducts,
        favorites,
        wishlistCount: favorites.length,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleFavorite,
        isFavorite,
        quickViewProduct,
        setQuickViewProduct,
        designingProduct,
        setDesigningProduct,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        user,
        token,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        isDashboardOpen,
        setIsDashboardOpen,
        dashboardTab,
        setDashboardTab,
        orders,
        loadingOrders,
        createOrder,
        updateOrderStatus,
        latestOrder,
        setLatestOrder,
        savedDesigns,
        saveCustomDesign,
        deleteCustomDesign,
        notifications,
        unreadCount,
        isNotificationDropdownOpen,
        setIsNotificationDropdownOpen,
        markNotificationsRead,
        socketConnected,
        toasts,
        removeToast,
        sendLiveBroadcast,
        liveActivities,
        isAdminSimulatorOpen,
        setIsAdminSimulatorOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
