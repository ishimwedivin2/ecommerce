import { appState, setState } from './store.js';
import { ApiService } from './api.js';
import { showToast } from './components/toast.js';
import * as SessionGuard from './components/SessionGuard.js';
import * as Header from './components/Header.js';
import * as CategoryNav from './components/CategoryNav.js';
import * as AuthModal from './components/AuthModal.js';
import * as ChatWidget from './components/ChatWidget.js';
import * as CartDrawer from './components/CartDrawer.js';
import * as HomePage from './pages/home/index.js';
import * as ProductDetailPage from './pages/product-detail/index.js';
import * as CartPage from './pages/cart/index.js';
import * as CheckoutPage from './pages/checkout/index.js';
import * as WishlistPage from './pages/wishlist/index.js';
import * as ProfilePage from './pages/profile/index.js';
import * as SupportPage from './pages/support/index.js';
import * as TicketDetailPage from './pages/ticket-detail/index.js';
import * as AdminPage from './pages/admin/index.js';
import * as SupportAgentPage from './pages/support-agent/index.js';
import * as EmployeePage from './pages/employee/index.js';
import * as ShopPage from './pages/shop/index.js';

// Helpers passed to every page/component
export const helpers = {
  navigate(view, extra = {}) {
    if (view === 'cart') {
      setState({ isCartDrawerOpen: true, ...extra });
      renderCartDrawer();
      return;
    }
    setState({ currentView: view, authModalMode: null, isUserDropdownOpen: false, ...extra });
    renderAll();
  },
  refresh() { renderView(); },
  renderHeader,
  renderView,
  renderAuthModal,
  renderChatWidget,
  renderCartDrawer,
  openCartDrawer,
  renderAll,
  toast: showToast,
};

// Helpers also expose renderAuthModal for AuthModal/Header cross-calls
helpers.renderAuthModal = renderAuthModal;

export async function renderHeader() {
  const container = document.getElementById('app-header-container');
  if (!container) return;
  container.innerHTML = await Header.render();
  Header.bindEvents(helpers);
  bindHeaderHeightEvents(container);
  updateAdminHeaderHeight();
}

export async function renderCategoryNav() {
  const container = document.getElementById('app-category-nav-container');
  if (!container) return;
  if (appState.currentView === 'home' || appState.currentView === 'shop') {
    container.style.display = 'block';
    try {
      container.innerHTML = await CategoryNav.render();
      CategoryNav.bindEvents(helpers);
    } catch (e) {
      console.error('CategoryNav render failed:', e);
      container.innerHTML = '';
    }
  } else {
    container.style.display = 'none';
  }
}

export async function renderView() {
  const container = document.getElementById('app-view-container');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center;padding:48px;font-weight:500;">Loading...</div>`;

  try {
    let html = '';
    switch (appState.currentView) {
      case 'home':
        html = await HomePage.render(appState);
        container.innerHTML = html;
        HomePage.bindEvents(appState, helpers);
        break;
      case 'product-detail':
        html = await ProductDetailPage.render(appState);
        container.innerHTML = html;
        ProductDetailPage.bindEvents(appState, helpers);
        break;
      case 'cart':
        html = await CartPage.render(appState);
        container.innerHTML = html;
        CartPage.bindEvents(appState, helpers);
        break;
      case 'checkout':
        html = await CheckoutPage.render(appState);
        container.innerHTML = html;
        CheckoutPage.bindEvents(appState, helpers);
        break;
      case 'wishlist':
        html = await WishlistPage.render(appState);
        container.innerHTML = html;
        WishlistPage.bindEvents(appState, helpers);
        break;
      case 'profile':
        html = await ProfilePage.render(appState);
        container.innerHTML = html;
        ProfilePage.bindEvents(appState, helpers);
        break;
      case 'support':
        html = await SupportPage.render(appState);
        container.innerHTML = html;
        SupportPage.bindEvents(appState, helpers);
        break;
      case 'ticket-detail':
        html = await TicketDetailPage.render(appState);
        container.innerHTML = html;
        TicketDetailPage.bindEvents(appState, helpers);
        break;
      case 'shop':
        html = await ShopPage.render(appState);
        container.innerHTML = html;
        ShopPage.bindEvents(appState, helpers);
        break;
      case 'admin':
        html = await AdminPage.render(appState);
        container.innerHTML = html;
        AdminPage.bindEvents(appState, helpers);
        break;
      case 'support-agent':
        html = await SupportAgentPage.render(appState);
        container.innerHTML = html;
        SupportAgentPage.bindEvents(appState, helpers);
        break;
      case 'employee':
        html = await EmployeePage.render(appState);
        container.innerHTML = html;
        EmployeePage.bindEvents(appState, helpers);
        break;
      default:
        container.innerHTML = `<div style="text-align:center;padding:48px;"><h2>Page Not Found</h2></div>`;
    }
  } catch (error) {
    console.error('Render error:', error);
    container.innerHTML = `
      <div style="text-align:center;padding:48px;border:1px dashed var(--border);border-radius:12px;background:white;">
        <h2 style="color:var(--danger);">Something went wrong</h2>
        <p style="margin:12px 0 20px;">${error.message || 'An unexpected error occurred.'}</p>
        <button class="btn-primary" id="btn-reload-home">Return to Home</button>
      </div>
    `;
    document.getElementById('btn-reload-home')?.addEventListener('click', () => {
      setState({ currentView: 'home', activeCategory: null, searchQuery: '' });
      renderAll();
    });
  }
}

