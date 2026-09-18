import {
  Product,
  Order,
  User,
  CustomDesign,
  LiveNotification,
  AuthResponse,
  FilterState,
  AdminDashboardStats,
  CategoryItem,
} from '../types';

const TOKEN_KEY = 'printflow_jwt_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage issues
  }
};

// Configurable API base URL using environment variables without hardcoded localhost
const API_BASE_URL = (((import.meta as any).env?.VITE_API_URL as string) || '').replace(/\/$/, '');

const fetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Prepend API_BASE_URL if configured, otherwise use relative path
  const targetUrl = API_BASE_URL ? `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}` : url;

  const response = await fetch(targetUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
};

export const api = {
  // --- Health ---
  async health(): Promise<{ status: string }> {
    return fetchJson<{ status: string }>('/api/health');
  },

  // --- Products ---
  async getProducts(filters?: Partial<FilterState>): Promise<{ products: Product[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters?.sizes && filters.sizes.length > 0) params.set('sizes', filters.sizes.join(','));
    if (filters?.colors && filters.colors.length > 0) params.set('colors', filters.colors.join(','));
    if (filters?.minPrice) params.set('minPrice', filters.minPrice);
    if (filters?.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters?.sortBy) params.set('sort', filters.sortBy);
    if (filters?.searchQuery) params.set('search', filters.searchQuery);

    const query = params.toString();
    return fetchJson<{ products: Product[]; total: number }>(`/api/products${query ? `?${query}` : ''}`);
  },

  async getProductById(id: string): Promise<Product> {
    return fetchJson<Product>(`/api/products/${id}`);
  },

  // --- Categories ---
  async getCategories(params?: { status?: boolean | string; search?: string }): Promise<{ categories: CategoryItem[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status !== undefined && params.status !== '') searchParams.set('status', String(params.status));
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchJson<{ categories: CategoryItem[]; total: number }>(`/api/categories${query ? `?${query}` : ''}`);
  },

  async getCategoryById(id: string): Promise<CategoryItem> {
    return fetchJson<CategoryItem>(`/api/categories/${id}`);
  },

  async createCategory(data: Partial<CategoryItem>): Promise<{ success: boolean; category: CategoryItem; message: string }> {
    return fetchJson<{ success: boolean; category: CategoryItem; message: string }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(id: string, data: Partial<CategoryItem>): Promise<{ success: boolean; category: CategoryItem; message: string }> {
    return fetchJson<{ success: boolean; category: CategoryItem; message: string }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleCategoryStatus(id: string): Promise<{ success: boolean; category: CategoryItem; message: string }> {
    return fetchJson<{ success: boolean; category: CategoryItem; message: string }>(`/api/categories/${id}/toggle-status`, {
      method: 'PATCH',
    });
  },

  // --- Auth & Profile ---
  async register(data: { name: string; email: string; password: string; storeName?: string }): Promise<AuthResponse> {
    const res = await fetchJson<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetchJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setStoredToken(res.token);
    return res;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
    return fetchJson<{ success: boolean; message: string; resetToken?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return fetchJson<{ user: User }>('/api/auth/me');
  },

  async updateProfile(data: { name?: string; storeName?: string; avatar?: string }): Promise<{ token: string; user: User }> {
    const res = await fetchJson<{ token: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.token) setStoredToken(res.token);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } catch {
      // Best-effort server notification
    }
    setStoredToken(null);
  },

  // --- Orders ---
  async getOrders(): Promise<{ orders: Order[] }> {
    return fetchJson<{ orders: Order[] }>('/api/orders');
  },

  async getOrderById(id: string): Promise<Order> {
    return fetchJson<Order>(`/api/orders/${id}`);
  },

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return fetchJson<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async updateOrderStatus(id: string, status: string, note?: string): Promise<Order> {
    return fetchJson<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
  },

  // --- Custom Designs ---
  async getDesigns(): Promise<{ designs: CustomDesign[] }> {
    return fetchJson<{ designs: CustomDesign[] }>('/api/designs');
  },

  async getDesignById(id: string): Promise<{ design: CustomDesign }> {
    return fetchJson<{ design: CustomDesign }>(`/api/designs/${id}`);
  },

  async saveDesign(designData: Partial<CustomDesign>): Promise<CustomDesign> {
    return fetchJson<CustomDesign>('/api/designs', {
      method: 'POST',
      body: JSON.stringify(designData),
    });
  },

  async deleteDesign(id: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>(`/api/designs/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: LiveNotification[] }> {
    return fetchJson<{ notifications: LiveNotification[] }>('/api/notifications');
  },

  async markNotificationRead(id?: string): Promise<{ success: boolean }> {
    return fetchJson<{ success: boolean }>('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  // --- Admin APIS ---
  async getAdminDashboard(): Promise<AdminDashboardStats> {
    return fetchJson<AdminDashboardStats>('/api/admin/dashboard');
  },

  async getAdminUsers(params?: { q?: string; role?: string }): Promise<{ users: User[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.role) query.set('role', params.role);
    const qs = query.toString();
    return fetchJson<{ users: User[]; total: number }>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  async updateAdminUser(id: string, data: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    return fetchJson<{ success: boolean; user: User; message: string }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminUser(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async createAdminProduct(productData: Partial<Product>): Promise<{ success: boolean; product: Product; message: string }> {
    return fetchJson<{ success: boolean; product: Product; message: string }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async updateAdminProduct(id: string, productData: Partial<Product>): Promise<{ success: boolean; product: Product; message: string }> {
    return fetchJson<{ success: boolean; product: Product; message: string }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async deleteAdminProduct(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAllAdminProducts(): Promise<{ success: boolean; deletedCount?: number; message: string }> {
    return fetchJson<{ success: boolean; deletedCount?: number; message: string }>('/api/admin/products/all', {
      method: 'DELETE',
    });
  },

  async loadSampleAdminProducts(): Promise<{ success: boolean; products: Product[]; message: string }> {
    return fetchJson<{ success: boolean; products: Product[]; message: string }>('/api/admin/products/load-samples', {
      method: 'POST',
    });
  },

  async toggleAdminProductStock(id: string): Promise<{ success: boolean; product: Product; inStock: boolean }> {
    return fetchJson<{ success: boolean; product: Product; inStock: boolean }>(`/api/admin/products/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  async getAdminOrders(): Promise<{ orders: Order[]; total: number }> {
    return fetchJson<{ orders: Order[]; total: number }>('/api/admin/orders');
  },

  async updateAdminOrder(id: string, data: Partial<Order>): Promise<{ success: boolean; order: Order; message: string }> {
    return fetchJson<{ success: boolean; order: Order; message: string }>(`/api/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminOrder(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminDesigns(): Promise<{ designs: CustomDesign[]; total: number }> {
    return fetchJson<{ designs: CustomDesign[]; total: number }>('/api/admin/designs');
  },

  async deleteAdminDesign(id: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>(`/api/admin/designs/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Admin Broadcast ---
  async sendAdminBroadcast(data: { title: string; message: string; type?: string; orderId?: string }): Promise<{ success: boolean; notification: LiveNotification }> {
    return fetchJson<{ success: boolean; notification: LiveNotification }>('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Newsletter ---
  async subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
    return fetchJson<{ success: boolean; message: string }>('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // --- Platform Stats ---
  async getStats(): Promise<any> {
    return fetchJson<any>('/api/stats');
  },
};
