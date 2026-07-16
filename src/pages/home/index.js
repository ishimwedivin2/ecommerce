import './style.css';
import '../shop/style.css';
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
  const rawPrice = product ? Math.round(Number(product.discountedPriceIncludingTax ?? product.priceIncludingTax ?? product.price ?? 0)) : 0;
  const price = product ? `<div class="hero-price">RWF ${rawPrice.toLocaleString('en-US')}<span>incl. tax</span></div>` : '';
  const tag = banner.tagLabel || (product ? 'Featured Product' : 'New Arrival');
  const badge = `<span class="hero-tag">${tag}</span>`;
  const rawImg = product ? getPrimaryImage(product) : (banner.imageUrl || '');
  const img = rawImg.startsWith('/uploads/') ? `${BACKEND_URL}${rawImg}` : rawImg;
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
          ${(() => {
            const _su = ApiService.getCurrentUser();
            const _sr = (_su?.roles || []);
            const _slStaff = _sr.some(r => { const n=(typeof r==='string'?r:r.name||r.authority||'').toUpperCase(); return n.includes('ADMIN')||n.includes('EMPLOYEE')||n.includes('SUPPORT'); }) && !_sr.some(r=>(typeof r==='string'?r:r.name||r.authority||'').toUpperCase().includes('CUSTOMER'));
            if (productId && !_slStaff) return `<button class="btn-primary" data-action="add-to-cart" data-id="${productId}"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>${banner.buttonText || 'Add to Cart'}</button><button class="btn-secondary" data-action="view-details" data-id="${productId}">View details</button>`;
            if (productId && _slStaff) return `<button class="btn-secondary" data-action="view-details" data-id="${productId}">View details</button>`;
            return `<button class="btn-primary" data-action="go-shop">${banner.buttonText || 'Shop Now'}</button>`;
          })()} 
        </div>
        <div class="hero-stats">
          <div class="hero-stat-item"><span class="hero-stat-value">10K+</span><span class="hero-stat-label">Products</span></div>
          <div class="hero-stat-item"><span class="hero-stat-value">4.9★</span><span class="hero-stat-label">Avg Rating</span></div>
          <div class="hero-stat-item"><span class="hero-stat-value">50K+</span><span class="hero-stat-label">Happy Customers</span></div>
        </div>
      </div>
      <div class="hero-image-container">
        <div class="hero-image-glow"></div>
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
  const price = parseFloat(p.price) || 0;
  const baseDiscounted = p.discountPercentage
    ? price * (1 - parseFloat(p.discountPercentage) / 100) : null;
  const vatPrice = Math.round(Number(p.priceIncludingTax ?? price));
  const vatDiscounted = Math.round(Number(p.discountedPriceIncludingTax ?? baseDiscounted ?? vatPrice));
  const hasDiscount = !!baseDiscounted;
  const categoryName = p.category?.name || p.categoryName || '';
  const FALLBACK = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80';

  const _u = ApiService.getCurrentUser();
  const _r = (_u?.roles || []);
  const _isStaffOnly = _r.some(r => { const n=(typeof r==='string'?r:r.name||r.authority||'').toUpperCase(); return n.includes('ADMIN')||n.includes('EMPLOYEE')||n.includes('SUPPORT'); }) && !_r.some(r=>(typeof r==='string'?r:r.name||r.authority||'').toUpperCase().includes('CUSTOMER'));

  return `
    <div class="sp-card" data-id="${p.id}">
      <div class="sp-card-img-wrap" data-action="view-details" data-id="${p.id}">
        <img src="${image || FALLBACK}" alt="${p.name}" class="sp-card-img"
          onerror="this.onerror=null;this.src='${FALLBACK}'">
        ${p.discountPercentage ? `<span class="sp-card-badge">-${p.discountPercentage}% OFF</span>` : ''}
        ${_isStaffOnly ? '' : `<button class="sp-card-wish" data-action="toggle-wishlist" data-id="${p.id}" title="Add to wishlist">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"></path></svg>
        </button>`}
      </div>
      <div class="sp-card-body">
        ${categoryName ? `<span class="sp-card-cat">${categoryName}</span>` : ''}
        <h3 class="sp-card-name" data-action="view-details" data-id="${p.id}">${p.name}</h3>
        <div class="sp-card-rating">${renderStars(p.averageRating || p.rating || 4.5)} ${p.reviewsCount > 0 ? `<span>(${p.reviewsCount})</span>` : ''}</div>
        <div class="sp-card-price-row">
          ${hasDiscount
            ? `<span class="sp-price-orig">RWF ${vatPrice.toLocaleString('en-US')}</span><span class="sp-price-now">RWF ${vatDiscounted.toLocaleString('en-US')}</span>`
            : `<span class="sp-price-now">RWF ${vatPrice.toLocaleString('en-US')}</span>`}
        </div>
        ${Number(p.taxRate || 0) > 0 ? `<div style="color:#10b981;font-size:11px;font-weight:700;margin-top:4px;">✓ VAT Included</div>` : ''}
      </div>
      <div class="sp-card-footer">
        ${_isStaffOnly
          ? `<button class="sp-btn-detail" data-action="view-details" data-id="${p.id}" style="flex:1;">View Details</button>`
          : (() => {
              const qty = p.inventoryItem?.quantity ?? p.stock ?? null;
              const outOfStock = qty !== null && qty <= 0;
              return outOfStock
                ? `<button class="sp-btn-cart" disabled style="opacity:.5;cursor:not-allowed">Out of Stock</button>`
                : `<button class="sp-btn-cart" data-action="add-to-cart" data-id="${p.id}">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    Add to Cart
                   </button>`;
            })()
        }
        <button class="sp-btn-detail" data-action="view-details" data-id="${p.id}">View</button>
      </div>
    </div>
  `;
}

