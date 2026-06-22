import { appState, setState } from './store.js';
import { ApiService } from './api.js';
import { showToast } from './components/toast.js';
import * as Header from './components/Header.js';
import * as CategoryNav from './components/CategoryNav.js';
import * as AuthModal from './components/AuthModal.js';
import * as ChatWidget from './components/ChatWidget.js';
import * as HomePage from './pages/home/index.js';
import * as ProductDetailPage from './pages/product-detail/index.js';
import * as CartPage from './pages/cart/index.js';
import * as CheckoutPage from './pages/checkout/index.js';
import * as WishlistPage from './pages/wishlist/index.js';
import * as ProfilePage from './pages/profile/index.js';
import * as SupportPage from './pages/support/index.js';
import * as TicketDetailPage from './pages/ticket-detail/index.js';
import * as AdminPage from './pages/admin/index.js';

// Helpers passed to every page/component
export const helpers = {
  navigate(view, extra = {}) {
    setState({ currentView: view, authModalMode: null, isUserDropdownOpen: false, ...extra });
    renderAll();
  },
  refresh() { renderView(); },
  renderHeader,
  renderView,
  renderAuthModal,
  renderChatWidget,
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
}

export async function renderCategoryNav() {
  const container = document.getElementById('app-category-nav-container');
  if (!container) return;
  if (appState.currentView === 'home') {
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
      case 'admin':
        html = await AdminPage.render(appState);
        container.innerHTML = html;
        AdminPage.bindEvents(appState, helpers);
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

export async function renderChatWidget() {
  const container = document.getElementById('support-chat-widget-mount');
  if (!container) return;
  container.innerHTML = await ChatWidget.render();
  ChatWidget.bindEvents(helpers);
}

export async function renderAll() {
  const isAdmin = appState.currentView === 'admin';
  // Toggle admin-mode class — hides footer and chat widget on admin
  document.body.classList.toggle('admin-mode', isAdmin);
  await renderHeader().catch(console.error);
  await renderCategoryNav().catch(console.error);
  await renderView().catch(console.error);
  await renderAuthModal().catch(console.error);
  if (!isAdmin) {
    await renderChatWidget().catch(console.error);
  }
}

export function init() {
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

  renderAll();
}
