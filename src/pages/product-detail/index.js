import './style.css';
import { ApiService } from '../../api.js';
import { appState, setState } from '../../store.js';

const BACKEND_URL = 'http://localhost:8080';

function renderStars(rating) {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}

function getPrimaryImage(product) {
  if (!product) return '';
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find(i => i.isPrimary || i.primary) || product.images[0];
    const url = primary?.url || '';
    return url.startsWith('/uploads/') ? `${BACKEND_URL}${url}` : url;
  }
  const url = product.image || '';
  return url.startsWith('/uploads/') ? `${BACKEND_URL}${url}` : url;
}

function renderRecommendationCard(product) {
  const image = getPrimaryImage(product);
  const price = Math.round(Number(product.discountedPriceIncludingTax ?? product.priceIncludingTax ?? product.price ?? 0));
  const category = product.category?.name || product.categoryName || '';
  const fallback = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80';

  return `
    <article class="detail-rec-card">
      <button class="detail-rec-image" data-action="view-rec-detail" data-id="${product.id}">
        <img src="${image || fallback}" alt="${product.name}" onerror="this.onerror=null;this.src='${fallback}'">
      </button>
      <div class="detail-rec-body">
        ${category ? `<span class="detail-rec-category">${category}</span>` : ''}
        <button class="detail-rec-title" data-action="view-rec-detail" data-id="${product.id}">${product.name}</button>
        <div class="product-rating">${renderStars(product.averageRating || product.rating || 4.5)} <span>(${product.reviewsCount || 0})</span></div>
        <div class="detail-rec-footer">
          <span class="detail-rec-price">RWF ${price.toLocaleString('en-US')}</span>
          <button class="detail-rec-cart" data-action="add-rec-cart" data-id="${product.id}">Add</button>
        </div>
      </div>
    </article>
  `;
}

export async function render(state) {
  if (!state.selectedProductId) {
    return `
      <div class="detail-empty-state">
        <h2>Product not selected</h2>
        <p>Choose a product from the shop to view its details.</p>
        <button class="btn-primary" id="btn-detail-back-shop">Browse Products</button>
      </div>
    `;
  }

  const recommendationRequest = ApiService.getCurrentUser()
    ? ApiService.wishlist.getRecommendations(8).catch(() => ({ data: [] }))
    : Promise.resolve({ data: [] });

  let productRes;
  let reviewsRes;
  let recsRes;
  try {
    [productRes, reviewsRes, recsRes] = await Promise.all([
      ApiService.products.getById(state.selectedProductId),
      ApiService.reviews.getByProduct(state.selectedProductId).catch(() => ({ data: [] })),
      recommendationRequest,
    ]);
  } catch (error) {
    return `
      <div class="detail-empty-state">
        <h2>Product unavailable</h2>
        <p>${error.message || 'This product could not be loaded right now.'}</p>
        <button class="btn-primary" id="btn-detail-back-shop">Back to Shop</button>
      </div>
    `;
  }

  const p = productRes.data;
  if (!p) {
    return `
      <div class="detail-empty-state">
        <h2>Product unavailable</h2>
        <p>This product could not be found.</p>
        <button class="btn-primary" id="btn-detail-back-shop">Back to Shop</button>
      </div>
    `;
  }
  const reviews = reviewsRes.data || [];
  const recommendations = (Array.isArray(recsRes.data) ? recsRes.data : [])
    .filter(item => item.id !== p.id)
    .slice(0, 4);

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
        <img src="${getPrimaryImage(p)}" alt="${p.name}" class="detail-img" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'">
      </div>
      <div class="detail-info">
        <div class="detail-sku-rating">
          <span class="product-sku">SKU: ${p.sku}</span>
          <div class="product-rating">${renderStars(p.rating || 4.5)} <span>(${p.reviewsCount || 10} reviews)</span></div>
        </div>
        <h1 class="detail-title">${p.name}</h1>
        <p class="detail-desc">${p.description}</p>
        <div class="detail-price-box">
          <span class="price-current" style="font-size:32px;">RWF ${Math.round(Number(p.discountedPriceIncludingTax ?? p.priceIncludingTax ?? p.price ?? 0)).toLocaleString('en-US')}</span>
          ${Number(p.taxRate || 0) > 0 ? `<div style="color:#10b981;font-size:13px;font-weight:700;margin-top:6px;">✓ VAT Included</div>` : ''}
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

    ${recommendations.length ? `
      <section class="detail-recommendations">
        <div class="detail-rec-header">
          <div>
            <h2>You might also like</h2>
            <p>Personalized picks from your wishlist and order interests</p>
          </div>
        </div>
        <div class="detail-rec-grid">${recommendations.map(renderRecommendationCard).join('')}</div>
      </section>
    ` : ''}
  `;
}

export function bindEvents(state, helpers) {
  const { renderHeader, refresh, toast, openCartDrawer, navigate } = helpers;

  document.getElementById('btn-detail-back-shop')?.addEventListener('click', () => {
    navigate('shop');
  });

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

  document.getElementById('btn-detail-wishlist')?.addEventListener('click', () => {
    const pid = document.getElementById('btn-detail-wishlist').getAttribute('data-id');
    checkAuth(async () => {
      try {
        const isWishRes = await ApiService.wishlist.check(pid);
        if (isWishRes.data) {
          await ApiService.wishlist.remove(pid);
          document.getElementById('btn-detail-wishlist')?.classList.remove('active');
          toast('Removed from Wishlist');
        } else {
          await ApiService.wishlist.add(pid);
          document.getElementById('btn-detail-wishlist')?.classList.add('active');
          toast('Added to Wishlist!');
        }
        renderHeader();
      } catch (err) {
        toast(err.message || 'Wishlist error');
      }
    });
  });

  if (ApiService.getCurrentUser()) {
    const wishBtn = document.getElementById('btn-detail-wishlist');
    const pid = wishBtn?.getAttribute('data-id');
    if (pid) {
      ApiService.wishlist.check(pid)
        .then(res => { if (res.data) wishBtn.classList.add('active'); })
        .catch(() => {});
    }
  }

  document.querySelectorAll('[data-action="view-rec-detail"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigate('product-detail', { selectedProductId: btn.getAttribute('data-id') });
    });
  });

  document.querySelectorAll('[data-action="add-rec-cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkAuth(async () => {
        await ApiService.cart.addItem(btn.getAttribute('data-id'), 1);
        toast('Product added to cart!');
        renderHeader();
        openCartDrawer?.();
      });
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