function renderRecommendationCard(p) {
  const image = getPrimaryImage(p);
  const price = parseFloat(p.price) || 0;
  const vatPrice = Math.round(Number(p.discountedPriceIncludingTax ?? p.priceIncludingTax ?? price));
  const categoryName = p.category?.name || p.categoryName || '';
  const FALLBACK = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80';

  return `
    <div class="sp-card rec-card" data-id="${p.id}">
      <div class="sp-card-img-wrap" data-action="view-details" data-id="${p.id}">
        <img src="${image || FALLBACK}" alt="${p.name}" class="sp-card-img"
          onerror="this.onerror=null;this.src='${FALLBACK}'">
      </div>
      <div class="sp-card-body">
        ${categoryName ? `<span class="sp-card-cat">${categoryName}</span>` : ''}
        <h3 class="sp-card-name" data-action="view-details" data-id="${p.id}">${p.name}</h3>
        <div class="sp-card-rating">${renderStars(p.averageRating || p.rating || 4.5)} ${p.reviewsCount > 0 ? `<span>(${p.reviewsCount})</span>` : ''}</div>
        <div class="sp-card-price-row"><span class="sp-price-now">RWF ${vatPrice.toLocaleString('en-US')}</span></div>
      </div>
      <div class="sp-card-footer">
        <button class="sp-btn-cart" data-action="add-to-cart" data-id="${p.id}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"></path></svg>
          Add to Cart
        </button>
        <button class="sp-btn-detail" data-action="view-details" data-id="${p.id}">View</button>
      </div>
    </div>
  `;
}

