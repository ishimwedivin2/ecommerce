import './NotifDrawer.css';
import { ApiService } from '../api.js';

// ── state ─────────────────────────────────────────────────
let _open       = false;
let _tab        = 'all';      // 'all' | 'orders' | 'alerts'
let _items      = [];         // all notifications fetched
let _lowStock   = [];         // staff-only low-stock alerts
let _loaded     = false;      // have we fetched at least once?
let _navigate   = null;       // injected by bindEvents
let _toastContainer = null;

// ── helpers ───────────────────────────────────────────────

/** Human-readable relative time with exact clock time appended */
function relTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const s    = Math.floor(diff / 1000);

  // Exact clock time — always shown alongside the relative label
  const clock = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  if (s < 10)          return `just now · ${clock}`;
  if (s < 60)          return `${s}s ago · ${clock}`;
  const m = Math.floor(s / 60);
  if (m < 60)          return `${m}m ago · ${clock}`;
  const h = Math.floor(m / 60);
  if (h < 24)          return `${h}h ago · ${clock}`;
  const d = Math.floor(h / 24);
  const dateLabel = d === 1
    ? 'Yesterday'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${dateLabel} · ${clock}`;
}

/** Date group label for the sticky separator: "Today", "Yesterday", "Earlier" */
function dateGroup(dateStr) {
  if (!dateStr) return 'Earlier';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7)   return 'This Week';
  return 'Earlier';
}

/**
 * Classify a notification into a type based on its title/message.
 * Returns one of: order | payment | alert | cancelled | info
 */
function classifyType(n) {
  const text = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
  if (text.includes('cancel'))               return 'cancelled';
  if (text.includes('paid') || text.includes('payment') || text.includes('confirmed')) return 'payment';
  if (text.includes('order') || text.includes('processing') || text.includes('shipped') || text.includes('delivered')) return 'order';
  if (text.includes('stock') || text.includes('low') || text.includes('alert'))         return 'alert';
  return 'info';
}

/** Emoji icon per type */
function typeIcon(type) {
  return { order: '📦', payment: '✅', alert: '⚠️', cancelled: '❌', info: 'ℹ️' }[type] || 'ℹ️';
}

/** Build a low-stock item into the same shape as a regular notification */
function lowStockToNotif(item) {
  return {
    id:        'ls-' + item.id,
    title:     'Low Stock: ' + (item.productName || item.name || 'Item'),
    message:   `Only ${item.quantity} unit${item.quantity === 1 ? '' : 's'} left — reorder threshold: ${item.lowStockThreshold || 10}. SKU: ${item.sku || '—'}`,
    createdAt: null,
    read:      false,
    _type:     'alert',
    _isLowStock: true,
  };
}

/** Filter items by active tab */
function filterByTab(items, tab) {
  if (tab === 'all')    return items;
  if (tab === 'orders') return items.filter(n => {
    const t = n._type || classifyType(n);
    return t === 'order' || t === 'payment' || t === 'cancelled';
  });
  if (tab === 'alerts') return items.filter(n => {
    const t = n._type || classifyType(n);
    return t === 'alert' || t === 'info';
  });
  return items;
}

/** Insert sticky date-group separators between items that cross a day boundary */
function renderItemsWithGroups(items) {
  if (!items.length) return '';
  let html = '';
  let lastGroup = null;
  for (const n of items) {
    const group = n._isLowStock ? 'Inventory Alerts' : dateGroup(n.createdAt);
    if (group !== lastGroup) {
      html += `<div class="nd-date-group">${group}</div>`;
      lastGroup = group;
    }
    html += renderItem(n);
  }
  return html;
}

function renderItem(n) {
  const type    = n._type || classifyType(n);
  const icon    = typeIcon(type);
  const time    = n.createdAt ? relTime(n.createdAt) : '';
  const unread  = !n.read ? 'unread' : '';
  const dotHtml = !n.read ? `<span class="nd-unread-dot"></span>` : '';
  return `
    <div class="nd-item ${unread} type-${type}" data-notif-id="${n.id}" data-is-low-stock="${!!n._isLowStock}">
      <div class="nd-icon type-${type}">${icon}</div>
      <div class="nd-item-content">
        <div class="nd-item-title">${n.title || 'Notification'}</div>
        <div class="nd-item-msg">${n.message || ''}</div>
        <div class="nd-item-meta">
          ${time ? `<span class="nd-item-time">${time}</span>` : ''}
          ${dotHtml}
        </div>
      </div>
    </div>`;
}

function renderSkeleton() {
  return `<div class="nd-skeleton">${Array(5).fill(`
    <div class="nd-skeleton-item">
      <div class="nd-skel-icon"></div>
      <div class="nd-skel-lines">
        <div class="nd-skel-line"></div>
        <div class="nd-skel-line short"></div>
        <div class="nd-skel-line xshort"></div>
      </div>
    </div>`).join('')}</div>`;
}

function renderEmpty(tab) {
  const msgs = {
    all:    ['🔔', 'All caught up!',    'No notifications yet.'],
    orders: ['📦', 'No order updates',  'Order and payment notifications will appear here.'],
    alerts: ['✅', 'No alerts',         'Inventory and system alerts will appear here.'],
  };
  const [ico, title, sub] = msgs[tab] || msgs.all;
  return `<div class="nd-empty">
    <div class="nd-empty-ico">${ico}</div>
    <div class="nd-empty-title">${title}</div>
    <div class="nd-empty-sub">${sub}</div>
  </div>`;
}

// ── unread count helpers ───────────────────────────────────

function unreadCount(items) {
  return items.filter(n => !n.read).length;
}

function countByTab(all, tab) {
  return filterByTab(all, tab).length;
}

// ── HTML builder ──────────────────────────────────────────

function buildDrawerHtml(items, lowStock, tab, loading) {
  // Merge low-stock into items for display (already converted to notif shape)
  const lsNotifs  = lowStock.map(lowStockToNotif);
  const allItems  = [...items, ...lsNotifs];
  const displayed = filterByTab(allItems, tab);
  const unread    = unreadCount(allItems);

  const ordersCount = countByTab(allItems, 'orders');
  const alertsCount = countByTab(allItems, 'alerts');

  const bodyHtml = loading
    ? renderSkeleton()
    : displayed.length
      ? renderItemsWithGroups(displayed)
      : renderEmpty(tab);

  return `
  <div class="nd-overlay" id="nd-overlay">
    <div class="nd-drawer" id="nd-drawer">

      <!-- Header -->
      <div class="nd-header">
        <div class="nd-header-left">
          <span class="nd-title">Notifications</span>
          ${unread > 0 ? `<span class="nd-unread-pill">${unread} new</span>` : ''}
        </div>
        <div class="nd-header-actions">
          ${unread > 0 ? `<button class="nd-mark-read-btn" id="nd-mark-all">Mark all read</button>` : ''}
          <button class="nd-close-btn" id="nd-close" aria-label="Close notifications">✕</button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="nd-tabs">
        <button class="nd-tab ${tab === 'all'    ? 'active' : ''}" data-tab="all">
          All
          <span class="nd-tab-count">${allItems.length}</span>
        </button>
        <button class="nd-tab ${tab === 'orders' ? 'active' : ''}" data-tab="orders">
          Orders
          <span class="nd-tab-count">${ordersCount}</span>
        </button>
        <button class="nd-tab ${tab === 'alerts' ? 'active' : ''}" data-tab="alerts">
          Alerts
          ${alertsCount > 0 ? `<span class="nd-tab-count">${alertsCount}</span>` : ''}
        </button>
      </div>

      <!-- Body -->
      <div class="nd-body" id="nd-body">
        ${bodyHtml}
      </div>

      <!-- Footer -->
      <div class="nd-footer">
        <button class="nd-footer-link" id="nd-view-profile">
          View all in My Orders →
        </button>
      </div>

    </div>
  </div>`;
}

// ── public API ────────────────────────────────────────────

export function isOpen() { return _open; }

export function render() {
  if (!_open) return '';
  return buildDrawerHtml(_items, _lowStock, _tab, !_loaded);
}

export async function load() {
  const user  = ApiService.getCurrentUser();
  const roles = (user?.roles || []).map(r => (r?.name || r || '').toString());
  const isStaff = roles.some(r => r === 'ROLE_ADMIN' || r === 'ROLE_EMPLOYEE');

  const [notifRes, lowStockRes] = await Promise.allSettled([
    ApiService.notifications.getAll(),
    isStaff ? ApiService.inventory.getLowStock() : Promise.resolve(null),
  ]);

  _items    = notifRes.status === 'fulfilled' ? (notifRes.value?.data || []) : [];
  _lowStock = (lowStockRes.status === 'fulfilled' && lowStockRes.value)
    ? (Array.isArray(lowStockRes.value)
        ? lowStockRes.value
        : (lowStockRes.value?.data || lowStockRes.value?.content || []))
    : [];
  _loaded = true;
}

/** Call this to open the drawer and return the HTML to inject */
export async function open(navigateFn) {
  _open     = true;
  _navigate = navigateFn;
  // Return loading skeleton immediately, data is fetched separately
  return render();
}

export function close() {
  _open   = false;
  _loaded = false; // force re-fetch on next open
}

// ── bind events ───────────────────────────────────────────

export function bindEvents(rerenderFn) {
  // Close on overlay click (outside drawer)
  document.getElementById('nd-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'nd-overlay') rerenderFn(false);
  });

  // Close button
  document.getElementById('nd-close')?.addEventListener('click', () => rerenderFn(false));

  // Tab switches — re-render body only (no full re-render needed)
  document.querySelectorAll('.nd-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _tab = btn.dataset.tab;
      // Update tab active states
      document.querySelectorAll('.nd-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      // Re-render body
      const body = document.getElementById('nd-body');
      if (body) {
        const lsNotifs  = _lowStock.map(lowStockToNotif);
        const allItems  = [..._items, ...lsNotifs];
        const displayed = filterByTab(allItems, _tab);
        body.innerHTML  = displayed.length
          ? renderItemsWithGroups(displayed)
          : renderEmpty(_tab);
        bindItemClicks(rerenderFn);
      }
    });
  });

  // Mark all read
  document.getElementById('nd-mark-all')?.addEventListener('click', async () => {
    await ApiService.notifications.markAllRead();
    _items = _items.map(n => ({ ...n, read: true }));
    rerenderFn(true); // full re-render to update header pill + badge
  });

  // Footer — navigate to profile/orders
  document.getElementById('nd-view-profile')?.addEventListener('click', () => {
    rerenderFn(false);
    _navigate?.('profile', { activeSection: 'orders' });
  });

  bindItemClicks(rerenderFn);
}

function bindItemClicks(rerenderFn) {
  document.querySelectorAll('.nd-item[data-notif-id]').forEach(el => {
    el.addEventListener('click', async () => {
      const id          = el.dataset.notifId;
      const isLowStock  = el.dataset.isLowStock === 'true';

      // Mark read in-memory + remove unread styling
      if (!isLowStock) {
        _items = _items.map(n => n.id === id ? { ...n, read: true } : n);
        ApiService.notifications.markRead(id).catch(() => {});
      }
      el.classList.remove('unread');
      el.querySelector('.nd-unread-dot')?.remove();
      el.style.removeProperty('background');

      // Update header pill count
      _updateBellDot();

      // Navigate to relevant page if order-related
      const title = el.querySelector('.nd-item-title')?.textContent || '';
      if (!isLowStock && (title.toLowerCase().includes('order') || title.toLowerCase().includes('payment'))) {
        rerenderFn(false);
        _navigate?.('profile', { activeSection: 'orders' });
      }
      if (isLowStock) {
        rerenderFn(false);
        _navigate?.('admin', { activeAdminTab: 'inventory' });
      }
    });
  });
}

// ── bell dot sync ─────────────────────────────────────────

function _updateBellDot() {
  const lsNotifs  = _lowStock.map(lowStockToNotif);
  const allItems  = [..._items, ...lsNotifs];
  const unread    = unreadCount(allItems);

  // Bell dot
  const dot = document.getElementById('nd-bell-dot');
  if (dot) dot.style.display = unread > 0 ? 'block' : 'none';

  // Legacy badge (hidden now but keep in sync)
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent    = unread;
    badge.style.display  = 'none'; // always hidden — dot is used instead
  }
}

export function syncBellDot(items, lowStock) {
  _items    = items;
  _lowStock = lowStock;
  _updateBellDot();
}

// ── Real-time toast ───────────────────────────────────────

export function showNotifToast(title, message, type = 'info') {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'nd-toast-container';
    document.body.appendChild(_toastContainer);
  }

  const icon = typeIcon(type);
  const toast = document.createElement('div');
  toast.className = 'nd-toast';
  toast.innerHTML = `
    <div class="nd-toast-icon">${icon}</div>
    <div class="nd-toast-body">
      <div class="nd-toast-title">${title}</div>
      ${message ? `<div class="nd-toast-msg">${message}</div>` : ''}
    </div>
    <button class="nd-toast-close" aria-label="Dismiss">✕</button>`;

  _toastContainer.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 260);
  };

  toast.querySelector('.nd-toast-close').addEventListener('click', dismiss);
  setTimeout(dismiss, 5000);
}
