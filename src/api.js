const BASE_URL = 'http://localhost:8080';

let token = localStorage.getItem('luz_jwt') || null;
let storedRefreshToken = localStorage.getItem('luz_refresh_token') || null;
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('luz_user')) || null;
} catch (_) {
  localStorage.removeItem('luz_user');
  localStorage.removeItem('luz_jwt');
  localStorage.removeItem('luz_refresh_token');
  token = null;
  storedRefreshToken = null;
}

async function request(path, options = {}, _isRetry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401 (once), unless this IS the refresh call
  if (res.status === 401 && !_isRetry && storedRefreshToken && path !== '/api/auth/refresh') {
    try {
      const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });
      const refreshEnv = await refreshRes.json();
      if (refreshRes.ok && refreshEnv.data?.accessToken) {
        token = refreshEnv.data.accessToken;
        localStorage.setItem('luz_jwt', token);
        if (refreshEnv.data.refreshToken) {
          storedRefreshToken = refreshEnv.data.refreshToken;
          localStorage.setItem('luz_refresh_token', storedRefreshToken);
        }
        return request(path, options, true);
      }
    } catch (_) {}
  }

  let data;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { success: res.ok, message: text };
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const ApiService = {
  getCurrentUser: () => currentUser,
  getToken: () => token,

  setSession({ token: t, refreshToken: r, user: u }) {
    token = t;
    storedRefreshToken = r;
    currentUser = u;
    if (t) localStorage.setItem('luz_jwt', t);
    if (r) localStorage.setItem('luz_refresh_token', r);
    if (u) localStorage.setItem('luz_user', JSON.stringify(u));
  },

  // 1. AUTHENTICATION
  auth: {
    async login(email, password) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      if (res.success && res.data?.token && !res.data.mfaRequired) {
        token = res.data.token;
        storedRefreshToken = res.data.refreshToken || null;
        currentUser = {
          id: res.data.id,
          email: res.data.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          roles: res.data.roles,
          type: res.data.type || 'Bearer'
        };
        localStorage.setItem('luz_jwt', token);
        if (storedRefreshToken) localStorage.setItem('luz_refresh_token', storedRefreshToken);
        localStorage.setItem('luz_user', JSON.stringify(currentUser));
      }
      return res;
    },

    async changePassword({ currentPassword, newPassword }) {
      return await request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    },
    async register(firstName, lastName, email, password) {
      return await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password })
      });
    },

    async logout() {
      if (token) {
        request('/api/auth/logout', { method: 'POST' }).catch(() => {});
      }
      token = null;
      storedRefreshToken = null;
      currentUser = null;
      localStorage.removeItem('luz_jwt');
      localStorage.removeItem('luz_refresh_token');
      localStorage.removeItem('luz_user');
      return { success: true, message: 'Logged out successfully' };
    },

    async forgotPassword(email) {
      return await request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    async resetPassword(resetToken, newPassword) {
      return await request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, newPassword })
      });
    },

    async verifyMfa(mfaToken, code) {
      const res = await request('/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ mfaToken, code })
      });
      if (res.success && res.data?.token) {
        token = res.data.token;
        storedRefreshToken = res.data.refreshToken || null;
        currentUser = {
          id: res.data.id,
          email: res.data.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          roles: res.data.roles,
          type: res.data.type || 'Bearer'
        };
        localStorage.setItem('luz_jwt', token);
        if (storedRefreshToken) localStorage.setItem('luz_refresh_token', storedRefreshToken);
        localStorage.setItem('luz_user', JSON.stringify(currentUser));
      }
      return res;
    },

    async refreshAccessToken() {
      const rt = storedRefreshToken || localStorage.getItem('luz_refresh_token');
      if (!rt) throw new Error('No refresh token available');
      const res = await request('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: rt })
      });
      if (res.success && res.data?.accessToken) {
        token = res.data.accessToken;
        localStorage.setItem('luz_jwt', token);
        if (res.data.refreshToken) {
          storedRefreshToken = res.data.refreshToken;
          localStorage.setItem('luz_refresh_token', storedRefreshToken);
        }
      }
      return res;
    }
  },

  // 2. USER PROFILE & WISHLIST
  profile: {
    async get() {
      return await request('/api/users/profile');
    },
    async update(data) {
      return await request('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async deleteAccount() {
      return await request('/api/users/account', { method: 'DELETE' });
    },
  },

  wishlist: {
    async get() {
      return await request('/api/wishlist');
    },
    async add(productId) {
      return await request(`/api/wishlist/${productId}`, { method: 'POST' });
    },
    async remove(productId) {
      return await request(`/api/wishlist/${productId}`, { method: 'DELETE' });
    },
    async check(productId) {
      return await request(`/api/wishlist/check/${productId}`);
    },
    async getRecommendations() {
      return await request('/api/wishlist/recommendations?limit=10');
    }
  },

  // 3. PRODUCT CATALOG
  products: {
    async getAll() {
      return await request('/api/products');
    },
    async getById(id) {
      return await request(`/api/products/${id}`);
    },
    async getFeatured() {
      return await request('/api/products/featured');
    },
    async search({ name, query, page = 0, size = 20, categoryId, minPrice, maxPrice, sortBy, sortDir, status } = {}) {
      const params = new URLSearchParams({ page, size });
      const q = name || query;
      if (q) params.set('name', q);
      if (categoryId) params.set('categoryId', categoryId);
      if (minPrice != null) params.set('minPrice', minPrice);
      if (maxPrice != null) params.set('maxPrice', maxPrice);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortDir) params.set('sortDir', sortDir);
      if (status) params.set('status', status);
      return await request(`/api/products/search?${params}`);
    },
    async getByCategory(categoryId, { page = 0, size = 20 } = {}) {
      return await request(`/api/products?categoryId=${categoryId}&page=${page}&size=${size}`);
    },
    async getPaginated({ page = 0, size = 20 } = {}) {
      return await request(`/api/products?page=${page}&size=${size}`);
    },
    async getCategories() {
      return await request('/api/categories');
    }
  },

  // CATEGORIES
  categories: {
    async getAll() {
      return await request('/api/categories');
    }
  },

  // BANNERS
  banners: {
    async getActive() {
      return await request('/api/banners');
    },
    async create(banner) {
      return await request('/api/banners', { method: 'POST', body: JSON.stringify(banner) });
    },
    async update(id, banner) {
      return await request(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(banner) });
    },
    async delete(id) {
      return await request(`/api/banners/${id}`, { method: 'DELETE' });
    }
  },

  // REVIEWS
  reviews: {
    async getByProduct(productId) {
      return await request(`/api/reviews/product/${productId}`);
    },
    async submit(productId, rating, comment) {
      return await request(`/api/reviews/product/${productId}`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
    }
  },

  // 4. SHOPPING CART
  cart: {
    async get() {
      const res = await request('/api/cart');
      if (res.data) {
        const items = (res.data.items || []).map(item => ({
          ...item,
          productPrice: Number(item.unitPrice) || 0,
          productImage: item.imageUrl || null,
          subtotal: Number(item.subTotal) || 0
        }));
        const totalItems = res.data.totalItems ?? items.reduce((s, i) => s + (i.quantity || 0), 0);
        res.data = { ...res.data, items, totalItems, totalAmount: Number(res.data.totalAmount) || 0 };
      }
      return res;
    },
    async addItem(productId, quantity = 1) {
      return await request('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      });
    },
    async updateQuantity(productId, quantity) {
      return await request(`/api/cart/items/${productId}?quantity=${quantity}`, { method: 'PATCH' });
    },
    async removeItem(productId) {
      return await request(`/api/cart/items/${productId}`, { method: 'DELETE' });
    },
    async clear() {
      return await request('/api/cart', { method: 'DELETE' });
    },
    async checkout(shippingAddress, billingAddress, paymentMethod, couponCode) {
      return await request('/api/cart/checkout', {
        method: 'POST',
        body: JSON.stringify({ shippingAddress, billingAddress, paymentMethod, couponCode })
      });
    }
  },

  // 5. ORDERS
  orders: {
    async getCustomerOrders() {
      return await request(`/api/orders/customer/${currentUser?.id}`);
    },
    async getDetails(id) {
      return await request(`/api/orders/${id}`);
    },
    async getTracking(id) {
      return await request(`/api/orders/${id}/tracking`);
    },
    async cancel(id) {
      return await request(`/api/orders/${id}/cancel`, { method: 'POST' });
    },
  },

  // RETURNS
  returns: {
    async create(orderId, reason) {
      return await request('/api/returns', {
        method: 'POST',
        body: JSON.stringify({ orderId, reason })
      });
    },
    async getByOrder(orderId) {
      try { return await request(`/api/returns/order/${orderId}`); } catch (e) { return { success: true, data: null }; }
    },
    async getAll(status) {
      return await request(`/api/returns${status ? '?status=' + status : ''}`);
    },
    async getById(id) {
      return await request(`/api/returns/${id}`);
    },
    async approve(id, adminNotes = '') {
      return await request(`/api/returns/${id}/approve`, { method: 'POST', body: JSON.stringify({ adminNotes }) });
    },
    async reject(id, adminNotes = '') {
      return await request(`/api/returns/${id}/reject`, { method: 'POST', body: JSON.stringify({ adminNotes }) });
    },
    async refund(id, refundedAmount, adminNotes = '') {
      return await request(`/api/returns/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ refundedAmount, adminNotes })
      });
    },
    async complete(id, { refundedAmount, refundReference, adminNotes } = {}) {
      return await request(`/api/returns/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ refundedAmount, refundReference, adminNotes })
      });
    }
  },

  // 7. SUPPORT, FAQ & LIVE CHAT
  support: {
    async getFAQs(category = 'general') {
      return await request(`/api/support/knowledge-base/faqs?category=${category}`);
    },
    async createTicket(title, description, priority) {
      return await request('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority })
      });
    },
    async getMyTickets() {
      return await request('/api/support/tickets/my');
    },
    async getTicketMessages(ticketId) {
      return await request(`/api/support/tickets/${ticketId}/messages`);
    },
    async sendTicketMessage(ticketId, message) {
      return await request(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },
    async closeTicket(ticketId) {
      return await request(`/api/support/tickets/${ticketId}/close`, { method: 'PATCH' });
    },
    async submitSurvey(ticketId, { rating, feedback = '' } = {}) {
      return await request(`/api/support/tickets/${ticketId}/survey`, {
        method: 'POST',
        body: JSON.stringify({ rating, feedback })
      });
    }
  },

  // LIVE CHAT
  chat: {
    async getMySessions() {
      return await request('/api/support/live-chat/sessions/my');
    },
    async createSession(subject, openingMessage) {
      return await request('/api/support/live-chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ subject, openingMessage })
      });
    },
    async getMessages(sessionId) {
      return await request(`/api/support/live-chat/sessions/${sessionId}/messages`);
    },
    async sendMessage(sessionId, message) {
      return await request(`/api/support/live-chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
    },
    async getSessions(status) {
      const qs = status ? `?status=${status}` : '';
      return await request(`/api/support/live-chat/sessions${qs}`);
    },
    async assignSession(sessionId, agentId) {
      return await request(`/api/support/live-chat/sessions/${sessionId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ agentId })
      });
    },
    async closeSession(sessionId) {
      return await request(`/api/support/live-chat/sessions/${sessionId}/close`, { method: 'POST' });
    }
  },

  // 8. ADMIN
  admin: {
    async getUsers() {
      return await request('/api/admin/users');
    },
    async assignRole(userId, roleName) {
      return await request(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        body: JSON.stringify({ roleName })
      });
    },
    async replaceRoles(userId, roleNames) {
      return await request(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleNames })
      });
    },
    async removeRole(userId, roleName) {
      return await request(`/api/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`, {
        method: 'DELETE'
      });
    },
    async getAuditLogsLegacy() {
      return await request('/api/admin/audit');
    },
    async getBackups() {
      return await request('/api/admin/backups');
    },
    async triggerBackup() {
      return await request('/api/admin/backup', { method: 'POST' });
    }
  },

  // 9. ANALYTICS & INVENTORY
  analytics: {
    async getKPIs({ startDate, endDate } = {}) {
      const end   = endDate   || new Date().toISOString().slice(0, 10);
      const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      return await request(`/api/analytics/dashboard/kpis?startDate=${start}&endDate=${end}`);
    },
    async getSalesSummary({ startDate, endDate } = {}) {
      const end   = endDate   || new Date().toISOString().slice(0, 10);
      const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      return await request(`/api/analytics/sales?startDate=${start}&endDate=${end}`);
    },
    async getCustomers() {
      return await request('/api/analytics/customers');
    },
    async getInventory() {
      return await request('/api/analytics/inventory');
    },
    async getSupport() {
      return await request('/api/analytics/support');
    }
  },

  inventory: {
    async getItems() {
      return await request('/api/inventory');
    },
    async getDashboard() {
      return await request('/api/inventory/dashboard');
    },
    async getLowStock() {
      return await request('/api/inventory/low-stock');
    },
    async updateThreshold(id, lowStockThreshold) {
      return await request(`/api/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ lowStockThreshold })
      });
    },
    async adjustStock(id, quantity, reason, type = 'MANUAL') {
      const params = new URLSearchParams({ quantity, reason, type });
      return await request(`/api/inventory/${id}/adjust?${params}`, { method: 'POST' });
    },
    async getMovements(page = 0, size = 50) {
      return await request(`/api/inventory/movements?page=${page}&size=${size}`);
    },
    async createItem(data) {
      return await request('/api/inventory', { method: 'POST', body: JSON.stringify(data) });
    },
    async getItem(id) {
      return await request(`/api/inventory/${id}`);
    },
  },

  suppliers: {
    async getAll(active) {
      const q = active !== undefined ? `?active=${active}` : '';
      return await request(`/api/inventory/suppliers${q}`);
    },
    async create(data) {
      return await request('/api/inventory/suppliers', { method: 'POST', body: JSON.stringify(data) });
    },
    async update(id, data) {
      return await request(`/api/inventory/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async setActive(id, active) {
      return await request(`/api/inventory/suppliers/${id}/active?active=${active}`, { method: 'PATCH' });
    },
    async getById(id) {
      return await request(`/api/inventory/suppliers/${id}`);
    },
  },

  procurement: {
    async getAll(status) {
      const q = status ? `?status=${status}` : '';
      return await request(`/api/inventory/procurements${q}`);
    },
    async create(data) {
      return await request('/api/inventory/procurements', { method: 'POST', body: JSON.stringify(data) });
    },
    async receive(id, quantityReceived) {
      return await request(`/api/inventory/procurements/${id}/receive`, {
        method: 'POST', body: JSON.stringify({ quantityReceived })
      });
    },
    async updateStatus(id, status) {
      return await request(`/api/inventory/procurements/${id}/status?status=${status}`, { method: 'PATCH' });
    },
    async cancel(id) {
      return await request(`/api/inventory/procurements/${id}/cancel`, { method: 'POST' });
    },
    async getById(id) {
      return await request(`/api/inventory/procurements/${id}`);
    },
  },

  productsAdmin: {
    async create(name, description, price, sku, status, categoryId) {
      return await request('/api/products', {
        method: 'POST',
        body: JSON.stringify({ name, description, price, sku, status, categoryId })
      });
    },
    async update(id, name, description, price, sku, status, categoryId) {
      return await request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description, price, sku, status, categoryId })
      });
    },
    async delete(id) {
      return await request(`/api/products/${id}`, { method: 'DELETE' });
    }
  },

  ordersAdmin: {
    async listAll() {
      return await request('/api/orders');
    },
    async updateStatus(id, status) {
      return await request(`/api/orders/${id}/status?status=${status}`, { method: 'PATCH' });
    }
  },

  // NOTIFICATIONS
  notifications: {
    async getAll() {
      return await request('/api/notifications');
    },
    async getUnreadCount() {
      return await request('/api/notifications/unread-count');
    },
    async markRead(id) {
      return await request(`/api/notifications/${id}/read`, { method: 'PATCH' });
    },
    async markAllRead() {
      return await request('/api/notifications/read-all', { method: 'PATCH' });
    }
  },

  // COUPONS / FINANCE
  finance: {
    async validateCoupon(code) {
      return await request(`/api/finance/coupons/validate?code=${encodeURIComponent(code)}`, { method: 'POST' });
    },
    async getAll() {
      return await request('/api/finance/coupons');
    },
    async create(coupon) {
      return await request('/api/finance/coupons', { method: 'POST', body: JSON.stringify(coupon) });
    },
    async deleteCoupon(id) {
      return await request(`/api/finance/coupons/${id}`, { method: 'DELETE' });
    }
  },

  // PAYMENTS
  payments: {
    async initiate(orderId, paymentMethod) {
      return await request(
        `/api/payments/initiate/${orderId}?paymentMethod=${encodeURIComponent(paymentMethod)}`,
        { method: 'POST' }
      );
    },
    async checkStatus(orderId) {
      return await request(`/api/payments/status/${orderId}`);
    },
  },

  // RECEIPTS
  receipts: {
    async get(orderId) {
      return await request(`/api/receipts/orders/${orderId}`);
    },
    async downloadPdf(orderId, orderNumber) {
      const t = token || localStorage.getItem('luz_jwt');
      const res = await fetch(`${BASE_URL}/api/receipts/orders/${orderId}/pdf`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) throw new Error('Failed to generate receipt PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LuzTech_Receipt_${orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },

  // legacy alias kept so existing callers don't break
  async downloadReceiptPdf(orderId) {
    return ApiService.receipts.downloadPdf(orderId, orderId);
  },

  // ── Dashboard analytics ──────────────────────────────────
  async getAdminStats() {
    const end   = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/analytics/dashboard/kpis?startDate=${start}&endDate=${end}`);
  },
  async getTopProducts({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/analytics/top-products?startDate=${start}&endDate=${end}`);
  },
  async getRevenueByMonth({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/analytics/revenue/monthly?startDate=${start}&endDate=${end}`);
  },
  async getOrdersByStatus({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/analytics/orders/by-status?startDate=${start}&endDate=${end}`);
  },
  async getFinanceStats({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/finance/summary?startDate=${start}&endDate=${end}`);
  },
  async getInventory({ page = 0, size = 30 } = {}) {
    return await request(`/api/inventory?page=${page}&size=${size}`);
  },
  async adjustInventory(id, { adjustmentType = 'MANUAL', quantity, reason } = {}) {
    const params = new URLSearchParams({ quantity, reason, type: adjustmentType });
    return await request(`/api/inventory/${id}/adjust?${params}`, { method: 'POST' });
  },
  async getProducts({ page = 0, size = 20, status } = {}) {
    const params = new URLSearchParams({ page, size });
    if (status) params.set('status', status);
    return await request(`/api/products?${params}`);
  },
  isOnline() {
    return navigator.onLine !== false;
  },

  // ── Returns (admin flat methods) ────────────────────────
  async getReturns({ page = 0, size = 20, status = '' } = {}) {
    return await request(`/api/returns?page=${page}&size=${size}${status ? '&status=' + status : ''}`);
  },
  async approveReturn(id, adminNotes = '') {
    return await request(`/api/returns/${id}/approve`, { method: 'POST', body: JSON.stringify({ adminNotes }) });
  },
  async rejectReturn(id, adminNotes = '') {
    return await request(`/api/returns/${id}/reject`, { method: 'POST', body: JSON.stringify({ adminNotes }) });
  },
  async syncRefundStatus(id) {
    return await request(`/api/returns/${id}/refund/status`, { method: 'POST' });
  },

  // ── Shipments ───────────────────────────────────────────
  async getShipments({ page = 0, size = 20, status = '' } = {}) {
    return await request(`/api/shipments?page=${page}&size=${size}${status ? '&status=' + status : ''}`);
  },
  async getShipment(id) {
    return await request(`/api/shipments/${id}`);
  },
  async getShipmentByOrder(orderId) {
    return await request(`/api/shipments/order/${orderId}`);
  },
  async createShipment(data) {
    return await request('/api/shipments', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateShipmentStatus(id, data) {
    return await request(`/api/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async cancelShipment(id) {
    return await request(`/api/shipments/${id}/cancel`, { method: 'POST' });
  },
  async trackShipment(trackingNumber) {
    return await request(`/api/shipments/track/${encodeURIComponent(trackingNumber)}`);
  },

  // ── Fulfillment ─────────────────────────────────────────
  async getFulfillment(orderId) {
    return await request(`/api/fulfillment/orders/${orderId}`);
  },
  async pickOrder(orderId) {
    return await request(`/api/fulfillment/orders/${orderId}/pick`, { method: 'POST' });
  },
  async packOrder(orderId) {
    return await request(`/api/fulfillment/orders/${orderId}/pack`, { method: 'POST' });
  },
  async dispatchOrder(orderId, data) {
    return await request(`/api/fulfillment/orders/${orderId}/dispatch`, { method: 'POST', body: JSON.stringify(data) });
  },
  async completeOrder(orderId) {
    return await request(`/api/fulfillment/orders/${orderId}/complete`, { method: 'POST' });
  },

  // ── Payment Reconciliation ───────────────────────────────
  async getReconciliationSummary() {
    return await request('/api/payments/reconciliation/summary');
  },
  async getReconciliationTransactions(orderId) {
    const q = orderId ? `?orderId=${orderId}` : '';
    return await request(`/api/payments/reconciliation/transactions${q}`);
  },
  async reconcileTransaction(id) {
    return await request(`/api/payments/reconciliation/transactions/${id}`, { method: 'PATCH' });
  },
  async reconcileAll() {
    return await request('/api/payments/reconciliation/run', { method: 'PATCH' });
  },

  // ── POS ─────────────────────────────────────────────────
  async posCheckout(data) {
    return await request('/api/pos/checkout', { method: 'POST', body: JSON.stringify(data) });
  },
  async getPOSReceipt(orderId) {
    return await request(`/api/pos/receipts/${orderId}`);
  },
  async getPOSHistory({ page = 0, size = 20 } = {}) {
    return await request(`/api/pos/history?page=${page}&size=${size}`);
  },
  async getPOSSummary({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/pos/summary?startDate=${start}&endDate=${end}`);
  },

  // ── Security Settings ────────────────────────────────────
  async getSecuritySettings() {
    return await request('/api/admin/security-settings');
  },
  async saveSecuritySettings(data) {
    return await request('/api/admin/security-settings', { method: 'PUT', body: JSON.stringify(data) });
  },
  async unlockUser(userId) {
    return await request(`/api/admin/security-settings/users/${userId}/unlock`, { method: 'POST' });
  },

  // ── System Configurations ────────────────────────────────
  async getSystemConfigurations() {
    return await request('/api/admin/configurations');
  },
  async getSystemConfiguration(key) {
    return await request(`/api/admin/configurations/${key}`);
  },
  async saveSystemConfiguration(key, data) {
    return await request(`/api/admin/configurations/${key}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteSystemConfiguration(key) {
    return await request(`/api/admin/configurations/${key}`, { method: 'DELETE' });
  },
  async triggerBackup() {
    return await request('/api/admin/backup', { method: 'POST' });
  },
  async getBackups() {
    return await request('/api/admin/backups');
  },
  async getBackup(id) {
    return await request(`/api/admin/backups/${id}`);
  },
  async restoreBackup(id) {
    return await request(`/api/admin/backups/${id}/restore`, { method: 'POST' });
  },

  // ── MTN Sandbox Tests ────────────────────────────────────
  async runMtnSandboxTests({ collectionKey, disbursementKey } = {}) {
    const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') };
    if (collectionKey)   headers['X-Collection-Subscription-Key']   = collectionKey;
    if (disbursementKey) headers['X-Disbursement-Subscription-Key'] = disbursementKey;
    const res = await fetch('http://localhost:8080/api/payments/mtn/run-tests', { method: 'POST', headers });
    if (!res.ok) throw new Error(`MTN test runner returned ${res.status}`);
    return await res.json();
  },

  // ── Product test ping ─────────────────────────────────────
  async pingProductApi() {
    return await request('/api/products/_test');
  },

  // ── Coupons (admin flat methods) ─────────────────────────
  async getCoupons({ page = 0, size = 20 } = {}) {
    return await request(`/api/finance/coupons?page=${page}&size=${size}`);
  },
  async getCoupon(id) {
    return await request(`/api/finance/coupons/${id}`);
  },
  async createCoupon(data) {
    return await request('/api/finance/coupons', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateCoupon(id, data) {
    return await request(`/api/finance/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteCoupon(id) {
    return await request(`/api/finance/coupons/${id}`, { method: 'DELETE' });
  },

  // ── Banners (admin flat methods) ─────────────────────────
  async getBanners() {
    return await request('/api/banners/all');
  },
  async getBanner(id) {
    return await request(`/api/banners/${id}`);
  },
  async createBanner(data) {
    return await request('/api/banners', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateBanner(id, data) {
    return await request(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async toggleBanner(id) {
    return await request(`/api/banners/${id}/toggle`, { method: 'PATCH' });
  },
  async deleteBanner(id) {
    return await request(`/api/banners/${id}`, { method: 'DELETE' });
  },

  // ── Customers (via CRM) ──────────────────────────────────
  async getCustomers({ page = 0, size = 20 } = {}) {
    return await request(`/api/crm/customers?page=${page}&size=${size}`);
  },
  async getCustomer(id) {
    return await request(`/api/crm/customers/${id}/summary`);
  },
  async getCrmAnalytics() {
    return await request('/api/crm/analytics');
  },
  async getCustomerAnalytics(id) {
    return await request(`/api/crm/customers/${id}/analytics`);
  },
  async getCommunicationLogs(customerId) {
    return await request(`/api/crm/customers/${customerId}/communications`);
  },
  async createCommunicationLog(data) {
    return await request('/api/crm/communications', { method: 'POST', body: JSON.stringify(data) });
  },

  // ── Support Tickets (admin) ──────────────────────────────
  async getSupportTickets({ page = 0, size = 30, status = '' } = {}) {
    return await request(`/api/support/tickets?page=${page}&size=${size}${status ? '&status=' + status : ''}`);
  },
  async getSupportTicket(id) {
    return await request(`/api/support/tickets/${id}`);
  },
  async replyToTicket(id, { message } = {}) {
    return await request(`/api/support/tickets/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
  },
  async resolveTicket(id) {
    return await request(`/api/support/tickets/${id}/close`, { method: 'PATCH' });
  },
  async getAssignedTickets() {
    return await request('/api/support/tickets/assigned');
  },
  async searchAuditLogs({ q = '', page = 0, size = 50 } = {}) {
    return await request(`/api/admin/audit/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`);
  },
  async assignTicket(id, agentId) {
    return await request(`/api/support/tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ agentId }) });
  },

  // ── FAQ Admin ────────────────────────────────────────────
  async getAllFaqs() {
    return await request('/api/support/knowledge-base/faqs/admin');
  },
  async getFaq(id) {
    return await request(`/api/support/knowledge-base/faqs/${id}`);
  },
  async createFaq(data) {
    return await request('/api/support/knowledge-base/faqs', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateFaq(id, data) {
    return await request(`/api/support/knowledge-base/faqs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteFaq(id) {
    return await request(`/api/support/knowledge-base/faqs/${id}`, { method: 'DELETE' });
  },

  // ── Users (admin) ────────────────────────────────────────
  async getUsers({ page = 0, size = 20 } = {}) {
    return await request(`/api/admin/users?page=${page}&size=${size}`);
  },
  async getUser(id) {
    return await request(`/api/admin/users/${id}`);
  },
  async createUser(data) {
    return await request('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateUser(id, data) {
    return await request(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async blockUser(id) {
    return await request(`/api/admin/users/${id}/block`, { method: 'POST' });
  },
  async unblockUser(id) {
    return await request(`/api/admin/users/${id}/unblock`, { method: 'POST' });
  },
  async getRoles() {
    return await request('/api/admin/roles');
  },
  async assignRole(userId, roleName) {
    return await request(`/api/admin/users/${userId}/roles`, { method: 'POST', body: JSON.stringify({ roleName }) });
  },
  async replaceRoles(userId, roleNames) {
    return await request(`/api/admin/users/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roleNames }) });
  },
  async removeRole(userId, roleName) {
    return await request(`/api/admin/users/${userId}/roles/${encodeURIComponent(roleName)}`, { method: 'DELETE' });
  },

  // ── Analytics extras ─────────────────────────────────────
  async getTotalRevenue({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/analytics/revenue?startDate=${start}&endDate=${end}`);
  },
  async getFullDashboard() {
    return await request('/api/analytics/dashboard');
  },

  // ── Audit Logs ───────────────────────────────────────────
  async getAuditLogs({ page = 0, size = 30 } = {}) {
    return await request(`/api/admin/audit?page=${page}&size=${size}`);
  },

  // ── Products (admin flat methods) ────────────────────────
  async getProduct(id) {
    return await request(`/api/products/${id}`);
  },
  async createProduct(data) {
    return await request('/api/products', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateProduct(id, data) {
    return await request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteProduct(id) {
    return await request(`/api/products/${id}`, { method: 'DELETE' });
  },
  async setProductFeatured(id, featured) {
    return await request(`/api/products/${id}/featured?featured=${featured}`, { method: 'PATCH' });
  },
  async updateProductStatus(id, status) {
    return await request(`/api/products/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
  },
  async assignProductCategory(id, categoryId) {
    return await request(`/api/products/${id}/category/${categoryId}`, { method: 'PATCH' });
  },
  async applyProductDiscount(id, discountId) {
    return await request(`/api/products/${id}/discount/${discountId}`, { method: 'PATCH' });
  },
  async removeProductDiscount(id) {
    return await request(`/api/products/${id}/discount`, { method: 'DELETE' });
  },
  async uploadProductImage(productId, file, altText = '', isPrimary = false) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('altText', altText);
    fd.append('isPrimary', String(isPrimary));
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/api/products/${productId}/images`, { method: 'POST', headers, body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Image upload failed');
    return data;
  },
  async removeProductImage(productId, imageId) {
    return await request(`/api/products/${productId}/remove-image/${imageId}`, { method: 'PATCH' });
  },

  // ── Discounts ─────────────────────────────────────────────
  async getDiscounts() {
    return await request('/api/products/discounts');
  },
  async createDiscount(data) {
    return await request('/api/products/discounts', { method: 'POST', body: JSON.stringify(data) });
  },
  async toggleDiscount(id) {
    return await request(`/api/products/discounts/${id}/toggle`, { method: 'PATCH' });
  },
  async deleteDiscount(id) {
    return await request(`/api/products/discounts/${id}`, { method: 'DELETE' });
  },

  // ── Bulk product import / export ──────────────────────────
  async exportProductsBulk() {
    return await this._downloadBlob('/api/products/bulk/export', 'products.xlsx');
  },
  async importProductsBulk(file) {
    const fd = new FormData();
    fd.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/api/products/bulk/import`, { method: 'POST', headers, body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Import failed');
    return data;
  },

  // ── Orders (admin flat methods) ──────────────────────────
  async getOrder(id) {
    return await request(`/api/orders/${id}`);
  },
  async updateOrderStatus(id, { status } = {}) {
    return await request(`/api/orders/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
  },
  async getOrders({ page = 0, size = 20, status = '' } = {}) {
    return await request(`/api/orders?page=${page}&size=${size}${status ? '&status=' + status : ''}`);
  },

  // ── Categories (flat) ────────────────────────────────────
  async getCategories() {
    return await request('/api/categories');
  },
  async createCategory(name, description = '') {
    return await request('/api/categories', { method: 'POST', body: JSON.stringify({ name, description }) });
  },
  async deleteCategory(id) {
    return await request(`/api/categories/${id}`, { method: 'DELETE' });
  },

  // ── File download helper ─────────────────────────────────
  async _downloadBlob(path, filename) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // ── Expenses ─────────────────────────────────────────────
  async getExpenses({ startDate, endDate, status } = {}) {
    const p = new URLSearchParams();
    if (startDate) p.set('startDate', startDate);
    if (endDate)   p.set('endDate', endDate);
    if (status)    p.set('status', status);
    return await request(`/api/finance/expenses?${p}`);
  },
  async getExpense(id) {
    return await request(`/api/finance/expenses/${id}`);
  },
  async createExpense(data) {
    return await request('/api/finance/expenses', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateExpense(id, data) {
    return await request(`/api/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async updateExpenseStatus(id, status) {
    return await request(`/api/finance/expenses/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' });
  },
  async deleteExpense(id) {
    return await request(`/api/finance/expenses/${id}`, { method: 'DELETE' });
  },

  // ── Tax records ──────────────────────────────────────────
  async getTaxRecords({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/finance/taxes?startDate=${start}&endDate=${end}`);
  },
  async getTaxSummary({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/finance/taxes/summary?startDate=${start}&endDate=${end}`);
  },
  async exportTaxRecords({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await this._downloadBlob(`/api/finance/taxes/export?startDate=${start}&endDate=${end}`, `tax-records-${start}-${end}.csv`);
  },
  async recordOrderTax(orderId) {
    return await request(`/api/finance/taxes/orders/${orderId}/record`, { method: 'POST' });
  },

  // ── Finance reports ──────────────────────────────────────
  async getProfitLoss({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/finance/profit-loss?startDate=${start}&endDate=${end}`);
  },
  async getFinancialManagement({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await request(`/api/finance/management?startDate=${start}&endDate=${end}`);
  },
  async exportFinancialManagement({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await this._downloadBlob(`/api/finance/management/export?startDate=${start}&endDate=${end}`, `financial-management-${start}-${end}.csv`);
  },

  // ── Report downloads ─────────────────────────────────────
  async downloadSalesReport({ startDate, endDate } = {}) {
    const end   = endDate   || new Date().toISOString().slice(0, 10);
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return await this._downloadBlob(`/api/reports/sales?startDate=${start}&endDate=${end}`, `sales-report-${start}-${end}.xlsx`);
  },
  async downloadInvoice(orderId) {
    return await this._downloadBlob(`/api/reports/invoices/${orderId}`, `invoice-${orderId}.pdf`);
  },
};