export async function render(state) {
  currentPage = 0;
  currentFilters = { status: 'ACTIVE' };
  // clear any stale search/category state so returning home always shows all products
  setState({ searchQuery: '', activeCategory: null });

  const _homeUser  = ApiService.getCurrentUser();
  const _homeRoles = (_homeUser?.roles || []);
  const _homeIsStaff = _homeRoles.some(r => { const n=(typeof r==='string'?r:r.name||r.authority||'').toUpperCase(); return n.includes('ADMIN')||n.includes('EMPLOYEE')||n.includes('SUPPORT'); }) && !_homeRoles.some(r=>(typeof r==='string'?r:r.name||r.authority||'').toUpperCase().includes('CUSTOMER'));
  const recommendationRequest = (_homeUser && !_homeIsStaff)
    ? ApiService.wishlist.getRecommendations(8).catch(() => ({ data: [] }))
    : Promise.resolve({ data: [] });

  const [bannersRes, featuredRes, productsRes, faqsRes, recsRes] = await Promise.all([
    ApiService.banners.getActive().catch(() => ({ data: [] })),
    ApiService.products.getFeatured().catch(() => ({ data: [] })),
    ApiService.products.search({ ...currentFilters, page: 0, size: PAGE_SIZE }),
    ApiService.support.getFAQs().catch(() => ({ data: [] })),
    recommendationRequest,
  ]);

  const banners = bannersRes.data || [];
  const featuredProducts = Array.isArray(featuredRes.data) ? featuredRes.data : (featuredRes.data?.content || []);
  const productsPage = productsRes.data || {};
  const products = Array.isArray(productsPage) ? productsPage : (productsPage.content || []);
  totalPages = productsPage.totalPages || 1;
  const faqs = faqsRes.data || [];
  const recommendations = Array.isArray(recsRes.data) ? recsRes.data : [];

  const heroBannerHtml = buildHeroBanner(banners, featuredProducts);

  const trustBadgesHtml = `
    <div class="trust-badges animate-fade-up">
      <div class="trust-badge-item">
        <div class="trust-badge-icon"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg></div>
        <div class="trust-badge-text"><strong>Free Shipping</strong><span>On orders over RWF 50,000</span></div>
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

    ${(recommendations.length && !_homeIsStaff) ? `
      <section class="recommendation-section animate-fade-up">
        <div class="section-header">
          <div>
            <h2 class="section-title">Recommended for You</h2>
            <p class="recommendation-subtitle">Based on your wishlist and previous shopping interests</p>
          </div>
          <button class="btn-rec-view-all" data-action="go-wishlist">View Wishlist</button>
        </div>
        <div class="recommendation-row sp-grid">${recommendations.map(renderRecommendationCard).join('')}</div>
      </section>
    ` : ''}

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
        <span class="section-count-badge">${productsPage.totalElements || products.length} items</span>
      </h2>
    </div>

    <div class="sp-grid" id="product-grid">${productCardsHtml}</div>

    ${showLoadMore ? `
      <div class="load-more-container" id="load-more-container">
        <button class="btn-load-more" id="btn-load-more">
          Load More Products
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
        </button>
        <span class="load-more-info">Page ${currentPage + 1} of ${totalPages}</span>
      </div>
    ` : ''}

    ${faqs.length > 0 ? `
      <div class="home-faq-section animate-fade-up">
        <div class="home-faq-header">
          <h2 class="home-faq-title">Frequently Asked Questions</h2>
          <p class="home-faq-subtitle">Quick answers to common questions</p>
        </div>
        <div class="home-faq-list">
          ${faqs.map((f, i) => `
            <div class="home-faq-item" data-faq-index="${i}">
              <button class="home-faq-question" data-action="toggle-faq" data-index="${i}">
                <span>${f.question}</span>
                <svg class="home-faq-chevron" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              <div class="home-faq-answer" id="faq-answer-${i}">${f.answer}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <section class="about-section animate-fade-up">
      <div class="about-header">
        <span class="about-eyebrow">Who We Are</span>
        <h2 class="about-title">About Luz Technology Ltd</h2>
        <p class="about-intro">Powering Rwanda's digital future through reliable networking, ICT solutions, and professional technology services.</p>
      </div>

      <div class="about-cards">

        <div class="about-card about-card--mission">
          <div class="about-card-icon">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h3 class="about-card-title">Our Mission</h3>
          <p class="about-card-text">To provide reliable networking equipment, ICT solutions, and professional technology services that help businesses and organizations achieve efficient, secure, and scalable digital operations — built on a foundation of quality, reliability, and customer success.</p>
        </div>

        <div class="about-card about-card--vision">
          <div class="about-card-icon">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </div>
          <h3 class="about-card-title">Our Vision</h3>
          <p class="about-card-text">To become a leading provider of networking and information technology solutions in Rwanda and the East African region — driven by innovation, quality service, and an unwavering commitment to customer satisfaction.</p>
        </div>

        <div class="about-card about-card--ops">
          <div class="about-card-icon">
            <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
          </div>
          <h3 class="about-card-title">Our Operations</h3>
          <p class="about-card-text">Our mission drives accurate inventory management, professional customer relations, and scalable systems — ensuring products are always available, service is consistently excellent, and our infrastructure is ready to support regional expansion across East Africa.</p>
        </div>

      </div>
    </section>
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
  const resPage = res.data || {};
  const newProducts = Array.isArray(resPage) ? resPage : (resPage.content || []);
  totalPages = resPage.totalPages || totalPages;

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
    const user = ApiService.getCurrentUser();
    if (!user) {
      toast('Sign in to add items to your cart', 'info');
      setState({ authModalMode: 'login' });
      helpers.renderAuthModal();
      return;
    }
    const roles = user.roles || [];
    const isStaff = roles.some(r => {
      const n = (typeof r === 'string' ? r : r.name || r.authority || '').toUpperCase();
      return n.includes('ADMIN') || n.includes('EMPLOYEE') || n.includes('SUPPORT');
    });
    const isCustomerOnly = roles.some(r => (typeof r === 'string' ? r : r.name || r.authority || '').toUpperCase().includes('CUSTOMER'));
    if (isStaff && !isCustomerOnly) {
      // belt-and-suspenders: hide the button if it slipped through
      if (btn) btn.style.display = 'none';
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

  container.querySelectorAll('[data-action="go-shop"]').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('shop');
    });
  });

  container.querySelectorAll('[data-action="go-wishlist"]').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('wishlist');
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
    container.querySelectorAll('.sp-card-wish').forEach(async (btn) => {
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
      const rp = res.data || {};
      const sorted = Array.isArray(rp) ? rp : (rp.content || []);
      totalPages = rp.totalPages || 1;
      const grid = document.getElementById('product-grid');
      if (grid) {
        grid.innerHTML = sorted.map(renderProductCard).join('');
        bindCardEvents(grid, helpers);
      }
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

  // FAQ accordion
  appContainer.querySelectorAll('[data-action="toggle-faq"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = btn.getAttribute('data-index');
      const answer = document.getElementById(`faq-answer-${index}`);
      const item = btn.closest('.home-faq-item');
      const isOpen = item.classList.contains('open');

      // Close all
      appContainer.querySelectorAll('.home-faq-item.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.home-faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}
