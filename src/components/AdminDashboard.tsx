import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { User, Product, Order, CustomDesign, AdminDashboardStats, Category } from '../types';
import { CategoryManagement } from './admin/CategoryManagement';
import { SubcategoryManagement } from './admin/SubcategoryManagement';
import { OrderDesignViewerModal } from './admin/OrderDesignViewerModal';
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
  FolderTree
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    user,
    isAdmin,
    openAuthModal,
    setActiveView,
    categories,
    subcategories,
    refreshCategories,
    refreshSubcategories,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'products' | 'categories' | 'subcategories' | 'orders' | 'designs' | 'broadcast'
  >('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Subcategory filter deep-link from Category tab
  const [subcategoryFilterCategory, setSubcategoryFilterCategory] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Products State
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Apparel',
    subcategory: '',
    price: 29.99,
    stock: 50,
    spec: 'Standard Fit',
    description: '',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  });

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

      await Promise.allSettled([refreshCategories(), refreshSubcategories()]);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, refreshCategories, refreshSubcategories]);

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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
    try {
      await api.deleteAdminUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showFeedback('success', `User ${userName} deleted`);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete user');
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

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      await api.deleteAdminProduct(product.id);
      setAdminProducts((prev) => prev.filter((p) => p.id !== product.id));
      showFeedback('success', `Product "${product.name}" deleted`);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete product');
    }
  };

  // Available subcategories for current product category selection in modal
  const modalAvailableSubcategories = useMemo(() => {
    const selectedCat = categories.find(
      (c) => c.name === productForm.category || (c.id || c._id) === productForm.category
    );
    if (!selectedCat) return [];
    const catId = selectedCat.id || selectedCat._id;
    return subcategories.filter((s) => {
      const parentId = typeof s.category === 'object' ? s.category.id || s.category._id : s.category;
      return parentId === catId || parentId === selectedCat.name;
    });
  }, [categories, subcategories, productForm.category]);

  const handleProductCategoryChange = (newCatName: string) => {
    const selectedCat = categories.find(
      (c) => c.name === newCatName || (c.id || c._id) === newCatName
    );
    let subToSelect = '';
    if (selectedCat) {
      const catId = selectedCat.id || selectedCat._id;
      const available = subcategories.filter((s) => {
        const parentId = typeof s.category === 'object' ? s.category.id || s.category._id : s.category;
        return parentId === catId || parentId === selectedCat.name;
      });
      if (available.length > 0) {
        subToSelect = available[0].name;
      }
    }
    setProductForm((prev) => ({
      ...prev,
      category: newCatName,
      subcategory: subToSelect,
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.updateAdminProduct(editingProduct.id, productForm);
        setAdminProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.product : p)));
        showFeedback('success', `Product "${res.product.name}" updated`);
      } else {
        const res = await api.createAdminProduct(productForm);
        setAdminProducts((prev) => [res.product, ...prev]);
        showFeedback('success', `Product "${res.product.name}" created`);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAllData();
      await refreshCategories();
      await refreshSubcategories();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save product');
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    const defaultCat = categories.length > 0 ? categories[0].name : 'Apparel';
    const selectedCat = categories.find(
      (c) => c.name === defaultCat || (c.id || c._id) === defaultCat
    );
    let defaultSub = '';
    if (selectedCat) {
      const catId = selectedCat.id || selectedCat._id;
      const available = subcategories.filter((s) => {
        const parentId = typeof s.category === 'object' ? s.category.id || s.category._id : s.category;
        return parentId === catId || parentId === selectedCat.name;
      });
      if (available.length > 0) {
        defaultSub = available[0].name;
      }
    }

    setProductForm({
      name: '',
      category: defaultCat,
      subcategory: defaultSub,
      price: 29.99,
      stock: 50,
      spec: 'Premium Ring-Spun Cotton',
      description: 'High-grade customizable apparel crafted for durability and vibrant prints.',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    const catVal =
      typeof product.category === 'object'
        ? product.category.name
        : product.categoryName || product.category;
    const subVal =
      typeof product.subcategory === 'object'
        ? product.subcategory.name
        : product.subcategoryName || (product.subcategory as string) || '';

    setProductForm({
      name: product.name,
      category: catVal,
      subcategory: subVal,
      price: product.price,
      stock: product.stock,
      spec: product.spec,
      description: product.description,
      image: product.image,
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

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm(`Permanently delete order #${orderId}?`)) return;
    try {
      await api.deleteAdminOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      showFeedback('success', `Order #${orderId} deleted`);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete order');
    }
  };

  // --- Handlers: Designs ---
  const handleDeleteDesign = async (designId: string, designName: string) => {
    if (!window.confirm(`Moderate and delete custom design "${designName}"?`)) return;
    try {
      await api.deleteAdminDesign(designId);
      setDesigns((prev) => prev.filter((d) => d.id !== designId));
      showFeedback('success', `Custom design "${designName}" removed`);
      loadAllData();
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to remove design');
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
    const subName = typeof p.subcategory === 'object' ? p.subcategory.name : (p.subcategoryName || (p.subcategory as string) || '');
    return (
      p.name.toLowerCase().includes(term) ||
      catName.toLowerCase().includes(term) ||
      subName.toLowerCase().includes(term)
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

        <div className="bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-xs">
          <div className="flex items-center justify-between text-[#727785] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Subcategories</span>
            <FolderTree className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-['Montserrat'] text-[#1a1c1c]">
            {subcategories.length}
          </div>
          <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
            {subcategories.filter((s) => s.status !== false).length} Active
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
          onClick={() => {
            setSubcategoryFilterCategory('all');
            setActiveTab('subcategories');
          }}
          id="tab-admin-subcategories"
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'subcategories'
              ? 'bg-[#6b38d4] text-white shadow-xs'
              : 'text-[#555f6f] hover:bg-[#f3f3f4] hover:text-[#1a1c1c]'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Subcategories ({subcategories.length})</span>
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
                  onClick={() => {
                    setSubcategoryFilterCategory('all');
                    setActiveTab('subcategories');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4" /> Manage Subcategories ({subcategories.length})
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
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
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

            <button
              onClick={openNewProductModal}
              id="btn-admin-add-product"
              className="w-full sm:w-auto px-4 py-2 bg-[#6b38d4] hover:bg-[#582db5] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

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
                      {(prod.subcategory || prod.subcategoryName) && (
                        <>
                          <span className="text-[10px] text-[#727785]">•</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                            {typeof prod.subcategory === 'object' ? prod.subcategory.name : (prod.subcategoryName || prod.subcategory)}
                          </span>
                        </>
                      )}
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
                    className="flex-1 py-1.5 px-2 bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] rounded-lg text-xs font-semibold transition-colors"
                  >
                    {prod.stock > 0 ? 'Set Out of Stock' : 'Restock'}
                  </button>
                  <button
                    onClick={() => openEditProductModal(prod)}
                    className="p-2 text-[#555f6f] hover:bg-[#eeeeee] rounded-lg transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod)}
                    className="p-2 text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB: CATEGORIES MANAGEMENT ================= */}
      {activeTab === 'categories' && (
        <CategoryManagement
          onNavigateSubcategories={(catId) => {
            setSubcategoryFilterCategory(catId);
            setActiveTab('subcategories');
          }}
        />
      )}

      {/* ================= TAB: SUBCATEGORIES MANAGEMENT ================= */}
      {activeTab === 'subcategories' && (
        <SubcategoryManagement
          initialCategoryFilter={subcategoryFilterCategory || 'all'}
        />
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
            className="bg-white rounded-2xl shadow-2xl border border-[#e2e2e2] w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 bg-[#f9f9f9] border-b border-[#eeeeee] flex items-center justify-between">
              <h3 className="font-['Montserrat'] font-bold text-lg text-[#1a1c1c]">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#eeeeee] flex items-center justify-center hover:bg-[#e2e2e2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => handleProductCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs font-medium text-[#1a1c1c]"
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
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Subcategory</label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs font-medium text-[#1a1c1c]"
                  >
                    <option value="">None / General</option>
                    {modalAvailableSubcategories.map((sub) => (
                      <option key={sub.id || sub._id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Fabric / Spec</label>
                <input
                  type="text"
                  value={productForm.spec}
                  onChange={(e) => setProductForm({ ...productForm, spec: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-[#eeeeee]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#6b38d4] hover:bg-[#582db5] text-white text-xs font-semibold"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
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
