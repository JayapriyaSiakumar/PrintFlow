import { Product, Order, User, CustomDesign, LiveNotification, AuthResponse, FilterState } from '../types';

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

const fetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
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
    if (filters?.category && filters.category !== 'Apparel') params.set('category', filters.category);
    else if (filters?.category) params.set('category', filters.category);
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

  // --- Auth ---
  async register(data: { name: string; email: string; password: string; role?: string; storeName?: string }): Promise<AuthResponse> {
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

  logout() {
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
