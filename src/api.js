const BASE_URL = 'http://localhost:8080';

// Check if we can reach the backend. If not, use localStorage mock.
let isBackendOnline = false;
let token = localStorage.getItem('luz_jwt') || null;
let storedRefreshToken = localStorage.getItem('luz_refresh_token') || null;
let currentUser = JSON.parse(localStorage.getItem('luz_user')) || null;

async function checkBackendStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/products`, { method: 'GET', signal: AbortSignal.timeout(1000) });
    isBackendOnline = res.ok;
  } catch (err) {
    isBackendOnline = false;
  }
  console.log(`[Luz System] API Mode: ${isBackendOnline ? 'LIVE BACKEND' : 'LOCAL FALLBACK MOCK'}`);
  return isBackendOnline;
}

// Perform initial check
checkBackendStatus();

// Helper to make backend requests
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
    // Refresh failed — clear session
    token = null; storedRefreshToken = null; currentUser = null;
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_refresh_token');
    localStorage.removeItem('luz_user');
    throw new Error('Session expired. Please sign in again.');
  }

  let envelope;
  try {
    envelope = await res.json();
  } catch (_) {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return { success: true };
  }

  if (!res.ok) {
    throw new Error(envelope.message || 'Request failed');
  }
  return envelope;
}

// -------------------------------------------------------------
// LOCAL MOCK DATABASE (INITIAL STATE)
// -------------------------------------------------------------
const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "ASUS ExpertBook B5 (B5405)",
    description: "ASUS ExpertBook B5 is a lightweight, AI-enhanced marvel that combines the latest Intel Core Ultra processor with Intel vPro. Designed for business professionals on the move.",
    price: 454.99,
    sku: "CP-345-TYL",
    status: "ACTIVE",
    category: "Laptop & Computer",
    categoryId: "cat-2",
    rating: 4.8,
    reviewsCount: 24,
    badge: "Popular",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80"
  },
  {
    id: "prod-2",
    name: "HP Spectre x360",
    description: "A gorgeous 2-in-1 convertible laptop featuring an OLED display, exceptional battery life, and high performance powered by Intel Core i7.",
    price: 1299.99,
    sku: "CP-123-ABC",
    status: "ACTIVE",
    category: "Laptop & Computer",
    categoryId: "cat-2",
    rating: 4.9,
    reviewsCount: 42,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&q=80"
  },
  {
    id: "prod-3",
    name: "Dell XPS 13",
    description: "Ultra-portable performance laptop with a stunning InfinityEdge display and premium aluminum chassis.",
    price: 999.00,
    sku: "CP-678-XYZ",
    status: "ACTIVE",
    category: "Laptop & Computer",
    categoryId: "cat-2",
    rating: 4.7,
    reviewsCount: 19,
    badge: "Co-pilot integrated",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80"
  },
  {
    id: "prod-4",
    name: "Lenovo ThinkPad X1 Carbon",
    description: "The ultimate business laptop with military-grade durability, legendary keyboard, and feather-light weight.",
    price: 1199.00,
    sku: "CP-456-DEF",
    status: "ACTIVE",
    category: "Laptop & Computer",
    categoryId: "cat-2",
    rating: 4.6,
    reviewsCount: 31,
    badge: "Enterprise Standard",
    image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80"
  },
  {
    id: "prod-5",
    name: "8-Port Gigabit Desktop Switch",
    description: "Expand your wired network with high-speed Gigabit ports. Plug and play, energy efficient design.",
    price: 34.99,
    sku: "HW-SW-8G",
    status: "ACTIVE",
    category: "Computer Hardware",
    categoryId: "cat-1",
    rating: 4.5,
    reviewsCount: 88,
    badge: "Stock Clearout",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80"
  },
  {
    id: "prod-6",
    name: "SanDisk Extreme 128GB MicroSD",
    description: "High-speed storage card perfect for cameras, smartphones, and Raspberry Pi maker setups.",
    price: 19.99,
    sku: "ST-SD-128",
    status: "ACTIVE",
    category: "Storage Devices",
    categoryId: "cat-3",
    rating: 4.9,
    reviewsCount: 154,
    badge: "Top Rated",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80"
  }
];

const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Computer Hardware" },
  { id: "cat-2", name: "Laptop & Computer" },
  { id: "cat-3", name: "Storage Devices" },
  { id: "cat-4", name: "Cooling Systems" },
  { id: "cat-5", name: "DIY & Maker Kits" },
  { id: "cat-6", name: "Software & Licenses" }
];

const INITIAL_FAQS = [
  { id: "faq-1", category: "general", question: "What is your shipping policy?", answer: "We ship orders within 24 hours. Standard delivery takes 2-3 business days in Kigali, and 5-7 days for other regions." },
  { id: "faq-2", category: "general", question: "Do you offer warranty?", answer: "Yes, all laptops and computers come with a 1-year local manufacturer warranty unless stated otherwise." },
  { id: "faq-3", category: "payments", question: "What payment options are supported?", answer: "We accept MTN Mobile Money, Airtel Money, PayPal, and BK Cards." }
];

// Initialize localStorage databases if they don't exist
function initMockDb() {
  if (!localStorage.getItem('mock_products')) localStorage.setItem('mock_products', JSON.stringify(INITIAL_PRODUCTS));
  if (!localStorage.getItem('mock_categories')) localStorage.setItem('mock_categories', JSON.stringify(INITIAL_CATEGORIES));
  if (!localStorage.getItem('mock_faqs')) localStorage.setItem('mock_faqs', JSON.stringify(INITIAL_FAQS));
  if (!localStorage.getItem('mock_users')) {
    localStorage.setItem('mock_users', JSON.stringify([
      {
        id: "usr-1",
        email: "customer@luztechnology.com",
        password: "SecurePassword123!",
        firstName: "John",
        lastName: "Doe",
        roles: ["ROLE_CUSTOMER"],
        phoneNumber: "+250788000000",
        address: "Kigali, Rwanda",
        mfaEnabled: false
      },
      {
        id: "usr-2",
        email: "admin@luztechnology.com",
        password: "AdminPassword123!",
        firstName: "Luz",
        lastName: "Administrator",
        roles: ["ROLE_ADMIN", "ROLE_EMPLOYEE"],
        phoneNumber: "+250788111222",
        address: "HQ, Kigali",
        mfaEnabled: false
      }
    ]));
  }
  if (!localStorage.getItem('mock_wishlists')) localStorage.setItem('mock_wishlists', JSON.stringify({}));
  if (!localStorage.getItem('mock_carts')) localStorage.setItem('mock_carts', JSON.stringify({}));
  if (!localStorage.getItem('mock_orders')) localStorage.setItem('mock_orders', JSON.stringify([]));
  if (!localStorage.getItem('mock_reviews')) localStorage.setItem('mock_reviews', JSON.stringify({}));
  if (!localStorage.getItem('mock_tickets')) localStorage.setItem('mock_tickets', JSON.stringify([]));
  if (!localStorage.getItem('mock_chats')) localStorage.setItem('mock_chats', JSON.stringify([]));
  if (!localStorage.getItem('mock_inventory')) {
    const inv = INITIAL_PRODUCTS.map(p => ({
      id: "inv-" + p.id,
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      quantity: Math.floor(Math.random() * 50) + 5,
      supplier: "Alpha Technology Ltd",
      status: "IN_STOCK"
    }));
    localStorage.setItem('mock_inventory', JSON.stringify(inv));
  }
  if (!localStorage.getItem('mock_audits')) {
    localStorage.setItem('mock_audits', JSON.stringify([
      { timestamp: new Date().toISOString(), user: "System", action: "Database Initialized", ip: "127.0.0.1" }
    ]));
  }
  if (!localStorage.getItem('mock_notifications')) {
    localStorage.setItem('mock_notifications', JSON.stringify([
      { id: "notif-1", title: "Welcome to Luz Technology!", message: "Thanks for joining. Explore our latest products and hot deals.", type: "SYSTEM", read: false, createdAt: new Date().toISOString() },
      { id: "notif-2", title: "Summer Sale is Live 🔥", message: "Use code LUZ24 at checkout to get 10% off your order.", type: "PROMO", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "notif-3", title: "Order Shipped", message: "Your order has been dispatched and is on its way.", type: "ORDER", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() }
    ]));
  }
  if (!localStorage.getItem('mock_returns_list')) {
    localStorage.setItem('mock_returns_list', JSON.stringify([]));
  }
  if (!localStorage.getItem('mock_banners')) {
    localStorage.setItem('mock_banners', JSON.stringify([
      {
        id: "banner-1",
        title: "ASUS ExpertBook B5 (B5405)",
        subtitle: "ASUS ExpertBook B5 is a lightweight, AI-enhanced marvel that combines the latest Intel Core Ultra processor with Intel vPro. Designed for business professionals on the move.",
        imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80",
        tagLabel: "CO-PILOT INTEGRATED",
        buttonText: "Add to Cart",
        linkUrl: null,
        productId: "prod-1",
        displayOrder: 0,
        active: true
      },
      {
        id: "banner-2",
        title: "HP Spectre x360 14",
        subtitle: "A gorgeous 2-in-1 convertible laptop featuring an OLED display, exceptional battery life, and high performance powered by Intel Core i7.",
        imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80",
        tagLabel: "BEST SELLER",
        buttonText: "Shop Now",
        linkUrl: null,
        productId: "prod-2",
        displayOrder: 1,
        active: true
      },
      {
        id: "banner-3",
        title: "Dell XPS 13 — InfinityEdge",
        subtitle: "Ultra-portable performance laptop with a stunning InfinityEdge display and premium aluminum chassis.",
        imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80",
        tagLabel: "NEW ARRIVAL",
        buttonText: "View Details",
        linkUrl: null,
        productId: "prod-3",
        displayOrder: 2,
        active: true
      }
    ]));
  }
}

initMockDb();

// Getter and Setter helpers for mock data
const db = {
  get: (key) => JSON.parse(localStorage.getItem(key)),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

// -------------------------------------------------------------
// HYBRID API SERVICE IMPLEMENTATION
// -------------------------------------------------------------
export const ApiService = {
  checkStatus: checkBackendStatus,
  isOnline: () => isBackendOnline,
  getCurrentUser: () => currentUser,
  getToken: () => token,

  // Used by OAuth2 callback to store session after redirect
  setSession({ token: t, refreshToken: r, user: u }) {
    token = t;
    storedRefreshToken = r;
    currentUser = u;
    if (t) localStorage.setItem('luz_jwt', t);
    if (r) localStorage.setItem('luz_refresh_token', r);
    if (u) localStorage.setItem('luz_user', JSON.stringify(u));
  },

  // 1. AUTHENTICATION CONTEXT
  auth: {
    async login(email, password) {
      if (isBackendOnline) {
        const res = await request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        // mfaRequired response has no token — only persist session after full auth
        if (res.success && res.data?.token && !res.data.mfaRequired) {
          token = res.data.token;
          storedRefreshToken = res.data.refreshToken || null;
          currentUser = {
            id: res.data.id,
            email: res.data.email,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            roles: res.data.roles,        // ["ROLE_CUSTOMER"] | ["ROLE_ADMIN", ...]
            type: res.data.type || 'Bearer'
          };
          localStorage.setItem('luz_jwt', token);
          if (storedRefreshToken) localStorage.setItem('luz_refresh_token', storedRefreshToken);
          localStorage.setItem('luz_user', JSON.stringify(currentUser));
        }
        return res;
      } else {
        // Mock Login
        const users = db.get('mock_users');
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error("Invalid email or password");
        
        token = "mock_jwt_token_for_" + user.id;
        currentUser = {
          token,
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          type: "Bearer",
          mfaRequired: false
        };
        localStorage.setItem('luz_jwt', token);
        localStorage.setItem('luz_user', JSON.stringify(currentUser));
        
        // Add audit log
        const audits = db.get('mock_audits');
        audits.unshift({ timestamp: new Date().toISOString(), user: email, action: "User Logged In", ip: "192.168.1.100" });
        db.set('mock_audits', audits);

        return { success: true, message: "User logged in successfully", data: currentUser };
      }
    },

    async register(firstName, lastName, email, password) {
      if (isBackendOnline) {
        return await request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ firstName, lastName, email, password })
        });
      } else {
        const users = db.get('mock_users');
        if (users.find(u => u.email === email)) throw new Error("Email already registered");
        
        users.push({
          id: "usr-" + Math.random().toString(36).substr(2, 9),
          firstName,
          lastName,
          email,
          password,
          roles: ["ROLE_CUSTOMER"],
          phoneNumber: "",
          address: ""
        });
        db.set('mock_users', users);
        return { success: true, message: "User registered successfully", data: "ROLE_CUSTOMER" };
      }
    },

    logout() {
      if (isBackendOnline && token) {
        // Best-effort server-side refresh token revocation
        request('/api/auth/logout', { method: 'POST' }).catch(() => {});
      }
      token = null;
      storedRefreshToken = null;
      currentUser = null;
      localStorage.removeItem('luz_jwt');
      localStorage.removeItem('luz_refresh_token');
      localStorage.removeItem('luz_user');
      return { success: true, message: "Logged out successfully" };
    },

    async forgotPassword(email) {
      if (isBackendOnline) {
        return await request('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
      }
      return { success: true, message: "If an account exists, a reset link has been sent." };
    },

    async resetPassword(resetToken, newPassword) {
      if (isBackendOnline) {
        return await request('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token: resetToken, newPassword })
        });
      }
      return { success: true, message: "Password reset successfully" };
    },

    async verifyMfa(mfaToken, code) {
      if (isBackendOnline) {
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
      }
      throw new Error("MFA not supported in offline mode");
    },

    async refreshAccessToken() {
      const rt = storedRefreshToken || localStorage.getItem('luz_refresh_token');
      if (!rt) throw new Error("No refresh token available");
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
      if (isBackendOnline) {
        return await request('/api/users/profile');
      } else {
        if (!currentUser) throw new Error("Unauthorized");
        const users = db.get('mock_users');
        const user = users.find(u => u.id === currentUser.id);
        return { success: true, message: "Profile retrieved", data: user };
      }
    },

    async update(firstName, lastName, phoneNumber, address) {
      if (isBackendOnline) {
        return await request('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ firstName, lastName, phoneNumber, address })
        });
      } else {
        if (!currentUser) throw new Error("Unauthorized");
        const users = db.get('mock_users');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) throw new Error("User not found");
        
        users[userIndex] = { ...users[userIndex], firstName, lastName, phoneNumber, address };
        db.set('mock_users', users);
        
        currentUser.firstName = firstName;
        currentUser.lastName = lastName;
        localStorage.setItem('luz_user', JSON.stringify(currentUser));
        
        return { success: true, message: "Profile updated successfully", data: users[userIndex] };
      }
    }
  },

  wishlist: {
    async get() {
      if (isBackendOnline) return await request('/api/wishlist');
      if (!currentUser) return { data: [] };
      const lists = db.get('mock_wishlists');
      const list = lists[currentUser.id] || [];
      const prods = db.get('mock_products');
      const items = prods.filter(p => list.includes(p.id));
      return { success: true, data: items };
    },

    async add(productId) {
      if (isBackendOnline) {
        return await request(`/api/wishlist/${productId}`, { method: 'POST' });
      }
      if (!currentUser) throw new Error("Unauthorized");
      const lists = db.get('mock_wishlists');
      if (!lists[currentUser.id]) lists[currentUser.id] = [];
      if (!lists[currentUser.id].includes(productId)) {
        lists[currentUser.id].push(productId);
      }
      db.set('mock_wishlists', lists);
      return { success: true, message: "Added to wishlist" };
    },

    async remove(productId) {
      if (isBackendOnline) {
        return await request(`/api/wishlist/${productId}`, { method: 'DELETE' });
      }
      if (!currentUser) throw new Error("Unauthorized");
      const lists = db.get('mock_wishlists');
      if (lists[currentUser.id]) {
        lists[currentUser.id] = lists[currentUser.id].filter(id => id !== productId);
      }
      db.set('mock_wishlists', lists);
      return { success: true, message: "Removed from wishlist" };
    },

    async check(productId) {
      if (isBackendOnline) return await request(`/api/wishlist/check/${productId}`);
      if (!currentUser) return { data: false };
      const lists = db.get('mock_wishlists');
      const list = lists[currentUser.id] || [];
      return { success: true, data: list.includes(productId) };
    },

    async getRecommendations() {
      if (isBackendOnline) return await request('/api/wishlist/recommendations?limit=10');
      // Mock recommendations (returns top rated products)
      const prods = db.get('mock_products');
      const recs = prods.slice(0, 3);
      return { success: true, data: recs };
    }
  },

  // 3. PRODUCT CATALOG
  products: {
    async getAll() {
      if (isBackendOnline) return await request('/api/products');
      return { success: true, data: db.get('mock_products') };
    },

    async getCategories() {
      if (isBackendOnline) return await request('/api/products/categories');
      return { success: true, data: db.get('mock_categories') };
    },

    async getById(id) {
      if (isBackendOnline) return await request(`/api/products/${id}`);
      const prods = db.get('mock_products');
      const prod = prods.find(p => p.id === id);
      if (!prod) throw new Error("Product not found");
      return { success: true, data: prod };
    },

    async getFeatured() {
      if (isBackendOnline) return await request('/api/products/featured');
      const prods = db.get('mock_products');
      return { success: true, data: prods.filter(p => p.featured) };
    },

    // Paginated search — returns { content, totalElements, totalPages, number, size }
    async search(params = {}) {
      if (isBackendOnline) {
        const { page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc', ...filters } = params;
        const query = new URLSearchParams({ ...filters, page, size, sortBy, sortDir }).toString();
        const res = await request(`/api/products/search?${query}`);
        // Normalise: backend returns Page<ProductResponse> inside data
        if (res.data && res.data.content) {
          return { ...res, data: res.data.content, pagination: {
            totalElements: res.data.totalElements,
            totalPages: res.data.totalPages,
            page: res.data.number,
            size: res.data.size
          }};
        }
        return res;
      }
      let prods = db.get('mock_products');
      if (params.name) {
        const n = params.name.toLowerCase();
        prods = prods.filter(p => p.name.toLowerCase().includes(n) || p.description.toLowerCase().includes(n));
      }
      if (params.categoryId) {
        prods = prods.filter(p => p.categoryId === params.categoryId);
      }
      if (params.minPrice) prods = prods.filter(p => p.price >= parseFloat(params.minPrice));
      if (params.maxPrice) prods = prods.filter(p => p.price <= parseFloat(params.maxPrice));
      // Mock pagination
      const page = params.page || 0;
      const size = params.size || 20;
      const start = page * size;
      return {
        success: true,
        data: prods.slice(start, start + size),
        pagination: { totalElements: prods.length, totalPages: Math.ceil(prods.length / size), page, size }
      };
    }
  },

  // BANNERS
  banners: {
    async getActive() {
      if (isBackendOnline) return await request('/api/banners');
      return { success: true, data: db.get('mock_banners') || [] };
    },

    async create(banner) {
      if (isBackendOnline) return await request('/api/banners', { method: 'POST', body: JSON.stringify(banner) });
      const banners = db.get('mock_banners') || [];
      const newBanner = { ...banner, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      db.set('mock_banners', [...banners, newBanner]);
      return { success: true, data: newBanner };
    },

    async update(id, banner) {
      if (isBackendOnline) return await request(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(banner) });
      const banners = db.get('mock_banners') || [];
      const updated = banners.map(b => b.id === id ? { ...b, ...banner } : b);
      db.set('mock_banners', updated);
      return { success: true, data: updated.find(b => b.id === id) };
    },

    async toggle(id) {
      if (isBackendOnline) return await request(`/api/banners/${id}/toggle`, { method: 'PATCH' });
      const banners = db.get('mock_banners') || [];
      const updated = banners.map(b => b.id === id ? { ...b, active: !b.active } : b);
      db.set('mock_banners', updated);
      return { success: true, data: updated.find(b => b.id === id) };
    },

    async delete(id) {
      if (isBackendOnline) return await request(`/api/banners/${id}`, { method: 'DELETE' });
      const banners = db.get('mock_banners') || [];
      db.set('mock_banners', banners.filter(b => b.id !== id));
      return { success: true };
    }
  },

  // REVIEWS
  reviews: {
    async getByProduct(productId) {
      if (isBackendOnline) return await request(`/api/reviews/product/${productId}`);
      const reviews = db.get('mock_reviews');
      return { success: true, data: reviews[productId] || [] };
    },

    async submit(productId, rating, comment) {
      if (isBackendOnline) {
        return await request(`/api/reviews/product/${productId}`, {
          method: 'POST',
          body: JSON.stringify({ rating, comment })
        });
      }
      if (!currentUser) throw new Error("Unauthorized");
      const reviews = db.get('mock_reviews');
      if (!reviews[productId]) reviews[productId] = [];
      
      reviews[productId].push({
        id: "rev-" + Math.random().toString(36).substr(2, 9),
        author: currentUser.firstName + " " + currentUser.lastName,
        rating,
        comment,
        date: new Date().toLocaleDateString()
      });
      db.set('mock_reviews', reviews);
      return { success: true, message: "Review submitted successfully" };
    }
  },

  // 4. SHOPPING CART
  cart: {
    async get() {
      if (isBackendOnline) {
        const res = await request('/api/cart');
        if (res.data) {
          // Normalize backend CartResponse fields to match frontend expectations
          const items = (res.data.items || []).map(item => ({
            ...item,
            productPrice: Number(item.unitPrice) || 0,   // views use productPrice
            productImage: item.imageUrl || null,           // views use productImage
            subtotal: Number(item.subTotal) || 0           // views use subtotal
          }));
          const totalItems = res.data.totalItems ?? items.reduce((s, i) => s + (i.quantity || 0), 0);
          res.data = { ...res.data, items, totalItems, totalPrice: Number(res.data.totalAmount) || 0 };
        }
        return res;
      }
      if (!currentUser) return { data: { items: [], totalPrice: 0, totalItems: 0 } };
      
      const carts = db.get('mock_carts');
      const userCart = carts[currentUser.id] || [];
      const prods = db.get('mock_products');
      
      const items = userCart.map(item => {
        const p = prods.find(pr => pr.id === item.productId);
        const subtotal = p ? (p.price * item.quantity) : 0;
        return {
          productId: item.productId,
          productName: p ? p.name : 'Unknown Product',
          productPrice: p ? p.price : 0,
          productImage: p ? p.image : '',
          quantity: item.quantity,
          subtotal
        };
      }).filter(item => item.productPrice > 0);

      const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
      const totalPrice = items.reduce((sum, i) => sum + i.subtotal, 0);

      return {
        success: true,
        data: {
          items,
          totalItems,
          totalPrice
        }
      };
    },

    async addItem(productId, quantity = 1) {
      if (isBackendOnline) {
        return await request('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity })
        });
      }
      if (!currentUser) throw new Error("Authentication required");
      const carts = db.get('mock_carts');
      if (!carts[currentUser.id]) carts[currentUser.id] = [];
      
      const existing = carts[currentUser.id].find(i => i.productId === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        carts[currentUser.id].push({ productId, quantity });
      }
      db.set('mock_carts', carts);
      return { success: true, message: "Added to cart" };
    },

    async updateQuantity(productId, quantity) {
      if (isBackendOnline) {
        return await request(`/api/cart/items/${productId}?quantity=${quantity}`, { method: 'PATCH' });
      }
      if (!currentUser) throw new Error("Unauthorized");
      const carts = db.get('mock_carts');
      const userCart = carts[currentUser.id] || [];
      const item = userCart.find(i => i.productId === productId);
      if (item) {
        item.quantity = parseInt(quantity);
      }
      db.set('mock_carts', carts);
      return { success: true, message: "Cart updated" };
    },

    async removeItem(productId) {
      if (isBackendOnline) {
        return await request(`/api/cart/items/${productId}`, { method: 'DELETE' });
      }
      if (!currentUser) throw new Error("Unauthorized");
      const carts = db.get('mock_carts');
      if (carts[currentUser.id]) {
        carts[currentUser.id] = carts[currentUser.id].filter(i => i.productId !== productId);
      }
      db.set('mock_carts', carts);
      return { success: true, message: "Item removed from cart" };
    },

    async clear() {
      if (isBackendOnline) return await request('/api/cart', { method: 'DELETE' });
      if (!currentUser) throw new Error("Unauthorized");
      const carts = db.get('mock_carts');
      carts[currentUser.id] = [];
      db.set('mock_carts', carts);
      return { success: true, message: "Cart cleared" };
    },

    async checkout(shippingAddress, billingAddress, paymentMethod, couponCode) {
      if (isBackendOnline) {
        return await request('/api/cart/checkout', {
          method: 'POST',
          body: JSON.stringify({ shippingAddress, billingAddress, paymentMethod, couponCode })
        });
      }
      
      // Perform Mock Checkout
      const cartRes = await this.get();
      const cartData = cartRes.data;
      if (cartData.items.length === 0) throw new Error("Cart is empty");
      
      const orders = db.get('mock_orders');
      const newOrder = {
        id: "ord-" + Math.random().toString(36).substr(2, 9),
        customerId: currentUser.id,
        customerName: currentUser.firstName + " " + currentUser.lastName,
        items: cartData.items,
        shippingAddress,
        billingAddress,
        totalAmount: cartData.totalPrice,
        paymentMethod,
        status: "CREATED",
        timestamp: new Date().toISOString()
      };
      
      orders.unshift(newOrder);
      db.set('mock_orders', orders);
      
      // Reduce inventory quantity
      const inv = db.get('mock_inventory');
      newOrder.items.forEach(item => {
        const itemInv = inv.find(i => i.productId === item.productId);
        if (itemInv) {
          itemInv.quantity = Math.max(0, itemInv.quantity - item.quantity);
        }
      });
      db.set('mock_inventory', inv);

      // Clear Cart
      await this.clear();

      return { success: true, message: "Checkout completed successfully", data: newOrder };
    }
  },

  // 5. ORDERS, SHIPMENTS & RETURNS
  orders: {
    async getCustomerOrders() {
      if (isBackendOnline) return await request(`/api/orders/customer/${currentUser.id}`);
      if (!currentUser) return { data: [] };
      const orders = db.get('mock_orders');
      const userOrders = orders.filter(o => o.customerId === currentUser.id);
      return { success: true, data: userOrders };
    },

    async getDetails(id) {
      if (isBackendOnline) return await request(`/api/orders/${id}`);
      const orders = db.get('mock_orders');
      const order = orders.find(o => o.id === id);
      if (!order) throw new Error("Order not found");
      return { success: true, data: order };
    },

    async cancel(id) {
      if (isBackendOnline) return await request(`/api/orders/${id}/cancel`, { method: 'POST' });
      const orders = db.get('mock_orders');
      const order = orders.find(o => o.id === id);
      if (order) {
        order.status = "CANCELLED";
      }
      db.set('mock_orders', orders);
      return { success: true, message: "Order cancelled successfully" };
    }
  },

  returns: {
    async create(orderId, reason) {
      if (isBackendOnline) {
        return await request('/api/returns', {
          method: 'POST',
          body: JSON.stringify({ orderId, reason })
        });
      }
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      const newReturn = {
        id: "ret-" + Math.random().toString(36).substr(2, 9),
        orderId,
        reason,
        status: "PENDING",
        requestedAmount: null,
        refundedAmount: null,
        adminNotes: null,
        createdAt: new Date().toISOString()
      };
      returns.push(newReturn);
      localStorage.setItem('mock_returns_list', JSON.stringify(returns));
      return { success: true, message: "Return requested successfully", data: newReturn };
    },

    async getByOrder(orderId) {
      if (isBackendOnline) {
        try { return await request(`/api/returns/order/${orderId}`); } catch(e) { return { success: true, data: null }; }
      }
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      return { success: true, data: returns.find(r => r.orderId === orderId) || null };
    },

    async getAll(status) {
      if (isBackendOnline) return await request(`/api/returns${status ? '?status=' + status : ''}`);
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      return { success: true, data: status ? returns.filter(r => r.status === status) : returns };
    },

    async approve(id, adminNotes) {
      if (isBackendOnline) return await request(`/api/returns/${id}/approve`, { method: 'POST', body: JSON.stringify({ adminNotes }) });
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      const r = returns.find(x => x.id === id);
      if (r) { r.status = 'APPROVED'; r.adminNotes = adminNotes; }
      localStorage.setItem('mock_returns_list', JSON.stringify(returns));
      return { success: true, message: "Return approved", data: r };
    },

    async reject(id, adminNotes) {
      if (isBackendOnline) return await request(`/api/returns/${id}/reject`, { method: 'POST', body: JSON.stringify({ adminNotes }) });
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      const r = returns.find(x => x.id === id);
      if (r) { r.status = 'REJECTED'; r.adminNotes = adminNotes; }
      localStorage.setItem('mock_returns_list', JSON.stringify(returns));
      return { success: true, message: "Return rejected", data: r };
    },

    async refund(id, refundedAmount, adminNotes) {
      if (isBackendOnline) return await request(`/api/returns/${id}/refund`, { method: 'POST', body: JSON.stringify({ refundedAmount, adminNotes }) });
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      const r = returns.find(x => x.id === id);
      if (r) { r.status = 'APPROVED'; r.refundedAmount = refundedAmount; r.refundStatus = 'PENDING'; }
      localStorage.setItem('mock_returns_list', JSON.stringify(returns));
      return { success: true, message: "Refund submitted", data: r };
    },

    async complete(id, data) {
      if (isBackendOnline) return await request(`/api/returns/${id}/complete`, { method: 'POST', body: JSON.stringify(data) });
      const returns = JSON.parse(localStorage.getItem('mock_returns_list')) || [];
      const r = returns.find(x => x.id === id);
      if (r) { r.status = 'COMPLETED'; Object.assign(r, data); }
      localStorage.setItem('mock_returns_list', JSON.stringify(returns));
      return { success: true, message: "Return completed", data: r };
    }
  },

  shipments: {
    async track(trackingNumber) {
      if (isBackendOnline) return await request(`/api/shipments/track/${trackingNumber}`);
      return {
        success: true,
        data: {
          trackingNumber,
          carrier: "Luz Logistics",
          status: "IN_TRANSIT",
          estimatedDelivery: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
          checkpoints: [
            { time: new Date().toLocaleString(), location: "Kigali Sort Facility", detail: "Package sorted" },
            { time: new Date(Date.now() - 3600000 * 2).toLocaleString(), location: "Dispatch Center", detail: "Package dispatched" }
          ]
        }
      };
    }
  },

  // 6. PAYMENTS CONTEXT
  payments: {
    async initiate(orderId) {
      if (isBackendOnline) return await request(`/api/payments/initiate/${orderId}`, { method: 'POST' });
      
      const orders = db.get('mock_orders');
      const order = orders.find(o => o.id === orderId);
      if (order) {
        order.status = "PAID";
        db.set('mock_orders', orders);
      }
      
      return {
        success: true,
        message: "Payment initiated",
        data: {
          paymentReference: "PAY-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          gatewayUrl: "#payment-gateway-emulation"
        }
      };
    }
  },

  // 7. SUPPORT, FAQ & LIVE CHAT
  support: {
    async getFAQs(category = 'general') {
      if (isBackendOnline) return await request(`/api/support/knowledge-base/faqs?category=${category}`);
      const faqs = db.get('mock_faqs');
      return { success: true, data: faqs.filter(f => f.category === category) };
    },

    async createTicket(title, description, priority) {
      if (isBackendOnline) {
        return await request('/api/support/tickets', {
          method: 'POST',
          body: JSON.stringify({ title, description, priority })
        });
      }
      const tickets = db.get('mock_tickets');
      const newTicket = {
        id: "tkt-" + Math.random().toString(36).substr(2, 9),
        title,
        description,
        priority,
        status: "OPEN",
        customerId: currentUser.id,
        date: new Date().toLocaleDateString(),
        messages: [
          { senderId: currentUser.id, senderName: currentUser.firstName, message: description, timestamp: new Date().toLocaleString() }
        ]
      };
      tickets.unshift(newTicket);
      db.set('mock_tickets', tickets);
      return { success: true, message: "Support ticket created successfully", data: newTicket };
    },

    async getMyTickets() {
      if (isBackendOnline) return await request('/api/support/tickets/my');
      if (!currentUser) return { data: [] };
      const tickets = db.get('mock_tickets');
      return { success: true, data: tickets.filter(t => t.customerId === currentUser.id) };
    },

    async getTicketMessages(ticketId) {
      if (isBackendOnline) return await request(`/api/support/tickets/${ticketId}/messages`);
      const tickets = db.get('mock_tickets');
      const ticket = tickets.find(t => t.id === ticketId);
      return { success: true, data: ticket ? ticket.messages : [] };
    },

    async sendTicketMessage(ticketId, message) {
      if (isBackendOnline) {
        return await request(`/api/support/tickets/${ticketId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message })
        });
      }
      const tickets = db.get('mock_tickets');
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        const msg = {
          senderId: currentUser.id,
          senderName: currentUser.firstName,
          message,
          timestamp: new Date().toLocaleString()
        };
        ticket.messages.push(msg);
        db.set('mock_tickets', tickets);
        
        // Mock Support Agent Response
        setTimeout(() => {
          const updatedTickets = db.get('mock_tickets');
          const t = updatedTickets.find(x => x.id === ticketId);
          if (t) {
            t.messages.push({
              senderId: "agent-1",
              senderName: "Luz Support Team",
              message: "Thank you for contacting us. We have received your query and we are working on it.",
              timestamp: new Date().toLocaleString()
            });
            db.set('mock_tickets', updatedTickets);
            // Trigger UI update through event if needed
            window.dispatchEvent(new CustomEvent('ticket-updated', { detail: ticketId }));
          }
        }, 1500);
      }
      return { success: true, message: "Message sent" };
    },

    async closeTicket(ticketId) {
      if (isBackendOnline) return await request(`/api/support/tickets/${ticketId}/close`, { method: 'PATCH' });
      const tickets = db.get('mock_tickets');
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) ticket.status = "CLOSED";
      db.set('mock_tickets', tickets);
      return { success: true, message: "Ticket closed" };
    }
  },

  // LIVE CHAT
  chat: {
    async getMySessions() {
      if (isBackendOnline) return await request('/api/support/live-chat/sessions/my');
      const chats = db.get('mock_chats');
      return { success: true, data: chats };
    },

    async createSession(subject, openingMessage) {
      if (isBackendOnline) {
        return await request('/api/support/live-chat/sessions', {
          method: 'POST',
          body: JSON.stringify({ subject, openingMessage })
        });
      }
      const chats = db.get('mock_chats');
      const newSession = {
        sessionId: "chat-" + Math.random().toString(36).substr(2, 9),
        subject,
        status: "ACTIVE",
        messages: [
          { senderId: currentUser ? currentUser.id : "guest", message: openingMessage, timestamp: new Date().toISOString() }
        ]
      };
      chats.push(newSession);
      db.set('mock_chats', chats);

      // Automated Mock Bot Response
      setTimeout(() => {
        const updated = db.get('mock_chats');
        const sess = updated.find(s => s.sessionId === newSession.sessionId);
        if (sess) {
          sess.messages.push({
            senderId: "support-bot",
            message: "Hello! Thank you for starting a chat. A support agent will be with you shortly. How can I help you regarding: " + subject + "?",
            timestamp: new Date().toISOString()
          });
          db.set('mock_chats', updated);
          window.dispatchEvent(new CustomEvent('chat-updated', { detail: newSession.sessionId }));
        }
      }, 1000);

      return { success: true, data: newSession };
    },

    async getMessages(sessionId) {
      if (isBackendOnline) return await request(`/api/support/live-chat/sessions/${sessionId}/messages`);
      const chats = db.get('mock_chats');
      const session = chats.find(c => c.sessionId === sessionId);
      return { success: true, data: session ? session.messages : [] };
    },

    async sendMessage(sessionId, message) {
      if (isBackendOnline) {
        return await request(`/api/support/live-chat/sessions/${sessionId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message })
        });
      }
      const chats = db.get('mock_chats');
      const session = chats.find(c => c.sessionId === sessionId);
      if (session) {
        session.messages.push({
          senderId: currentUser ? currentUser.id : "guest",
          message,
          timestamp: new Date().toISOString()
        });
        db.set('mock_chats', chats);

        // Echo response from mock bot after delay
        setTimeout(() => {
          const updated = db.get('mock_chats');
          const sess = updated.find(s => s.sessionId === sessionId);
          if (sess) {
            sess.messages.push({
              senderId: "support-bot",
              message: "I am routing your question to our technician team. Please remain connected.",
              timestamp: new Date().toISOString()
            });
            db.set('mock_chats', updated);
            window.dispatchEvent(new CustomEvent('chat-updated', { detail: sessionId }));
          }
        }, 2000);
      }
      return { success: true, message: "Message sent" };
    }
  },

  // 8. STAFF & ADMINISTRATION OPERATIONS (ADMIN ONLY)
  admin: {
    async getUsers() {
      if (isBackendOnline) return await request('/api/admin/users');
      return { success: true, data: db.get('mock_users') };
    },
    async assignRole(userId, roleName) {
      if (isBackendOnline) {
        return await request(`/api/admin/users/${userId}/roles`, {
          method: 'POST',
          body: JSON.stringify(roleName)
        });
      }
      const users = db.get('mock_users');
      const user = users.find(u => u.id === userId);
      if (user && !user.roles.includes(roleName)) {
        user.roles.push(roleName);
      }
      db.set('mock_users', users);
      return { success: true, message: "Role assigned successfully" };
    },
    async getAuditLogs() {
      if (isBackendOnline) return await request('/api/admin/audit');
      return { success: true, data: db.get('mock_audits') };
    },
    async getBackups() {
      if (isBackendOnline) return await request('/api/admin/backups');
      return {
        success: true,
        data: [
          { id: "backup-1", filename: "luz_db_backup_2026-06-18.sql", size: "45.2 MB", createdBy: "Admin" }
        ]
      };
    },
    async triggerBackup() {
      if (isBackendOnline) return await request('/api/admin/backup', { method: 'POST' });
      
      const audits = db.get('mock_audits');
      audits.unshift({ timestamp: new Date().toISOString(), user: "admin@luztechnology.com", action: "System Backup Created", ip: "127.0.0.1" });
      db.set('mock_audits', audits);

      return { success: true, message: "System backup triggered successfully!" };
    }
  },

  // 9. ANALYTICS & INVENTORY
  analytics: {
    async getKPIs() {
      if (isBackendOnline) return await request('/api/analytics/dashboard/kpis');
      const orders = db.get('mock_orders');
      const totalSales = orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.totalAmount, 0);
      const lowStockCount = db.get('mock_inventory').filter(i => i.quantity <= 10).length;
      const openTicketsCount = db.get('mock_tickets').filter(t => t.status === 'OPEN').length;
      return {
        success: true,
        data: {
          totalSales: totalSales.toFixed(2),
          ordersCount: orders.length,
          lowStockAlerts: lowStockCount,
          openTickets: openTicketsCount
        }
      };
    },

    async getSalesSummary() {
      if (isBackendOnline) return await request('/api/analytics/sales');
      return {
        success: true,
        data: [
          { month: "Jan", sales: 12000 },
          { month: "Feb", sales: 15000 },
          { month: "Mar", sales: 18000 },
          { month: "Apr", sales: 14000 },
          { month: "May", sales: 22000 },
          { month: "Jun", sales: 29000 }
        ]
      };
    }
  },

  inventory: {
    async getItems() {
      if (isBackendOnline) return await request('/api/inventory');
      return { success: true, data: db.get('mock_inventory') };
    },

    async adjustStock(id, quantity, reason) {
      if (isBackendOnline) {
        return await request(`/api/inventory/${id}/adjust`, {
          method: 'POST',
          body: JSON.stringify({ quantity, reason })
        });
      }
      const inv = db.get('mock_inventory');
      const item = inv.find(i => i.id === id);
      if (item) {
        item.quantity = Math.max(0, item.quantity + parseInt(quantity));
        db.set('mock_inventory', inv);
      }
      return { success: true, message: "Stock level adjusted successfully" };
    }
  },

  productsAdmin: {
    async create(name, description, price, sku, status, categoryId, file = null) {
      if (isBackendOnline) {
        // Implementation for form upload or standard JSON
        const body = { name, description, price, sku, status, categoryId };
        return await request('/api/products', {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }
      const prods = db.get('mock_products');
      const cats = db.get('mock_categories');
      const cat = cats.find(c => c.id === categoryId);

      const newProd = {
        id: "prod-" + Math.random().toString(36).substr(2, 9),
        name,
        description,
        price: parseFloat(price),
        sku,
        status,
        category: cat ? cat.name : "Uncategorized",
        categoryId,
        rating: 5.0,
        reviewsCount: 0,
        badge: "New Arrival",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80"
      };

      prods.unshift(newProd);
      db.set('mock_products', prods);

      // Add to inventory too
      const inv = db.get('mock_inventory');
      inv.push({
        id: "inv-" + newProd.id,
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        quantity: 10,
        supplier: "Default Supplier",
        status: "IN_STOCK"
      });
      db.set('mock_inventory', inv);

      return { success: true, message: "Product created successfully", data: newProd };
    },

    async update(id, name, description, price, sku, status, categoryId) {
      if (isBackendOnline) {
        return await request(`/api/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, description, price, sku, status, categoryId })
        });
      }
      const prods = db.get('mock_products');
      const prodIndex = prods.findIndex(p => p.id === id);
      if (prodIndex !== -1) {
        const cats = db.get('mock_categories');
        const cat = cats.find(c => c.id === categoryId);
        
        prods[prodIndex] = {
          ...prods[prodIndex],
          name,
          description,
          price: parseFloat(price),
          sku,
          status,
          category: cat ? cat.name : prods[prodIndex].category,
          categoryId
        };
        db.set('mock_products', prods);
      }
      return { success: true, message: "Product updated successfully" };
    },

    async delete(id) {
      if (isBackendOnline) return await request(`/api/products/${id}`, { method: 'DELETE' });
      const prods = db.get('mock_products');
      db.set('mock_products', prods.filter(p => p.id !== id));
      return { success: true, message: "Product deleted successfully" };
    }
  },

  ordersAdmin: {
    async listAll() {
      if (isBackendOnline) return await request('/api/orders');
      return { success: true, data: db.get('mock_orders') };
    },
    async updateStatus(id, status) {
      if (isBackendOnline) return await request(`/api/orders/${id}/status?status=${status}`, { method: 'PATCH' });
      const orders = db.get('mock_orders');
      const order = orders.find(o => o.id === id);
      if (order) {
        order.status = status;
      }
      db.set('mock_orders', orders);
      return { success: true, message: `Order status updated to ${status}` };
    }
  },

  // NOTIFICATIONS
  notifications: {
    async getAll() {
      if (isBackendOnline) return await request('/api/notifications');
      const n = JSON.parse(localStorage.getItem('mock_notifications')) || [];
      return { success: true, data: n };
    },
    async getUnreadCount() {
      if (isBackendOnline) return await request('/api/notifications/unread-count');
      const n = JSON.parse(localStorage.getItem('mock_notifications')) || [];
      return { success: true, data: n.filter(x => !x.read).length };
    },
    async markRead(id) {
      if (isBackendOnline) return await request(`/api/notifications/${id}/read`, { method: 'PATCH' });
      const n = JSON.parse(localStorage.getItem('mock_notifications')) || [];
      const item = n.find(x => x.id === id);
      if (item) item.read = true;
      localStorage.setItem('mock_notifications', JSON.stringify(n));
      return { success: true };
    },
    async markAllRead() {
      if (isBackendOnline) return await request('/api/notifications/read-all', { method: 'PATCH' });
      const n = JSON.parse(localStorage.getItem('mock_notifications')) || [];
      n.forEach(x => x.read = true);
      localStorage.setItem('mock_notifications', JSON.stringify(n));
      return { success: true };
    }
  },

  // COUPONS / FINANCE
  finance: {
    async validateCoupon(code) {
      if (isBackendOnline) {
        return await request(`/api/finance/coupons/validate?code=${encodeURIComponent(code)}`, { method: 'POST' });
      }
      // Mock: accept "LUZ24" for 10% off
      if (code.toUpperCase() === 'LUZ24') {
        return { success: true, message: "Coupon is valid", data: { code: 'LUZ24', amount: 10, type: 'PERCENTAGE' } };
      }
      throw new Error("Invalid or expired coupon code");
    },
    async getAll() {
      if (isBackendOnline) return await request('/api/finance/coupons');
      return { success: true, data: [{ id: 'cpn-1', code: 'LUZ24', amount: 10, type: 'PERCENTAGE', active: true, expiryDate: '2026-12-31' }] };
    },
    async create(coupon) {
      if (isBackendOnline) return await request('/api/finance/coupons', { method: 'POST', body: JSON.stringify(coupon) });
      return { success: true, message: "Coupon created", data: { ...coupon, id: 'cpn-' + Date.now() } };
    },
    async deleteCoupon(id) {
      if (isBackendOnline) return await request(`/api/finance/coupons/${id}`, { method: 'DELETE' });
      return { success: true, message: "Coupon deleted" };
    }
  },

  // RECEIPTS / PDF
  async downloadReceiptPdf(orderId) {
    const t = token || localStorage.getItem('luz_jwt');
    const res = await fetch(`${BASE_URL}/api/receipts/orders/${orderId}/pdf`, {
      headers: { Authorization: `Bearer ${t}` }
    });
    if (!res.ok) throw new Error('Failed to generate receipt PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LuzTechnology_Receipt_${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
