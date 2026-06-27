import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

const BACKEND_URL = 'http://localhost:8080';

function getPrimaryImage(p) {
  if (Array.isArray(p.images) && p.images.length > 0) {
    const primary = p.images.find(i => i.isPrimary || i.primary) || p.images[0];
    const url = primary?.url || '';
    return url.startsWith('/uploads/') ? BACKEND_URL + url : url;
  }
  return p.image || '';
}

function renderStars(rating) {
  const r = Math.floor(parseFloat(rating) || 4);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function renderCard(p, removable = false) {
  const img = getPrimaryImage(p);
  const price = Number(p.price || 0);
  return `
    <div class="product-card">
      ${removable ? `
        <button class="wishlist-toggle active" data-action="toggle-wishlist" data-id="${p.id}" title="Remove">
          <svg width="18" height="18" fill="red" stroke="red" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
        </button>` : ''}
      <div class="product-card-img-container" data-action="view-details" data-id="${p.id}">
        ${img
          ? `<img src="${img}" alt="${p.name}" class="product-card-img" onerror="this.style.display='none'">`
          : `<div class="product-card-img" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:32px;">📦</div>`}
      </div>
      <div class="product-card-info">
        ${p.sku ? `<span class="product-sku">${p.sku}</span>` : ''}
        <h3 class="product-title" data-action="view-details" data-id="${p.id}">${p.name}</h3>
        <div class="product-rating">${renderStars(p.averageRating || p.rating)} <span>(${p.reviewsCount || 0})</span></div>
        <div class="product-price-row"><span class="price-current">RWF ${Math.round(price).toLocaleString('en-US')}</span></div>
      </div>
      <div class="product-card-actions">
        ${(() => {
          const qty = p.inventoryItem?.quantity ?? p.stock ?? null;
          const outOfStock = qty !== null && qty <= 0;
          return outOfStock
            ? `<button class="btn-card-add" disabled style="opacity:.5;cursor:not-allowed;">Out of Stock</button>`
            : `<button class="btn-card-add" data-action="add-to-cart" data-id="${p.id}">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15"></path></svg>
                Add to Cart
               </button>`;
        })()}
      </div>
    </div>
  `;
}

export async function render() {
  const [wishRes, recsRes] = await Promise.all([
    ApiService.wishlist.get().catch(() => ({ data: [] })),
    ApiService.wishlist.getRecommendations().catch(() => ({ data: [] })),
  ]);

  const items = Array.isArray(wishRes.data) ? wishRes.data : [];
  const recs  = Array.isArray(recsRes.data) ? recsRes.data : [];

  const wishlistHtml = items.length
    ? items.map(p => renderCard(p, true)).join('')
    : `<div class="no-products" style="grid-column:1/-1;">Your wishlist is empty. Browse products and save your favourites!</div>`;

  const recsHtml = recs.length
    ? recs.map(p => renderCard(p, false)).join('')
    : '';

  return `
    <h2 style="margin-bottom:24px;">My Wishlist <span style="font-size:16px;color:#94a3b8;font-weight:400;">(${items.length} items)</span></h2>
    <div class="product-grid">${wishlistHtml}</div>
    ${recsHtml ? `
      <h3 style="margin:32px 0 16px;">Recommended for You</h3>
      <div class="product-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">${recsHtml}</div>
    ` : ''}
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, refresh, renderHeader, toast } = helpers;
  const container = document.getElementById('app-view-container');
  if (!container) return;

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
    btn.addEventListener('click', e => {
      e.stopPropagation();
      checkAuth(async () => {
        try {
          await ApiService.cart.addItem(btn.getAttribute('data-id'), 1);
          toast('Added to cart!', 'success');
          renderHeader();
        } catch { toast('Failed to add to cart', 'error'); }
      });
    });
  });

  container.querySelectorAll('[data-action="view-details"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      navigate('product-detail', { selectedProductId: btn.getAttribute('data-id') });
    });
  });

  container.querySelectorAll('[data-action="toggle-wishlist"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      checkAuth(async () => {
        try {
          await ApiService.wishlist.remove(btn.getAttribute('data-id'));
          toast('Removed from wishlist');
          refresh();
          renderHeader();
        } catch { toast('Failed to remove', 'error'); }
      });
    });
  });
}
