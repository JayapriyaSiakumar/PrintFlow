import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { User, Product, Order, CustomDesign, AdminDashboardStats, Category, GenericCustomizationConfig, ProductColor } from '../types';
import { CategoryManagement } from './admin/CategoryManagement';
import { OrderDesignViewerModal } from './admin/OrderDesignViewerModal';
import { CloudinaryImageUploader } from './admin/CloudinaryImageUploader';
import { CustomizationConfigEditor } from './admin/CustomizationConfigEditor';

const POPULAR_COLOR_PRESETS = [
  { name: 'Clean White', hex: '#ffffff' },
  { name: 'Onyx Black', hex: '#111111' },
  { name: 'Heather Grey', hex: '#9ca3af' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Forest Green', hex: '#15803d' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Dusty Rose', hex: '#f43f5e' },
  { name: 'Warm Beige', hex: '#d4b996' },
  { name: 'Olive Green', hex: '#556b2f' },
];
import {
  Shield,
  Users,
  Package,
  ShoppingBag,
  Palette,
  Radio,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  DollarSign,
  TrendingUp,
  X,
  Lock,
  ArrowRight,
  Filter,
  Check,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    user,
    isAdmin,
    openAuthModal,
    setActiveView,
    categories,
    refreshCategories,
    refreshProducts,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'products' | 'categories' | 'orders' | 'designs' | 'broadcast'
  >('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-UI Confirmation Modals (replaces window.confirm to guarantee reliability inside iframes)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  const [designToDelete, setDesignToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDesign, setIsDeletingDesign] = useState(false);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Products State
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<{
    name: string;
    category: string;
    price: number;
    stock: number;
    spec: string;
    description: string;
    image: string;
    imagePublicId: string;
    backMockupImage: string;
    backMockupPublicId: string;
    colors: ProductColor[];
    customizationConfig?: GenericCustomizationConfig;
  }>({
    name: '',
    category: 'Apparel',
    price: 29.99,
    stock: 50,
    spec: 'Standard Fit',
    description: '',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
    imagePublicId: '',
    backMockupImage: '',
    backMockupPublicId: '',
    colors: [
      { name: 'Clean White', hex: '#ffffff', bgClass: 'bg-white' },
      { name: 'Onyx Black', hex: '#111111', bgClass: 'bg-neutral-900' },
      { name: 'Heather Grey', hex: '#9ca3af', bgClass: 'bg-slate-400' },
      { name: 'Navy Blue', hex: '#1e3a8a', bgClass: 'bg-blue-900' },
    ],
    customizationConfig: undefined,
  });

  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#ffffff');

  const handleAddProductColor = (name: string, hex: string) => {
    if (!name.trim()) return;
    const exists = productForm.colors.some(
      (c) => c.hex.toLowerCase() === hex.toLowerCase() || c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) return;
    setProductForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: name.trim(), hex, bgClass: `bg-[${hex}]` }],
    }));
  };

  const handleRemoveProductColor = (colorHex: string) => {
    setProductForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c.hex.toLowerCase() !== colorHex.toLowerCase()),
    }));
  };

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Designs State
  const [designs, setDesigns] = useState<CustomDesign[]>([]);
  const [inspectingDesign, setInspectingDesign] = useState<CustomDesign | null>(null);

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'system' | 'promo' | 'order' | 'production'>('system');
  const [broadcastSending, setBroadcastSending] = useState(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadAllData = useCallback(async () => {
    if (!isAdmin) return;
    setRefreshing(true);
    try {
      const [statsRes, usersRes, prodsRes, ordersRes, designsRes] = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getAdminUsers(),
        api.getProducts(),
        api.getAdminOrders(),
        api.getAdminDesigns(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users);
      if (prodsRes.status === 'fulfilled') setAdminProducts(prodsRes.value.products);
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders);
      if (designsRes.status === 'fulfilled') setDesigns(designsRes.value.designs);

      await refreshCategories();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, refreshCategories]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Protected View Guard
  if (!user || !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 sm:p-12 bg-white rounded-2xl border border-purple-200 shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-['Montserrat'] font-bold text-2xl text-[#1a1c1c] mb-2">
            Administrator Access Required
          </h2>
          <p className="text-sm text-[#555f6f] mb-6 leading-relaxed">
            The PrintFlow Admin Dashboard is protected by role-based authorization. Only users with the <span className="font-semibold text-purple-700">Admin</span> role can access system metrics and moderation tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => openAuthModal('login')}
              id="btn-admin-signin-prompt"
              className="px-5 py-2.5 rounded-xl bg-[#6b38d4] hover:bg-[#582db5] text-white font-semibold text-xs shadow-sm transition-colors"
            >
              Sign In as Admin
            </button>
            <button
              onClick={() => setActiveView('products')}
              className="px-5 py-2.5 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] font-semibold text-xs transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Handlers: Users ---
  const handleRoleChange = async (targetUser: User, newRole: 'user' | 'admin') => {
    try {
      const res = await api.updateAdminUser(targetUser.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? res.user : u)));
      showFeedback('success', `Updated ${targetUser.name}'s role to ${newRole}`);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await api.deleteAdminUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showFeedback('success', `User ${userToDelete.name} deleted`);
      setUserToDelete(null);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // --- Handlers: Products ---
  const handleToggleStock = async (product: Product) => {
    try {
      const res = await api.toggleAdminProductStock(product.id);
      setAdminProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: res.inStock ? 50 : 0 } : p))
      );
      showFeedback('success', `${product.name} is now ${res.inStock ? 'In Stock' : 'Out of Stock'}`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to toggle product stock');
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await api.deleteAdminProduct(productToDelete.id);
      setAdminProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showFeedback('success', `Product "${productToDelete.name}" deleted successfully.`);
      setProductToDelete(null);
      await refreshProducts();
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete product');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleConfirmDeleteAllProducts = async () => {
    setIsDeletingAll(true);
    try {
      const res = await api.deleteAllAdminProducts();
      setAdminProducts([]);
      showFeedback('success', res.message || 'All products have been permanently deleted from catalog');
      setIsDeleteAllModalOpen(false);
      await refreshProducts();
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete all products');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleLoadSampleProducts = async () => {
    setIsLoadingSamples(true);
    try {
      const res = await api.loadSampleAdminProducts();
      setAdminProducts(res.products);
      showFeedback('success', `Successfully loaded ${res.products.length} sample products into catalog.`);
      await refreshProducts();
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load sample products');
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleProductCategoryChange = (newCatName: string) => {
    setProductForm((prev) => ({
      ...prev,
      category: newCatName,
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build mockups list: integrate both legacy and new generic views
      let mockups = [
        { side: 'front', url: productForm.image, publicId: productForm.imagePublicId },
        ...(productForm.backMockupImage
          ? [{ side: 'back', url: productForm.backMockupImage, publicId: productForm.backMockupPublicId }]
          : []),
      ];

      // If generic customization views exist, populate them into mockupImages array as well
      if (productForm.customizationConfig?.views && productForm.customizationConfig.views.length > 0) {
        const viewMockups = productForm.customizationConfig.views
          .filter((v) => v.mockupUrl)
          .map((v) => ({
            side: v.id,
            url: v.mockupUrl,
            publicId: v.mockupPublicId || '',
          }));
        if (viewMockups.length > 0) {
          // Merge while keeping unique sides
          const map = new Map<string, { side: string; url: string; publicId: string }>();
          mockups.forEach((m) => map.set(m.side, m));
          viewMockups.forEach((vm) => map.set(vm.side, vm));
          mockups = Array.from(map.values());
        }
      }

      const payload: any = {
        ...productForm,
        imagePublicId: productForm.imagePublicId,
        mockupImages: mockups,
        colors: productForm.colors,
        customizationConfig: productForm.customizationConfig,
      };

      if (editingProduct) {
        const res = await api.updateAdminProduct(editingProduct.id, payload);
        setAdminProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.product : p)));
        showFeedback('success', `Product "${res.product.name}" updated`);
      } else {
        const res = await api.createAdminProduct(payload);
        setAdminProducts((prev) => [res.product, ...prev]);
        showFeedback('success', `Product "${res.product.name}" created`);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAllData();
      await refreshCategories();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save product');
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    const defaultCat = categories.length > 0 ? categories[0].name : 'Apparel';

    setProductForm({
      name: '',
      category: defaultCat,
      price: 29.99,
      stock: 50,
      spec: 'Premium Ring-Spun Cotton',
      description: 'High-grade customizable blank crafted for durability and vibrant prints.',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
      imagePublicId: '',
      backMockupImage: '',
      backMockupPublicId: '',
      colors: [
        { name: 'Clean White', hex: '#ffffff', bgClass: 'bg-white' },
        { name: 'Onyx Black', hex: '#111111', bgClass: 'bg-neutral-900' },
        { name: 'Heather Grey', hex: '#9ca3af', bgClass: 'bg-slate-400' },
        { name: 'Navy Blue', hex: '#1e3a8a', bgClass: 'bg-blue-900' },
      ],
      customizationConfig: undefined,
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    const catVal =
      typeof product.category === 'object'
        ? product.category.name
        : product.categoryName || product.category;

    const frontMockup = product.mockupImages?.find((m) => m.side === 'front');
    const backMockup = product.mockupImages?.find((m) => m.side === 'back');

    setProductForm({
      name: product.name,
      category: catVal,
      price: product.price,
      stock: product.stock,
      spec: product.spec,
      description: product.description,
      image: product.image,
      imagePublicId: product.imagePublicId || frontMockup?.publicId || '',
      backMockupImage: backMockup?.url || '',
      backMockupPublicId: backMockup?.publicId || '',
      colors:
        product.colors && product.colors.length > 0
          ? product.colors
          : [
              { name: 'Clean White', hex: '#ffffff', bgClass: 'bg-white' },
              { name: 'Onyx Black', hex: '#111111', bgClass: 'bg-neutral-900' },
            ],
      customizationConfig: product.customizationConfig,
    });
    setIsProductModalOpen(true);
  };

  // --- Handlers: Orders ---
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await api.updateAdminOrder(orderId, { status: newStatus as any });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(res.order);
      }
      showFeedback('success', `Order #${orderId} status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update order');
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      await api.deleteAdminOrder(orderToDelete);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete));
      if (selectedOrder?.id === orderToDelete) setSelectedOrder(null);
      showFeedback('success', `Order #${orderToDelete} deleted`);
      setOrderToDelete(null);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete order');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // --- Handlers: Designs ---
  const handleDeleteDesign = (designId: string, designName: string) => {
    setDesignToDelete({ id: designId, name: designName });
  };

  const handleConfirmDeleteDesign = async () => {
    if (!designToDelete) return;
    setIsDeletingDesign(true);
    try {
      await api.deleteAdminDesign(designToDelete.id);
      setDesigns((prev) => prev.filter((d) => d.id !== designToDelete.id));
      showFeedback('success', `Custom design "${designToDelete.name}" removed`);
      setDesignToDelete(null);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove design');
    } finally {
      setIsDeletingDesign(false);
    }
  };

  // --- Handlers: Broadcast ---
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setBroadcastSending(true);
    try {
      await api.sendAdminBroadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
      });
      showFeedback('success', 'Real-time broadcast dispatched to all connected clients!');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to send broadcast');
    } finally {
      setBroadcastSending(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const filteredProducts = adminProducts.filter((p) => {
    const term = productSearch.toLowerCase();
    const catName = typeof p.category === 'object' ? p.category.name : (p.categoryName || p.category || '');
    return (
      p.name.toLowerCase().includes(term) ||
      catName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Montserrat'] font-bold text-2xl text-[#1a1c1c]">
                Admin Control Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                Administrator
              </span>
            </div>
            <p className="text-xs text-[#555f6f] mt-0.5">
              Manage system users, inventory, customer orders, and real-time announcements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            disabled={refreshing}
            id="btn-admin-refresh-data"
            className="px-3.5 py-2 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
          <button
            onClick={() => setActiveView('products')}
            className="px-3.5 py-2 rounded-xl bg-[#0058be] hover:bg-[#2170e4] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>View Public Store</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-[#ba1a1a]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            ${stats ? stats.totalRevenue.toFixed(2) : '0.00'}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> Real-time tracking
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#0058be]" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            {stats ? stats.totalOrders : orders.length}
          </div>
          <span className="text-[10px] text-[#727785] mt-0.5 block">Full lifecycle status</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            {stats ? stats.totalUsers : users.length}
          </div>
          <span className="text-[10px] text-purple-600 font-semibold block mt-0.5">
            {users.filter((u) => u.role === 'admin').length} Admin accounts
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Products</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            {stats ? stats.totalProducts : adminProducts.length}
          </div>
          <span className="text-[10px] text-[#727785] mt-0.5 block">Catalog items</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Categories</span>
            <Layers className="w-4 h-4 text-[#6b38d4]" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            {categories.length}
          </div>
          <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
            {categories.filter((c) => c.status !== false).length} Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Designs</span>
            <Palette className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            {stats ? stats.totalDesigns : designs.length}
          </div>
          <span className="text-[10px] text-[#727785] mt-0.5 block">User created</span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white rounded-xl border border-[#e2e2e2] p-1.5 flex flex-wrap gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          id="tab-admin-overview"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'overview'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          id="tab-admin-users"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          id="tab-admin-products"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'products'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products Catalog ({adminProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          id="tab-admin-categories"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'categories'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          id="tab-admin-orders"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'orders'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Orders Routing ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('designs')}
          id="tab-admin-designs"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'designs'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Designs Moderation ({designs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          id="tab-admin-broadcast"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'broadcast'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Live Broadcast</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders Overview */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#eeeeee]">
              <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                Recent Customer Orders
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-[#0058be] hover:underline"
              >
                View all orders →
              </button>
            </div>

            <div className="divide-y divide-[#eeeeee]">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1a1c1c]">#{ord.id}</span>
                      <span className="text-[#555f6f]">{ord.customerName}</span>
                    </div>
                    <p className="text-[11px] text-[#727785] mt-0.5">
                      {ord.items.length} items • {new Date(ord.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1a1c1c]">${ord.total.toFixed(2)}</span>
                    <span className="block text-[10px] font-semibold text-purple-600 uppercase">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Admin Actions & Status */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-xs space-y-4">
              <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={openNewProductModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Catalog Product
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Manage Categories ({categories.length})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('broadcast')}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0058be] font-semibold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4" /> Send Live Notification
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> Manage Registered Users
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-300" />
                <h4 className="font-bold text-sm">Security & Roles Active</h4>
              </div>
              <p className="text-xs text-purple-200 leading-relaxed">
                All Admin REST APIs require verification of JWT signatures and the <code className="bg-white/10 px-1 py-0.5 rounded text-white font-mono">admin</code> role payload. Public registration strictly assigns standard user permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: USER MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#e2e2e2] shadow-xs overflow-hidden">
          {/* Filter / Search header */}
          <div className="p-4 sm:p-6 border-b border-[#eeeeee] flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-[#727785]" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs font-semibold text-[#1a1c1c] focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="user">Users (Standard)</option>
                <option value="admin">Admins</option>
                <option value="creator">Creators</option>
                <option value="customer">Customers</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9f9f9] text-[#727785] uppercase tracking-wider font-semibold border-b border-[#eeeeee]">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Store / Brand</th>
                  <th className="px-6 py-3.5">Registered</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#fcfcfd] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#e2e2e2]"
                          />
                          <div>
                            <div className="font-bold text-[#1a1c1c] flex items-center gap-1.5">
                              {u.name}
                              {isCurrentAdmin && (
                                <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-normal">
                                  (You)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#727785]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-[#0058be]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-[#555f6f]">
                        {u.storeName || '—'}
                      </td>

                      <td className="px-6 py-4 text-[#727785]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === 'admin' ? (
                            <button
                              disabled={isCurrentAdmin}
                              onClick={() => handleRoleChange(u, 'user')}
                              title={isCurrentAdmin ? 'Cannot demote your own active admin account' : 'Demote to User'}
                              className="px-2 py-1 rounded border border-[#e2e2e2] hover:bg-[#eeeeee] text-[11px] font-medium text-[#555f6f] disabled:opacity-30"
                            >
                              Set as User
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(u, 'admin')}
                              className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[11px] font-semibold text-purple-700"
                            >
                              Make Admin
                            </button>
                          )}

                          <button
                            disabled={isCurrentAdmin}
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title={isCurrentAdmin ? 'Cannot delete your own account' : 'Delete user'}
                            className="p-1.5 text-[#ba1a1a] hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: PRODUCTS CATALOG ================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#e2e2e2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {adminProducts.length > 0 && (
                <button
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  id="btn-admin-delete-all-products"
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-[#ba1a1a] border border-red-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Remove all products from catalog"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All Products</span>
                </button>
              )}

              {adminProducts.length === 0 && (
                <button
                  onClick={handleLoadSampleProducts}
                  disabled={isLoadingSamples}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Load sample blanks"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSamples ? 'animate-spin' : ''}`} />
                  <span>{isLoadingSamples ? 'Loading...' : 'Load Sample Products'}</span>
                </button>
              )}

              <button
                onClick={openNewProductModal}
                id="btn-admin-add-product"
                className="px-4 py-2 bg-[#6b38d4] hover:bg-[#582db5] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Empty Catalog State */}
          {adminProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#c2c6d6] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto text-purple-600">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                  Product Catalog is Empty
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] mt-1 max-w-md mx-auto">
                  All products have been removed as requested. You can start creating your own custom products with customized print areas and colors, or restore default sample blanks at any time.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={openNewProductModal}
                  className="px-4 py-2.5 bg-[#6b38d4] hover:bg-[#582db5] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Product</span>
                </button>
                <button
                  onClick={handleLoadSampleProducts}
                  disabled={isLoadingSamples}
                  className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSamples ? 'animate-spin' : ''}`} />
                  <span>Load Sample Blanks</span>
                </button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#c2c6d6]">
              <p className="text-xs text-[#555f6f]">No products found matching "{productSearch}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl p-4 border border-[#e2e2e2] shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-20 h-24 object-cover rounded-xl bg-[#eeeeee]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[#0058be] uppercase tracking-wider">
                          {typeof prod.category === 'object' ? prod.category.name : (prod.categoryName || prod.category)}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1a1c1c] truncate mt-0.5">{prod.name}</h4>
                      <p className="text-xs font-bold text-[#1a1c1c] mt-1">${prod.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prod.stock > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-[#ba1a1a]'
                          }`}
                        >
                          {prod.stock > 0 ? `In Stock (${prod.stock})` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#eeeeee]">
                    <button
                      onClick={() => handleToggleStock(prod)}
                      className="flex-1 py-1.5 px-2 bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {prod.stock > 0 ? 'Set Out of Stock' : 'Restock'}
                    </button>
                    <button
                      onClick={() => openEditProductModal(prod)}
                      className="p-2 text-[#555f6f] hover:bg-[#eeeeee] rounded-lg transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod)}
                      className="p-2 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB: CATEGORIES MANAGEMENT ================= */}
      {activeTab === 'categories' && (
        <CategoryManagement />
      )}

      {/* ================= TAB 4: ORDERS ROUTING ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {['all', 'pending', 'processing', 'printing', 'quality_check', 'shipped', 'delivered'].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  orderStatusFilter === st
                    ? 'bg-[#6b38d4] text-white shadow-xs'
                    : 'bg-white border border-[#e2e2e2] text-[#555f6f] hover:bg-[#f9f9f9]'
                }`}
              >
                {st === 'all' ? 'All Orders' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e2e2] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f9f9f9] text-[#727785] uppercase tracking-wider font-semibold border-b border-[#eeeeee]">
                  <tr>
                    <th className="px-6 py-3.5">Order ID</th>
                    <th className="px-6 py-3.5">Customer</th>
                    <th className="px-6 py-3.5">Total</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Placed On</th>
                    <th className="px-6 py-3.5 text-right">Update Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeeeee]">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#fcfcfd]">
                      <td className="px-6 py-4 font-mono font-bold text-[#1a1c1c]">
                        #{ord.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#1a1c1c]">{ord.customerName}</div>
                        <span className="text-[11px] text-[#727785]">{ord.customerEmail}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#1a1c1c]">
                        ${ord.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#727785]">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-[#e2e2e2] bg-white text-xs font-semibold text-[#1a1c1c] focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="printing">Printing</option>
                            <option value="quality_check">QA Inspection</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 text-[#ba1a1a] hover:bg-red-50 rounded"
                            title="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: CUSTOM DESIGNS MODERATION ================= */}
      {activeTab === 'designs' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-[#eeeeee]">
              <Palette className="w-10 h-10 text-[#c2c6d6] mx-auto mb-2" />
              <p className="font-semibold text-sm text-[#1a1c1c]">No custom user designs yet</p>
            </div>
          ) : (
            designs.map((dsg) => (
              <div
                key={dsg.id}
                className="bg-white rounded-2xl p-4 border border-[#e2e2e2] shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-24 bg-[#eeeeee] rounded-xl flex items-center justify-center p-2 relative">
                    <img
                      src={dsg.productImage}
                      alt={dsg.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                    <span
                      className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ backgroundColor: dsg.selectedColorHex }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[#1a1c1c] truncate">{dsg.name}</h4>
                    <p className="text-[11px] text-[#555f6f]">{dsg.productName}</p>
                    {dsg.designText && (
                      <p className="text-[11px] font-semibold text-[#0058be] mt-1 truncate">
                        Text: "{dsg.designText}"
                      </p>
                    )}
                    <span className="text-[10px] text-[#727785] block mt-1">
                      Placement: {dsg.placement}
                    </span>
                    <span className="text-[10px] text-[#727785] block">
                      Saved: {new Date(dsg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#eeeeee] flex items-center justify-between">
                  <button
                    onClick={() => setInspectingDesign(dsg)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0058be] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Artwork</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDesign(dsg.id, dsg.name)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#ba1a1a] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove / Moderate</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= TAB 6: REAL-TIME BROADCAST ================= */}
      {activeTab === 'broadcast' && (
        <div className="bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-xs max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#eeeeee]">
            <Radio className="w-5 h-5 text-purple-600 animate-pulse" />
            <div>
              <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                Live Socket.io Broadcast Transmitter
              </h3>
              <p className="text-xs text-[#555f6f]">
                Push an instant system notification to all active browser sessions
              </p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flash Promo or Maintenance Notice"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">
                Notification Message Body
              </label>
              <textarea
                rows={3}
                required
                placeholder="Write your message to all users..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1a1c1c] block mb-1">
                Alert Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'System', val: 'system' },
                  { label: 'Promo', val: 'promo' },
                  { label: 'Production', val: 'production' },
                  { label: 'Order', val: 'order' },
                ].map((cat) => (
                  <button
                    key={cat.val}
                    type="button"
                    onClick={() => setBroadcastType(cat.val as any)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                      broadcastType === cat.val
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-[#e2e2e2] text-[#555f6f]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={broadcastSending}
              id="btn-admin-broadcast-submit"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{broadcastSending ? 'Broadcasting...' : 'Broadcast to All Users'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT PRODUCT ================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-[#e2e2e2] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-5 sm:p-6 bg-[#f9f9f9] border-b border-[#eeeeee] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-['Montserrat'] font-bold text-lg text-[#1a1c1c]">
                  {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                </h3>
                <p className="text-xs text-[#555f6f]">
                  Configure core product catalog details and generic personalization surfaces
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#eeeeee] flex items-center justify-center hover:bg-[#e2e2e2] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => handleProductCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs font-medium text-[#1a1c1c] focus:ring-2 focus:ring-purple-600 focus:outline-none"
                >
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Apparel">Apparel</option>
                      <option value="Home Decor">Home Decor</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Stationery">Stationery</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Fabric / Spec</label>
                <input
                  type="text"
                  value={productForm.spec}
                  onChange={(e) => setProductForm({ ...productForm, spec: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <CloudinaryImageUploader
                label="Product Base Image (Primary Mockup) - Product Only"
                value={productForm.image}
                publicId={productForm.imagePublicId}
                onChange={(url, publicId) =>
                  setProductForm({ ...productForm, image: url, imagePublicId: publicId || '' })
                }
                uploadEndpoint="/api/upload/product"
                helperText="Product only (no faces, people, or background). Front angle flat lay or isolated studio product."
                required
              />

              <CloudinaryImageUploader
                label="Secondary Angle Mockup Image (Optional) - Product Only"
                value={productForm.backMockupImage}
                publicId={productForm.backMockupPublicId}
                onChange={(url, publicId) =>
                  setProductForm({ ...productForm, backMockupImage: url, backMockupPublicId: publicId || '' })
                }
                uploadEndpoint="/api/upload/mockup"
                helperText="Product only. Rear or back angle blank mockup."
              />

              {/* Product Colors Management */}
              <div className="p-4 bg-white border border-[#e2e8f0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#1a1c1c] block">
                      Product Blank Colors ({productForm.colors?.length || 0})
                    </label>
                    <span className="text-[11px] text-[#555f6f]">
                      Add the color variants available for this product. Customers can preview the blank product in each selected color.
                    </span>
                  </div>
                </div>

                {/* Current color swatches list */}
                <div className="flex flex-wrap gap-2">
                  {productForm.colors?.map((col) => (
                    <div
                      key={col.hex}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-[#f8f9fa] border border-[#e2e8f0] rounded-xl text-xs font-medium text-[#1a1c1c] shadow-2xs"
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{col.hex}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProductColor(col.hex)}
                        className="text-slate-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                        title={`Remove ${col.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Add Preset Colors */}
                <div className="pt-2 border-t border-[#f0f0f0]">
                  <span className="text-[11px] font-bold text-[#555f6f] block mb-1.5">
                    ⚡ Quick Add Popular Colors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_COLOR_PRESETS.map((p) => {
                      const isAdded = productForm.colors?.some((c) => c.hex.toLowerCase() === p.hex.toLowerCase());
                      return (
                        <button
                          key={p.hex}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddProductColor(p.name, p.hex)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                            isAdded
                              ? 'opacity-40 bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-[#1a1c1c]'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: p.hex }}
                          />
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Creator */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer"
                      title="Choose color"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#ffffff"
                      className="w-20 px-2 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color Name (e.g. Sage Green, Lavender)"
                    className="flex-1 px-3 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newColorName.trim()) {
                        handleAddProductColor(newColorName.trim(), newColorHex);
                        setNewColorName('');
                      }
                    }}
                    disabled={!newColorName.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Color</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              {/* Data-Driven Personalization Config Editor */}
              <div className="pt-2">
                <CustomizationConfigEditor
                  value={productForm.customizationConfig}
                  onChange={(cfg) => setProductForm((prev) => ({ ...prev, customizationConfig: cfg }))}
                  defaultMockupUrl={productForm.image}
                  defaultBackMockupUrl={productForm.backMockupImage}
                  productCategory={productForm.category}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-[#eeeeee]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#6b38d4] hover:bg-[#582db5] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e2e2] space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                  Delete Product?
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] mt-1">
                  Are you sure you want to permanently delete <strong className="text-[#1a1c1c]">"{productToDelete.name}"</strong>? This will remove this item from your catalog and customer storefront.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#f9f9f9] rounded-xl flex items-center gap-3 border border-[#eeeeee]">
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                className="w-12 h-12 rounded-lg object-cover bg-white"
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-xs text-[#1a1c1c] truncate">{productToDelete.name}</div>
                <div className="text-[11px] text-[#727785]">
                  ${productToDelete.price.toFixed(2)} • Stock: {productToDelete.stock}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eeeeee]">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2 text-xs font-semibold text-[#555f6f] hover:bg-[#eeeeee] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete All Products Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e2e2] space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                  Delete All Products?
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] mt-1">
                  Are you sure you want to remove <strong>all {adminProducts.length} products</strong> from your catalog? This will completely clear your product list and store inventory.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200">
              ⚠️ Warning: This action cannot be undone. You can restore sample blanks or create new products afterwards.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eeeeee]">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 text-xs font-semibold text-[#555f6f] hover:bg-[#eeeeee] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllProducts}
                disabled={isDeletingAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing all...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove All Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e2e2] space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                  Delete User Account?
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] mt-1">
                  Are you sure you want to permanently delete user <strong className="text-[#1a1c1c]">"{userToDelete.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eeeeee]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 text-xs font-semibold text-[#555f6f] hover:bg-[#eeeeee] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e2e2] space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                  Delete Order Record?
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] mt-1">
                  Are you sure you want to delete order <strong className="text-[#1a1c1c]">#{orderToDelete}</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eeeeee]">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeletingOrder}
                className="px-4 py-2 text-xs font-semibold text-[#555f6f] hover:bg-[#eeeeee] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOrder}
                disabled={isDeletingOrder}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingOrder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Moderation Delete Confirmation Modal */}
      {designToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e2e2] space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                  Remove Custom Design?
                </h3>
                <p className="font-['Inter'] text-xs text-[#555f6f] mt-1">
                  Are you sure you want to remove design <strong className="text-[#1a1c1c]">"{designToDelete.name}"</strong>?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#eeeeee]">
              <button
                type="button"
                onClick={() => setDesignToDelete(null)}
                disabled={isDeletingDesign}
                className="px-4 py-2 text-xs font-semibold text-[#555f6f] hover:bg-[#eeeeee] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDesign}
                disabled={isDeletingDesign}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingDesign ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Design</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Design Pre-Flight Inspector Modal */}
      <OrderDesignViewerModal
        isOpen={!!inspectingDesign}
        onClose={() => setInspectingDesign(null)}
        design={inspectingDesign}
      />
    </div>
  );
};
