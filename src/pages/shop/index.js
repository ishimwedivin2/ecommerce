import './style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

const BACKEND_URL = 'http://localhost:8080';
const PAGE_SIZE = 24;

let _page = 0;
let _totalPages = 1;
let _totalItems = 0;
let _filters = { status: 'ACTIVE' };
let _categories = [];

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80';

function getPrimaryImage(product) {
  if (!product) return '';
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find(i => i.isPrimary || i.primary);
    const url = primary?.url || product.images[0]?.url || '';
    return url.startsWith('/uploads/') ? `${BACKEND_URL}${url}` : url;
  }
  return product.image || '';
}

function renderStars(rating) {
  const r = parseFloat(rating) || 4.5;
  return '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r));
}

function renderCard(p) {
  const img = getPrimaryImage(p);
  const price = parseFloat(p.price) || 0;
  const baseDiscounted = p.discountPercentage
    ? price * (1 - parseFloat(p.discountPercentage) / 100) : null;
  const vatPrice = Math.round(price * 1.18);
  const vatDiscounted = baseDiscounted ? Math.round(baseDiscounted * 1.18) : null;

  return `
    <div class="sp-card" data-id="${p.id}">
      <div class="sp-card-img-wrap">
        <img src="${img || FALLBACK_IMG}" alt="${p.name}" class="sp-card-img"
          onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
        ${p.discountPercentage ? `<span class="sp-card-badge">-${p.discountPercentage}% OFF</span>` : ''}
        <button class="sp-card-wish" data-action="shop-wish" data-id="${p.id}" title="Add to wishlist">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"></path></svg>
        </button>
      </div>
      <div class="sp-card-body">
        ${p.categoryName ? `<span class="sp-card-cat">${p.categoryName}</span>` : ''}
        <h3 class="sp-card-name" data-action="shop-detail" data-id="${p.id}">${p.name}</h3>
        <div class="sp-card-rating">${renderStars(p.averageRating || 0)} ${p.reviewsCount > 0 ? `<span>(${p.reviewsCount})</span>` : ''}</div>
        <div class="sp-card-price-row">
          ${vatDiscounted
            ? `<span class="sp-price-orig">RWF ${vatPrice.toLocaleString('en-US')}</span><span class="sp-price-now">RWF ${vatDiscounted.toLocaleString('en-US')}</span>`
            : `<span class="sp-price-now">RWF ${vatPrice.toLocaleString('en-US')}</span>`}
        </div>
      </div>
      <div class="sp-card-footer">
        ${(() => {
          const qty = p.inventoryItem?.quantity ?? p.stock ?? null;
          const outOfStock = qty !== null && qty <= 0;
          return outOfStock
            ? `<button class="sp-btn-cart" disabled style="opacity:.5;cursor:not-allowed">Out of Stock</button>`
            : `<button class="sp-btn-cart" data-action="shop-add-cart" data-id="${p.id}">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Add to Cart
               </button>`;
        })()}
        <button class="sp-btn-detail" data-action="shop-detail" data-id="${p.id}">View</button>
      </div>
    </div>
  `;
}

function renderSidebar(cats, filters) {
  const catItems = cats.map(c => `
    <label class="sp-cat-item ${filters.categoryId === c.id ? 'active' : ''}">
      <input type="radio" name="sp-cat" value="${c.id}" ${filters.categoryId === c.id ? 'checked' : ''}>
      <span>${c.name}</span>
      ${c.productCount != null ? `<em>${c.productCount}</em>` : ''}
    </label>
  `).join('');

  const minVal = filters.minPrice || '';
  const maxVal = filters.maxPrice || '';

  return `
    <aside class="sp-sidebar">
      <div class="sp-sidebar-section">
        <h4 class="sp-sidebar-title">Categories</h4>
        <div class="sp-cats">
          <label class="sp-cat-item ${!filters.categoryId ? 'active' : ''}">
            <input type="radio" name="sp-cat" value="" ${!filters.categoryId ? 'checked' : ''}>
            <span>All Products</span>
          </label>
          ${catItems}
        </div>
      </div>

      <div class="sp-sidebar-section">
        <h4 class="sp-sidebar-title">Price Range (RWF)</h4>
        <div class="sp-price-range">
          <div class="sp-price-inputs">
            <input type="number" id="sp-min-input" class="sp-price-input" min="0" placeholder="Min" value="${minVal || ''}">
            <span class="sp-price-sep">—</span>
            <input type="number" id="sp-max-input" class="sp-price-input" min="0" placeholder="Max" value="${maxVal || ''}">
          </div>
        </div>
        <button class="sp-apply-price" id="sp-apply-price">Apply</button>
      </div>

      <div class="sp-sidebar-section">
        <h4 class="sp-sidebar-title">Availability</h4>
        <label class="sp-check-item">
          <input type="checkbox" id="sp-in-stock" ${filters.status === 'ACTIVE' ? 'checked' : ''}> In Stock
        </label>
      </div>

      <button class="sp-clear-filters" id="sp-clear-filters">Clear All Filters</button>
    </aside>
  `;
}

