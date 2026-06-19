import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

function renderStars(rating) {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

export async function render() {
  const res = await ApiService.wishlist.get();
  const items = res.data || [];

  const recsRes = await ApiService.wishlist.getRecommendations();
  const recs = recsRes.data || [];

  const wishlistHtml = items.length > 0 ? items.map(p => `
    <div class="product-card">
      <button class="wishlist-toggle active" data-action="toggle-wishlist" data-id="${p.id}">
        <svg width="18" height="18" fill="red" stroke="red" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
      </button>
      <div class="product-card-img-container" data-action="view-details" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}" class="product-card-img">
      </div>
      <div class="product-card-info">
        <span class="product-sku">${p.sku}</span>
        <h3 class="product-title" data-action="view-details" data-id="${p.id}">${p.name}</h3>
        <div class="product-rating">${renderStars(p.rating || 4.5)} <span>(${p.reviewsCount || 10})</span></div>
        <div class="product-price-row"><span class="price-current">£${p.price.toFixed(2)}</span></div>
      </div>
      <div class="product-card-actions">
        <button class="btn-card-add" data-action="add-to-cart" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join('') : '<div class="no-products">Your wishlist is empty. Add products you love here!</div>';

  const recsHtml = recs.map(p => `
    <div class="product-card" style="transform:scale(0.95);">
      <div class="product-card-img-container" data-action="view-details" data-id="${p.id}">
        <img src="${p.image}" alt="${p.name}" class="product-card-img">
      </div>
      <div class="product-card-info" style="padding:12px;">
        <h4 class="product-title" data-action="view-details" data-id="${p.id}">${p.name}</h4>
        <span class="price-current">£${p.price.toFixed(2)}</span>
      </div>
    </div>
  `).join('');

  return `
    <h2 style="margin-bottom:24px;">My Wishlist</h2>
    <div class="product-grid">${wishlistHtml}</div>
    <h3 style="margin:32px 0 16px;">Recommended for You</h3>
    <div class="product-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">${recsHtml}</div>
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
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-id');
      checkAuth(async () => {
        await ApiService.cart.addItem(pid, 1);
        toast('Product added to cart!');
        renderHeader();
      });
    });
  });

  container.querySelectorAll('[data-action="view-details"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('product-detail', { selectedProductId: btn.getAttribute('data-id') });
    });
  });

  container.querySelectorAll('[data-action="toggle-wishlist"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.getAttribute('data-id');
      checkAuth(async () => {
        await ApiService.wishlist.remove(pid);
        toast('Removed from Wishlist');
        refresh();
        renderHeader();
      });
    });
  });
}
