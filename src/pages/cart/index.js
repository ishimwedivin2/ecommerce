import './style.css';
import { ApiService } from '../../api.js';

const BACKEND_URL = 'http://localhost:8080';

function itemImg(item) {
  const raw = item.imageUrl || item.productImage || '';
  return raw.startsWith('/uploads/') ? BACKEND_URL + raw : raw;
}

export async function render() {
  const cartRes = await ApiService.cart.get();
  const cart = cartRes.data;

  if (!cart.items || cart.items.length === 0) {
    return `
      <div class="empty-state">
        <svg width="64" height="64" fill="none" stroke="var(--slate-300)" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2.2l2.1 10.1a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H7.4"></path><path stroke-linecap="round" d="M9.5 10h9"></path><path stroke-linecap="round" d="M10.2 12.8h7.8"></path><circle cx="9" cy="20" r="1.6"></circle><circle cx="17" cy="20" r="1.6"></circle></svg>
        <h2>Your Cart is Empty</h2>
        <p>Browse our products to find best deals and add items to your cart.</p>
        <button class="btn-primary" id="btn-back-shopping">Back to Shopping</button>
      </div>
    `;
  }

  const itemsHtml = cart.items.map(item => {
    const price = Number(item.unitPrice ?? item.productPrice ?? 0);
    const src = itemImg(item);
    return `
    <div class="cart-item" data-id="${item.productId}">
      <div class="cart-item-img-box">
        ${src
          ? `<img src="${src}" alt="${item.productName}" class="cart-item-img" onerror="this.style.display='none'">`
          : `<div class="cart-item-img" style="background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:24px;">📦</div>`
        }
      </div>
      <div class="cart-item-name">${item.productName}</div>
      <div class="cart-item-price">RWF ${Math.round(price * 1.18).toLocaleString('en-US')}</div>
      <div class="quantity-control" style="transform:scale(0.9);">
        <button class="quantity-btn" data-action="cart-qty-minus" data-id="${item.productId}">-</button>
        <input type="text" class="quantity-value" value="${item.quantity}">
        <button class="quantity-btn" data-action="cart-qty-plus" data-id="${item.productId}">+</button>
      </div>
      <button class="cart-item-remove" data-action="cart-remove" data-id="${item.productId}">
        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    </div>
  `;
  }).join('');

  const subtotal = Number(cart.totalPrice ?? cart.totalAmount ?? 0);
  const TAX_RATE = 0.18;
  const taxAmt   = subtotal * TAX_RATE;
  const total    = subtotal + taxAmt;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <h2 style="margin:0;">Shopping Cart</h2>
      <button class="btn-secondary" id="btn-clear-cart" style="color:var(--danger,#ef4444);border-color:var(--danger,#ef4444);">Clear Cart</button>
    </div>
    <div class="cart-layout">
      <div class="cart-items-container">${itemsHtml}</div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row"><span>Items (${cart.totalItems})</span><span>RWF ${Math.round(total).toLocaleString('en-US')}</span></div>
        <div class="summary-row"><span>Shipping</span><span style="color:var(--success);font-weight:600;">FREE</span></div>
        <div class="summary-row total" style="border-top:2px solid var(--border);padding-top:12px;margin-top:4px;">
          <span>Total</span>
          <span>RWF ${Math.round(total).toLocaleString('en-US')}</span>
        </div>
        <button class="btn-primary" id="btn-proceed-checkout" style="justify-content:center;">Proceed to Checkout</button>
      </div>
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, refresh, renderHeader, toast } = helpers;

  document.getElementById('btn-back-shopping')?.addEventListener('click', () => navigate('shop'));

  document.getElementById('btn-proceed-checkout')?.addEventListener('click', () => {
    if (!ApiService.getCurrentUser()) {
      toast('Please sign in to checkout');
      return;
    }
    navigate('checkout');
  });

  document.getElementById('btn-clear-cart')?.addEventListener('click', async () => {
    await ApiService.cart.clear();
    toast('Cart cleared');
    refresh();
    renderHeader();
  });

  const container = document.getElementById('app-view-container');

  container?.querySelectorAll('[data-action="cart-qty-minus"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.getAttribute('data-id');
      const input = btn.nextElementSibling;
      const newQty = Math.max(1, parseInt(input.value) - 1);
      await ApiService.cart.updateQuantity(pid, newQty);
      refresh();
      renderHeader();
    });
  });

  container?.querySelectorAll('[data-action="cart-qty-plus"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.getAttribute('data-id');
      const input = btn.previousElementSibling;
      const newQty = parseInt(input.value) + 1;
      await ApiService.cart.updateQuantity(pid, newQty);
      refresh();
      renderHeader();
    });
  });

  container?.querySelectorAll('[data-action="cart-remove"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.getAttribute('data-id');
      try {
        await ApiService.cart.removeItem(pid);
        toast('Item removed from cart');
        refresh();
        renderHeader();
      } catch (err) {
        toast('Failed to remove item', 'error');
      }
    });
  });
}
