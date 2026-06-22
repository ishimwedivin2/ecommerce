import './style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

const BACKEND_URL = 'http://localhost:8080';
const PAGE_SIZE = 20;

let currentPage = 0;
let totalPages = 1;
let currentFilters = {};
let currentSlide = 0;   // logical index in allBanners (0-based)
let trackPos = 1;       // actual position in extended clone array
let isAnimating = false;
let slideInterval = null;
let allBanners = [];
let featuredMap = {};

function getPrimaryImage(product) {
  if (!product) return '';
  // Backend shape: images[] array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find(i => i.isPrimary || i.primary);
    const url = primary?.url || product.images[0]?.url || '';
    return url.startsWith('/uploads/') ? `${BACKEND_URL}${url}` : url;
  }
  // Mock fallback shape: single image string
  return product.image || '';
}

function renderStars(rating) {
  const r = parseFloat(rating) || 4.5;
  const full = Math.floor(r);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

function renderSlide(banner, product) {
  const price = product ? `<div class="hero-price">£${parseFloat(product.price).toFixed(2)} <span>(incl. VAT)</span></div>` : '';
  const badge = banner.tagLabel ? `<span class="hero-tag">${banner.tagLabel}</span>` : '';
  const img = product ? getPrimaryImage(product) : (banner.imageUrl || '');
  const productId = product?.id || banner.productId || '';
  const discountBadge = product?.discountPercentage
    ? `<div class="hero-discount-badge">-${product.discountPercentage}% OFF</div>` : '';

  return `
    <div class="hero-slide">
      <div class="hero-deco-ring hero-deco-ring-1"></div>
      <div class="hero-deco-ring hero-deco-ring-2"></div>
      <div class="hero-text">
        ${badge}
        <h1 class="hero-title">${banner.title}</h1>
        <p class="hero-desc">${banner.subtitle || ''}</p>
        ${price}
        <div class="hero-buttons">
          ${productId ? `
            <button class="btn-primary" data-action="add-to-cart" data-id="${productId}">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              ${banner.buttonText || 'Add to Cart'}
            </button>
            <button class="btn-secondary" data-action="view-details" data-id="${productId}">View details</button>
          ` : `
            <button class="btn-primary">${banner.buttonText || 'Shop Now'}</button>
          `}
        </div>
        <div class="hero-stats">
          <div class="hero-stat-item"><span class="hero-stat-value">10K+</span><span class="hero-stat-label">Products</span></div>
          <div class="hero-stat-item"><span class="hero-stat-value">4.9★</span><span class="hero-stat-label">Avg Rating</span></div>
          <div class="hero-stat-item"><span class="hero-stat-value">50K+</span><span class="hero-stat-label">Happy Customers</span></div>
        </div>
      </div>
      <div class="hero-image-container">
        ${discountBadge}
        <img src="${img}" alt="${banner.title}" class="hero-img"
          onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'">
      </div>
    </div>
  `;
}

function buildHeroBanner(banners, featuredProducts) {
  if (!banners || banners.length === 0) return '';

  allBanners = banners.filter(b => b.active).sort((a, b) => a.displayOrder - b.displayOrder);
  if (allBanners.length === 0) return '';

  featuredMap = {};
  (featuredProducts || []).forEach(p => { featuredMap[p.id] = p; });

  const n = allBanners.length;

  // Extended array: [clone-last, ...real slides, clone-first]
  const extended = [allBanners[n - 1], ...allBanners, allBanners[0]];

  const slidesHtml = extended.map((banner, i) => {
    const product = featuredMap[banner.productId] || null;
    const isActive = i === 1; // real first slide
    return `<div class="hero-slide-wrapper${isActive ? ' active' : ''}" data-pos="${i}">${renderSlide(banner, product)}</div>`;
  }).join('');

  const dotsHtml = allBanners.map((_, i) =>
    `<div class="slider-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></div>`
  ).join('');

  return `
    <div class="hero-banner animate-fade-up" id="hero-slider">
      <div class="hero-slides-track" id="hero-track" style="transform:translateX(-100%)">${slidesHtml}</div>
      ${n > 1 ? `
        <button class="hero-nav hero-nav-prev" id="hero-prev">&#8249;</button>
        <button class="hero-nav hero-nav-next" id="hero-next">&#8250;</button>
        <div class="hero-slider-dots">${dotsHtml}</div>
      ` : ''}
    </div>
  `;
}

function renderProductCard(p) {
  const image = getPrimaryImage(p);
  const badge = p.discountPercentage
    ? `<div class="card-badge">-${p.discountPercentage}%</div>`
    : (p.badge ? `<div class="card-badge">${p.badge}</div>` : '');

  return `
    <div class="product-card" data-id="${p.id}">
      ${badge}
      <button class="wishlist-toggle" data-action="toggle-wishlist" data-id="${p.id}">
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
      </button>
      <div class="product-card-img-container" data-action="view-details" data-id="${p.id}">
        <img src="${image}" alt="${p.name}" class="product-card-img"
          onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'">
        <div class="product-card-overlay">
          <button class="btn-quick-view" data-action="view-details" data-id="${p.id}">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="display:inline;vertical-align:middle;margin-right:5px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            Quick View
          </button>
        </div>
      </div>
      <div class="product-card-info">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="product-sku">${p.sku}</span>
          <span class="product-stock-indicator">In Stock</span>
        </div>
        <h3 class="product-title" data-action="view-details" data-id="${p.id}">${p.name}</h3>
        <div class="product-rating">${renderStars(p.averageRating || p.rating || 4.5)} <span>(${p.reviewsCount || 0})</span></div>
        <div class="product-price-row">
          ${p.discountPercentage ? `<span class="price-original">£${parseFloat(p.price).toFixed(2)}</span>
            <span class="price-current">£${(parseFloat(p.price) * (1 - parseFloat(p.discountPercentage) / 100)).toFixed(2)}</span>` :
            `<span class="price-current">£${parseFloat(p.price).toFixed(2)}</span>`}
          <span class="price-vat">(incl. VAT)</span>
        </div>
      </div>
      <div class="product-card-actions">
        <button class="btn-card-add" data-action="add-to-cart" data-id="${p.id}">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"></path></svg>
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

export async function render(state) {
  currentPage = 0;
  currentFilters = {
    categoryId: state.activeCategory || undefined,
    name: state.searchQuery || undefined,
    status: 'ACTIVE',
  };

  const [bannersRes, featuredRes, productsRes] = await Promise.all([
    ApiService.banners.getActive().catch(() => ({ data: [] })),
    ApiService.products.getFeatured().catch(() => ({ data: [] })),
    ApiService.products.search({ ...currentFilters, page: 0, size: PAGE_SIZE }),
  ]);

  const banners = bannersRes.data || [];
  const featuredProducts = featuredRes.data || [];
  const products = productsRes.data || [];
  const pagination = productsRes.pagination || {};
  totalPages = pagination.totalPages || 1;

  const heroBannerHtml = buildHeroBanner(banners, featuredProducts);

  const trustBadgesHtml = `
    <div class="trust-badges animate-fade-up">
      <div class="trust-badge-item">
        <div class="trust-badge-icon"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg></div>
        <div class="trust-badge-text"><strong>Free Shipping</strong><span>On orders over £50</span></div>
      </div>
      <div class="trust-badge-item">
        <div class="trust-badge-icon"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
        <div class="trust-badge-text"><strong>Secure Payment</strong><span>256-bit SSL encryption</span></div>
      </div>
      <div class="trust-badge-item">
        <div class="trust-badge-icon"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></div>
        <div class="trust-badge-text"><strong>Easy Returns</strong><span>30-day return policy</span></div>
      </div>
      <div class="trust-badge-item">
        <div class="trust-badge-icon"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div>
        <div class="trust-badge-text"><strong>24/7 Support</strong><span>Expert help anytime</span></div>
      </div>
    </div>
  `;

  const productCardsHtml = products.length > 0
    ? products.map(renderProductCard).join('')
    : '<div class="no-products">No products found matching your search.</div>';

  const showLoadMore = totalPages > 1 && currentPage < totalPages - 1;

  return `
    ${heroBannerHtml}
    ${trustBadgesHtml}

    <div class="filters-bar">
      <div class="filter-groups">
        <select class="filter-select" id="filter-rating">
          <option value="">Product Ratings</option>
          <option value="4.5">4.5 & up</option>
          <option value="4.0">4.0 & up</option>
        </select>
        <select class="filter-select" id="filter-availability">
          <option value="">Availability</option>
          <option value="in-stock">In Stock</option>
        </select>
        <select class="filter-select" id="filter-brand">
          <option value="">Brand</option>
          <option value="asus">ASUS</option>
          <option value="hp">HP</option>
          <option value="dell">Dell</option>
          <option value="lenovo">Lenovo</option>
        </select>
        <button class="filter-btn-all">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          All Filter
        </button>
      </div>
      <select class="sort-select" id="sort-products">
        <option value="createdAt,desc">Sort by Newest</option>
        <option value="price,asc">Price: Low to High</option>
        <option value="price,desc">Price: High to Low</option>
        <option value="averageRating,desc">Top Rated</option>
      </select>
    </div>

    <div class="section-header">
      <h2 class="section-title">
        All Products
        <span class="section-count-badge">${pagination.totalElements || products.length} items</span>
      </h2>
    </div>

    <div class="product-grid" id="product-grid">${productCardsHtml}</div>

    ${showLoadMore ? `
      <div class="load-more-container" id="load-more-container">
        <button class="btn-load-more" id="btn-load-more">
          Load More Products
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <span class="load-more-info">Page ${currentPage + 1} of ${totalPages}</span>
      </div>
    ` : ''}
  `;
}

// ── Slider controls ───────────────────────────────────────────────
function getTrack() { return document.getElementById('hero-track'); }

function updateDots(logicalIndex) {
  const dots = document.querySelectorAll('.hero-slider-dots .slider-dot');
  dots.forEach(d => d.classList.remove('active'));
  dots[logicalIndex]?.classList.add('active');

  const wrappers = document.querySelectorAll('#hero-track .hero-slide-wrapper');
  wrappers.forEach(w => w.classList.remove('active'));
  wrappers[logicalIndex + 1]?.classList.add('active'); // +1 offset for clone-last at pos 0
}

function moveTrack(pos, animate = true) {
  const track = getTrack();
  if (!track) return;
  track.style.transition = animate
    ? 'transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'none';
  track.style.transform = `translateX(-${pos * 100}%)`;
  trackPos = pos;
}

function nextSlide() {
  if (isAnimating) return;
  isAnimating = true;
  const n = allBanners.length;
  const newPos = trackPos + 1;
  const newLogical = newPos - 1 < n ? newPos - 1 : 0;

  updateDots(newLogical);
  moveTrack(newPos);
  currentSlide = newLogical;

  // If we landed on clone-first (pos n+1), silently jump to real first (pos 1)
  setTimeout(() => {
    if (newPos === n + 1) {
      moveTrack(1, false);
    }
    isAnimating = false;
  }, 1150);
}

function prevSlide() {
  if (isAnimating) return;
  isAnimating = true;
  const n = allBanners.length;
  const newPos = trackPos - 1;
  const newLogical = newPos >= 1 ? newPos - 1 : n - 1;

  updateDots(newLogical);
  moveTrack(newPos);
  currentSlide = newLogical;

  // If we landed on clone-last (pos 0), silently jump to real last (pos n)
  setTimeout(() => {
    if (newPos === 0) {
      moveTrack(n, false);
    }
    isAnimating = false;
  }, 1150);
}

function goToSlide(logicalIndex) {
  if (isAnimating) return;
  const n = allBanners.length;
  const idx = ((logicalIndex % n) + n) % n;
  const newPos = idx + 1;
  isAnimating = true;
  updateDots(idx);
  moveTrack(newPos);
  currentSlide = idx;
  setTimeout(() => { isAnimating = false; }, 1150);
}

function startSliderAuto() {
  stopSliderAuto();
  if (allBanners.length > 1) {
    slideInterval = setInterval(nextSlide, 8000);
  }
}

function stopSliderAuto() {
  if (slideInterval) { clearInterval(slideInterval); slideInterval = null; }
}

// ── Load more ─────────────────────────────────────────────────────
async function loadMoreProducts(helpers) {
  const btn = document.getElementById('btn-load-more');
  if (btn) { btn.textContent = 'Loading…'; btn.disabled = true; }

  currentPage++;
  const res = await ApiService.products.search({ ...currentFilters, page: currentPage, size: PAGE_SIZE });
  const newProducts = res.data || [];
  const pagination = res.pagination || {};
  totalPages = pagination.totalPages || totalPages;

  const grid = document.getElementById('product-grid');
  if (grid && newProducts.length > 0) {
    grid.insertAdjacentHTML('beforeend', newProducts.map(renderProductCard).join(''));
    bindCardEvents(grid, helpers);
  }

  const container = document.getElementById('load-more-container');
  if (currentPage >= totalPages - 1) {
    if (container) container.remove();
  } else {
    if (btn) {
      btn.textContent = 'Load More Products';
      btn.disabled = false;
    }
    const info = document.querySelector('.load-more-info');
    if (info) info.textContent = `Page ${currentPage + 1} of ${totalPages}`;
  }
}

// ── Event binding ─────────────────────────────────────────────────
function bindCardEvents(container, helpers) {
  const { navigate, renderHeader, toast } = helpers;

  function checkAuth(cb) {
    if (!ApiService.getCurrentUser()) {
      toast('Please sign in to proceed');
      setState({ authModalMode: 'login' });
      helpers.renderAuthModal();
      return;
    }
    cb();
  }

  container.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkAuth(async () => {
        try {
          await ApiService.cart.addItem(btn.getAttribute('data-id'), 1);
          toast('Product added to cart!');
          renderHeader();
        } catch (err) { toast(err.message || 'Failed to add to cart'); }
      });
    });
  });

  container.querySelectorAll('[data-action="view-details"]').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('product-detail', { selectedProductId: btn.getAttribute('data-id') });
    });
  });

  container.querySelectorAll('[data-action="toggle-wishlist"]').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkAuth(async () => {
        try {
          const isWishRes = await ApiService.wishlist.check(btn.getAttribute('data-id'));
          if (isWishRes.data) {
            await ApiService.wishlist.remove(btn.getAttribute('data-id'));
            btn.classList.remove('active');
            toast('Removed from Wishlist');
          } else {
            await ApiService.wishlist.add(btn.getAttribute('data-id'));
            btn.classList.add('active');
            toast('Added to Wishlist!');
          }
          renderHeader();
        } catch (err) { toast(err.message || 'Wishlist error'); }
      });
    });
  });

  // Pre-mark wishlisted items
  if (ApiService.getCurrentUser()) {
    container.querySelectorAll('.wishlist-toggle').forEach(async (btn) => {
      try {
        const res = await ApiService.wishlist.check(btn.getAttribute('data-id'));
        if (res.data) btn.classList.add('active');
      } catch (_) {}
    });
  }
}

export function bindEvents(state, helpers) {
  const appContainer = document.getElementById('app-view-container');
  if (!appContainer) return;

  // Bind product card events
  bindCardEvents(appContainer, helpers);

  // Bind load more
  const loadMoreBtn = document.getElementById('btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => loadMoreProducts(helpers));
  }

  // Sort change
  const sortSelect = document.getElementById('sort-products');
  if (sortSelect) {
    sortSelect.addEventListener('change', async () => {
      const [sortBy, sortDir] = sortSelect.value.split(',');
      currentPage = 0;
      const res = await ApiService.products.search({ ...currentFilters, page: 0, size: PAGE_SIZE, sortBy, sortDir });
      const grid = document.getElementById('product-grid');
      if (grid) {
        grid.innerHTML = (res.data || []).map(renderProductCard).join('');
        bindCardEvents(grid, helpers);
      }
      const pagination = res.pagination || {};
      totalPages = pagination.totalPages || 1;
      const container = document.getElementById('load-more-container');
      if (container) {
        container.style.display = totalPages > 1 ? 'flex' : 'none';
      }
    });
  }

  // Hero slider controls — reset to slide 1 (trackPos=1 in extended array)
  currentSlide = 0;
  trackPos = 1;
  isAnimating = false;
  startSliderAuto();

  const prevBtn = document.getElementById('hero-prev');
  const nextBtn = document.getElementById('hero-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { stopSliderAuto(); prevSlide(); startSliderAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { stopSliderAuto(); nextSlide(); startSliderAuto(); });

  document.querySelectorAll('.hero-slider-dots .slider-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      stopSliderAuto();
      goToSlide(parseInt(dot.getAttribute('data-slide')));
      startSliderAuto();
    });
  });
}