function renderGrid(products, loading = false) {
  if (loading) return `<div class="sp-loading"><div class="sp-spinner"></div></div>`;
  if (!products.length) return `<div class="sp-empty">No products found. Try different filters.</div>`;
  return products.map(renderCard).join('');
}

export async function render(state) {
  _page = 0;
  _filters = {
    status: 'ACTIVE',
    categoryId: state.activeCategory || undefined,
    name: state.searchQuery || undefined,
  };

  const [catsRes, productsRes] = await Promise.all([
    ApiService.categories.getAll().catch(() => ({ data: [] })),
    ApiService.products.search({ ..._filters, page: 0, size: PAGE_SIZE }).catch(() => ({ data: {} })),
  ]);

  _categories = Array.isArray(catsRes.data) ? catsRes.data : [];
  const page = productsRes.data || {};
  const products = Array.isArray(page) ? page : (page.content || []);
  _totalPages = page.totalPages || 1;
  _totalItems = page.totalElements || products.length;

  return `
    <div class="sp-page">
      ${renderSidebar(_categories, _filters)}
      <div class="sp-main">
        <div class="sp-topbar">
          <div class="sp-topbar-left">
            <h2 class="sp-heading">Shop</h2>
            <span class="sp-count">${_totalItems} products</span>
          </div>
          <div class="sp-topbar-right">
            <select class="sp-sort" id="sp-sort">
              <option value="createdAt,desc">Newest</option>
              <option value="price,asc">Price: Low → High</option>
              <option value="price,desc">Price: High → Low</option>
              <option value="name,asc">Name: A–Z</option>
            </select>
          </div>
        </div>
        <div class="sp-grid" id="sp-grid">
          ${renderGrid(products)}
        </div>
        ${_totalPages > 1 ? `
          <div class="sp-pagination" id="sp-pagination">
            <button class="sp-pg-btn" id="sp-prev" ${_page === 0 ? 'disabled' : ''}>← Prev</button>
            <span class="sp-pg-info">Page <strong>${_page + 1}</strong> of ${_totalPages}</span>
            <button class="sp-pg-btn" id="sp-next" ${_page >= _totalPages - 1 ? 'disabled' : ''}>Next →</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function fetchAndUpdate() {
  const grid = document.getElementById('sp-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="sp-loading"><div class="sp-spinner"></div></div>`;

  const sortEl = document.getElementById('sp-sort');
  const [sortBy, sortDir] = (sortEl?.value || 'createdAt,desc').split(',');

  const res = await ApiService.products.search({
    ..._filters, page: _page, size: PAGE_SIZE, sortBy, sortDir,
  }).catch(() => ({ data: {} }));

  const pg = res.data || {};
  const products = Array.isArray(pg) ? pg : (pg.content || []);
  _totalPages = pg.totalPages || 1;
  _totalItems = pg.totalElements || products.length;

  grid.innerHTML = renderGrid(products);

  document.querySelector('.sp-count').textContent = `${_totalItems} products`;

  const pgEl = document.getElementById('sp-pagination');
  if (_totalPages > 1) {
    if (!pgEl) {
      const div = document.createElement('div');
      div.className = 'sp-pagination';
      div.id = 'sp-pagination';
      grid.after(div);
    }
    const pag = document.getElementById('sp-pagination');
    pag.innerHTML = `
      <button class="sp-pg-btn" id="sp-prev" ${_page === 0 ? 'disabled' : ''}>← Prev</button>
      <span class="sp-pg-info">Page <strong>${_page + 1}</strong> of ${_totalPages}</span>
      <button class="sp-pg-btn" id="sp-next" ${_page >= _totalPages - 1 ? 'disabled' : ''}>Next →</button>
    `;
    bindPagination();
  } else if (pgEl) {
    pgEl.remove();
  }

  bindCardActions();
}

function bindPagination() {
  document.getElementById('sp-prev')?.addEventListener('click', () => {
    if (_page > 0) { _page--; fetchAndUpdate(); window.scrollTo(0, 0); }
  });
  document.getElementById('sp-next')?.addEventListener('click', () => {
    if (_page < _totalPages - 1) { _page++; fetchAndUpdate(); window.scrollTo(0, 0); }
  });
}


function bindCardActions() {
  document.querySelectorAll('[data-action="shop-detail"]').forEach(el => {
    el.addEventListener('click', () => {
      setState({ currentView: 'product-detail', selectedProductId: el.dataset.id });
      import('../../router.js').then(m => m.renderAll());
    });
  });
  document.querySelectorAll('[data-action="shop-add-cart"]').forEach(el => {
    el.addEventListener('click', async () => {
      const user = ApiService.getCurrentUser();
      if (!user) {
        import('../../components/toast.js').then(m => m.showToast('Please sign in to add items', 'error'));
        return;
      }
      const roles = user.roles || [];
      const isCustomerOnly = roles.some(r => (typeof r === 'string' ? r : r.name || r.authority || '').toUpperCase().includes('CUSTOMER'));
      const isStaff = roles.some(r => {
        const n = (typeof r === 'string' ? r : r.name || r.authority || '').toUpperCase();
        return n.includes('ADMIN') || n.includes('EMPLOYEE') || n.includes('SUPPORT');
      });
      if (isStaff && !isCustomerOnly) {
        import('../../components/toast.js').then(m => m.showToast('Cart is not available for staff accounts', 'info'));
        return;
      }
      try {
        await ApiService.cart.addItem(el.dataset.id, 1);
        import('../../components/toast.js').then(m => m.showToast('Added to cart!', 'success'));
        import('../../router.js').then(async m => {
          await m.renderHeader();
          await m.openCartDrawer();
        });
      } catch (err) {
        import('../../components/toast.js').then(m => m.showToast(err.message || 'Failed to add to cart', 'error'));
      }
    });
  });
  document.querySelectorAll('[data-action="shop-wish"]').forEach(el => {
    el.addEventListener('click', async () => {
      try {
        await ApiService.wishlist.add(el.dataset.id);
        import('../../components/toast.js').then(m => m.showToast('Added to wishlist!', 'success'));
      } catch {
        import('../../components/toast.js').then(m => m.showToast('Please sign in first', 'error'));
      }
    });
  });
}

export function bindEvents(state, helpers) {
  // Set exact header height so both panels fill the remaining viewport
  const headerEl = document.querySelector('.header-main');
  const promoEl  = document.querySelector('.promo-banner');
  const hh = (headerEl?.offsetHeight || 64) + (promoEl?.offsetHeight || 0);
  document.documentElement.style.setProperty('--sp-header-h', hh + 'px');

  // Category filter
  document.querySelectorAll('input[name="sp-cat"]').forEach(radio => {
    radio.addEventListener('change', () => {
      _filters.categoryId = radio.value || undefined;
      _filters.name = undefined;
      // highlight active
      document.querySelectorAll('.sp-cat-item').forEach(l => l.classList.remove('active'));
      radio.parentElement.classList.add('active');
      _page = 0;
      fetchAndUpdate();
    });
  });

  // Price range inputs
  const minInput = document.getElementById('sp-min-input');
  const maxInput = document.getElementById('sp-max-input');

  document.getElementById('sp-apply-price')?.addEventListener('click', () => {
    const min = minInput?.value !== '' ? parseFloat(minInput.value) : undefined;
    const max = maxInput?.value !== '' ? parseFloat(maxInput.value) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      minInput.style.borderColor = 'var(--danger)';
      maxInput.style.borderColor = 'var(--danger)';
      return;
    }
    if (minInput) minInput.style.borderColor = '';
    if (maxInput) maxInput.style.borderColor = '';
    _filters.minPrice = min;
    _filters.maxPrice = max;
    _page = 0;
    fetchAndUpdate();
  });

  // Apply on Enter key in either input
  [minInput, maxInput].forEach(inp => {
    inp?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('sp-apply-price')?.click();
    });
  });

  // Sort
  document.getElementById('sp-sort')?.addEventListener('change', () => {
    _page = 0;
    fetchAndUpdate();
  });

  // Pagination
  bindPagination();

  // Clear filters
  document.getElementById('sp-clear-filters')?.addEventListener('click', () => {
    _filters = { status: 'ACTIVE' };
    _page = 0;
    // reset radios
    document.querySelectorAll('input[name="sp-cat"]').forEach(r => { r.checked = r.value === ''; });
    document.querySelectorAll('.sp-cat-item').forEach(l => l.classList.remove('active'));
    document.querySelector('.sp-cat-item')?.classList.add('active');
    const minI = document.getElementById('sp-min-input');
    const maxI = document.getElementById('sp-max-input');
    if (minI) { minI.value = ''; minI.style.borderColor = ''; }
    if (maxI) { maxI.value = ''; maxI.style.borderColor = ''; }
    fetchAndUpdate();
  });

  bindCardActions();
}