export async function renderAuthModal() {
  const container = document.getElementById('auth-modal-mount');
  if (!container) return;

  if (appState.authModalMode) {
    const existing = document.getElementById('auth-overlay');
    if (existing && existing.getAttribute('data-modal-mode') === appState.authModalMode) return;
    container.innerHTML = AuthModal.render(appState.authModalMode);
    document.getElementById('auth-overlay')?.setAttribute('data-modal-mode', appState.authModalMode);
    AuthModal.bindEvents(helpers);
  } else {
    container.innerHTML = '';
  }
}

export async function renderChatWidget(options = {}) {
  const container = document.getElementById('support-chat-widget-mount');
  if (!container) return;
  container.innerHTML = await ChatWidget.render(options);
  ChatWidget.bindEvents(helpers);
}

export async function renderCartDrawer() {
  const container = document.getElementById('cart-drawer-mount');
  if (!container) return;
  container.innerHTML = await CartDrawer.render();
  CartDrawer.bindEvents(helpers);
}

export async function openCartDrawer() {
  setState({ isCartDrawerOpen: true });
  await renderCartDrawer();
}

export async function renderAll() {
  const staffViews = ['admin', 'support-agent', 'employee'];
  const isAdmin = staffViews.includes(appState.currentView);
  // Toggle admin-mode class — hides footer and chat widget on staff dashboards
  document.body.classList.toggle('admin-mode', isAdmin);
  await renderHeader().catch(console.error);
  updateAdminHeaderHeight();

  const tasks = [
    renderCategoryNav().catch(console.error),
    renderView().catch(console.error),
    renderAuthModal().catch(console.error),
    renderCartDrawer().catch(console.error),
  ];
  if (!isAdmin) {
    tasks.push(renderChatWidget().catch(console.error));
  } else {
    const chatMount = document.getElementById('support-chat-widget-mount');
    if (chatMount) chatMount.innerHTML = '';
  }
  await Promise.all(tasks);
  updateAdminHeaderHeight();
}

function updateAdminHeaderHeight() {
  const headerEl = document.getElementById('app-header-container');
  if (!headerEl) return;

  const height = headerEl.getBoundingClientRect().height;
  if (height > 0) {
    document.documentElement.style.setProperty('--admin-header-h', `${Math.ceil(height)}px`);
  }
}

function bindHeaderHeightEvents(container) {
  const closeBtn = container.querySelector('.promo-banner-close');
  closeBtn?.addEventListener('click', () => {
    requestAnimationFrame(updateAdminHeaderHeight);
  });
}

export function init() {
  // Start session guard if user is already logged in
  if (ApiService.getCurrentUser()) SessionGuard.start();

  // Restart guard after successful login (AuthModal fires this)
  window.addEventListener('luz-login', () => SessionGuard.start());
  // Stop guard on logout
  window.addEventListener('luz-logout', () => SessionGuard.stop());

  // Global chat-updated event
  window.addEventListener('chat-updated', async (e) => {
    const panel = document.getElementById('support-chat-panel');
    if (panel && panel.style.display === 'flex') {
      const messagesRes = await ApiService.chat.getMessages(e.detail);
      const messages = messagesRes.data || [];
      const msgContainer = document.getElementById('live-chat-messages-container');
      if (msgContainer) {
        msgContainer.innerHTML = messages.map(m => {
          const isMe = m.senderId === ApiService.getCurrentUser()?.id;
          return `<div class="chat-bubble ${isMe ? 'sent' : 'received'}">${m.message}</div>`;
        }).join('');
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }
    }
  });

  window.addEventListener('ticket-updated', async (e) => {
    if (appState.currentView === 'ticket-detail' && appState.selectedTicketId === e.detail) {
      renderView();
    }
  });

  window.addEventListener('resize', updateAdminHeaderHeight);

  renderAll();
}
