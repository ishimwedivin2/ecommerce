import './CartDrawer.css';
import { ApiService } from '../api.js';
import { appState, setState } from '../store.js';

const BACKEND_URL = 'http://localhost:8080';

function money(value) {
  return `RWF ${Math.round(Number(value || 0)).toLocaleString('en-US')}`;
}

function itemImg(item) {
  const raw = item.imageUrl || item.productImage || '';
  return raw.startsWith('/uploads/') ? BACKEND_URL + raw : raw;
}

function closeDrawer(renderCartDrawer) {
  setState({ isCartDrawerOpen: false });
  renderCartDrawer();
}

export async function render() {
  if (!appState.isCartDrawerOpen) return '';

  const user = ApiService.getCurrentUser();
  if (!user) {
    return `
      <div class="cart-drawer-overlay" id="cart-drawer-overlay">
        <aside class="cart-drawer" aria-label="Shopping cart">
          <div class="cart-drawer-header">
            <div class="cart-drawer-title">
              <strong>Your Cart</strong>
              <span>Sign in to view saved items</span>
            </div>
            <button class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">x</button>
          </div>
          <div class="cart-drawer-empty">
            <h3>Please sign in</h3>
            <p>Your cart is linked to your Luz Technology account.</p>
            <button class="btn-primary" id="cart-drawer-signin">Sign In</button>
          </div>
        </aside>
      </div>`;
  }

  let cart = { items: [], totalItems: 0, totalAmount: 0 };
  try {
    const cartRes = await ApiService.cart.get();
    cart = cartRes.data || cart;
  } catch (err) {
    return `
      <div class="cart-drawer-overlay" id="cart-drawer-overlay">
        <aside class="cart-drawer" aria-label="Shopping cart">
          <div class="cart-drawer-header">
            <div class="cart-drawer-title">
              <strong>Your Cart</strong>
              <span>Could not load cart</span>
            </div>
            <button class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">x</button>
          </div>
          <div class="cart-drawer-empty">
            <h3>Cart unavailable</h3>
            <p>${err.message || 'Please try again in a moment.'}</p>
          </div>
        </aside>
      </div>`;
  }

  const items = cart.items || [];
  const productTotal = Number(cart.totalAmount ?? cart.totalPrice ?? 0);
  const total = productTotal * 1.18;

  const bodyHtml = items.length ? items.map(item => {
    const price = Number(item.unitPrice ?? item.productPrice ?? 0) * 1.18;
    const src = itemImg(item);
    return `
      <div class="cart-drawer-item" data-id="${item.productId}">
        <div class="cart-drawer-imgbox">
          ${src
            ? `<img src="${src}" alt="${item.productName}" class="cart-drawer-img" onerror="this.style.display='none'">`
            : `<div class="cart-drawer-img" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;">Box</div>`}
        </div>
        <div class="cart-drawer-item-main">
          <div class="cart-drawer-name">${item.productName}</div>
          <div class="cart-drawer-price">${money(price)}</div>
          <div class="cart-drawer-controls">
            <div class="cart-drawer-qty">
              <button data-action="cart-drawer-minus" data-id="${item.productId}" aria-label="Decrease quantity">-</button>
              <span>${item.quantity}</span>
              <button data-action="cart-drawer-plus" data-id="${item.productId}" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-drawer-remove" data-action="cart-drawer-remove" data-id="${item.productId}">Remove item</button>
          </div>
        </div>
      </div>`;
  }).join('') : `
    <div class="cart-drawer-empty">
      <h3>Your cart is empty</h3>
      <p>Add a product and your cart will stay open beside the store.</p>
      <button class="btn-primary" id="cart-drawer-shop">Continue Shopping</button>
    </div>`;

  return `
    <div class="cart-drawer-overlay" id="cart-drawer-overlay">
      <aside class="cart-drawer" aria-label="Shopping cart">
          <div class="cart-drawer-header">
            <div class="cart-drawer-title">
              <strong>Your Cart</strong>
              <span>${cart.totalItems || 0} item${(cart.totalItems || 0) === 1 ? '' : 's'} ready for checkout</span>
            </div>
            <div class="cart-drawer-header-actions">
              ${items.length ? `<button class="cart-drawer-clear" id="cart-drawer-clear">Clear Cart</button>` : ''}
              <button class="cart-drawer-close" id="cart-drawer-close" aria-label="Close cart">x</button>
            </div>
          </div>
        <div class="cart-drawer-body">${bodyHtml}</div>
        ${items.length ? `
          <div class="cart-drawer-footer">
            <div class="cart-drawer-summary">
              <div class="cart-drawer-row"><span>Shipping</span><strong style="color:var(--success);">FREE</strong></div>
              <div class="cart-drawer-row total"><span>Total</span><span>${money(total)}</span></div>
            </div>
            <div class="cart-drawer-actions">
              <button class="btn-primary" id="cart-drawer-checkout">Checkout</button>
              <button class="btn-secondary" id="cart-drawer-continue">Continue Shopping</button>
            </div>
          </div>` : ''}
      </aside>
    </div>`;
}

export function bindEvents(helpers) {
  const { navigate, renderCartDrawer, renderHeader, renderAuthModal, syncUrl, toast } = helpers;

  document.getElementById('cart-drawer-close')?.addEventListener('click', () => closeDrawer(renderCartDrawer));
  document.getElementById('cart-drawer-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cart-drawer-overlay') closeDrawer(renderCartDrawer);
  });

  document.getElementById('cart-drawer-signin')?.addEventListener('click', () => {
    closeDrawer(renderCartDrawer);
    syncUrl?.({ authModalMode: 'login' });
    renderAuthModal();
  });

  const continueShopping = () => {
    closeDrawer(renderCartDrawer);
    if (appState.currentView === 'cart' || appState.currentView === 'checkout') navigate('shop');
  };
  document.getElementById('cart-drawer-continue')?.addEventListener('click', continueShopping);
  document.getElementById('cart-drawer-shop')?.addEventListener('click', continueShopping);

  document.getElementById('cart-drawer-checkout')?.addEventListener('click', () => {
    closeDrawer(renderCartDrawer);
    navigate('checkout');
  });

  document.querySelectorAll('[data-action="cart-drawer-minus"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.dataset.id;
      const current = Number(btn.nextElementSibling?.textContent || 1);
      await ApiService.cart.updateQuantity(pid, Math.max(1, current - 1));
      await renderCartDrawer();
      await renderHeader();
    });
  });

  document.querySelectorAll('[data-action="cart-drawer-plus"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.dataset.id;
      const current = Number(btn.previousElementSibling?.textContent || 1);
      await ApiService.cart.updateQuantity(pid, current + 1);
      await renderCartDrawer();
      await renderHeader();
    });
  });

  document.querySelectorAll('[data-action="cart-drawer-remove"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await ApiService.cart.removeItem(btn.dataset.id);
        toast('Item removed from cart');
        await renderCartDrawer();
        await renderHeader();
      } catch (err) {
        toast(err.message || 'Failed to remove item', 'error');
      }
    });
  });

  document.getElementById('cart-drawer-clear')?.addEventListener('click', async () => {
    try {
      await ApiService.cart.clear();
      toast('Cart cleared');
      await renderCartDrawer();
      await renderHeader();
    } catch (err) {
      toast(err.message || 'Failed to clear cart', 'error');
    }
  });
}
