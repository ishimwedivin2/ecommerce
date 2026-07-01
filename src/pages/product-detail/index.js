import './style.css';
import { ApiService } from '../../api.js';
import { appState, setState } from '../../store.js';

function renderStars(rating) {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

export async function render(state) {
  const productRes = await ApiService.products.getById(state.selectedProductId);
  const reviewsRes = await ApiService.reviews.getByProduct(state.selectedProductId);
  const p = productRes.data;
  const reviews = reviewsRes.data || [];

  const reviewsHtml = reviews.length > 0 ? reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <span class="review-author">${r.author}</span>
        <span class="review-date">${r.date}</span>
      </div>
      <div class="product-rating">${renderStars(r.rating)}</div>
      <p class="review-comment">${r.comment}</p>
    </div>
  `).join('') : '<p style="color:var(--text-light);">No reviews yet. Be the first to write one!</p>';

  return `
    <div class="detail-layout">
      <div class="detail-img-container">
        <img src="${p.image}" alt="${p.name}" class="detail-img" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'">
      </div>
      <div class="detail-info">
        <div class="detail-sku-rating">
          <span class="product-sku">SKU: ${p.sku}</span>
          <div class="product-rating">${renderStars(p.rating || 4.5)} <span>(${p.reviewsCount || 10} reviews)</span></div>
        </div>
        <h1 class="detail-title">${p.name}</h1>
        <p class="detail-desc">${p.description}</p>
        <div class="detail-price-box">
          <span class="price-current" style="font-size:32px;">RWF ${Math.round((parseFloat(p.price)||0) * 1.18).toLocaleString('en-US')}</span>
        </div>
        <div class="detail-actions">
          <div class="quantity-control">
            <button class="quantity-btn" id="qty-minus">-</button>
            <input type="text" class="quantity-value" id="qty-input" value="1">
            <button class="quantity-btn" id="qty-plus">+</button>
          </div>
          ${(() => {
            const qty = p.inventoryItem?.quantity ?? p.stock ?? null;
            const outOfStock = qty !== null && qty <= 0;
            return outOfStock
              ? `<button class="btn-primary" disabled style="flex:1;justify-content:center;height:42px;opacity:.5;cursor:not-allowed;">Out of Stock</button>`
              : `<button class="btn-primary" id="btn-detail-add" data-id="${p.id}" style="flex:1;justify-content:center;height:42px;">Add to Cart</button>`;
          })()}
          <button class="wishlist-toggle" id="btn-detail-wishlist" data-id="${p.id}" style="position:static;box-shadow:none;border:1px solid var(--border);">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="detail-tabs-container">
      <div class="detail-tabs">
        <button class="detail-tab-btn active" id="tab-reviews">Customer Reviews (${reviews.length})</button>
        <button class="detail-tab-btn" id="tab-specifications">Specifications</button>
      </div>
      <div class="detail-tab-content">
        <div class="reviews-section">
          <div class="reviews-list">${reviewsHtml}</div>
          <form class="review-form" id="review-submission-form">
            <h3>Submit a Review</h3>
            <div class="auth-form-group">
              <label>Rating</label>
              <select id="review-rating" style="width:120px;">
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
            <div class="auth-form-group">
              <label>Comment</label>
              <textarea id="review-comment" rows="3" placeholder="Write your review here..."></textarea>
            </div>
            <button class="btn-primary" type="submit" style="width:fit-content;">Submit Review</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { renderHeader, refresh, toast, openCartDrawer } = helpers;

  function checkAuth(cb) {
    if (!ApiService.getCurrentUser()) {
      toast('Please sign in to proceed');
      setState({ authModalMode: 'login' });
      helpers.renderAuthModal();
      return;
    }
    cb();
  }

  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
  });

  document.getElementById('btn-detail-add')?.addEventListener('click', () => {
    const pid = document.getElementById('btn-detail-add').getAttribute('data-id');
    const qty = parseInt(qtyInput ? qtyInput.value : 1);
    checkAuth(async () => {
      await ApiService.cart.addItem(pid, qty);
      toast('Product added to cart!');
      renderHeader();
      openCartDrawer?.();
    });
  });

  document.getElementById('review-submission-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rating = parseInt(document.getElementById('review-rating').value);
    const comment = document.getElementById('review-comment').value;
    checkAuth(async () => {
      await ApiService.reviews.submit(state.selectedProductId, rating, comment);
      toast('Review submitted successfully!');
      refresh();
    });
  });
}
