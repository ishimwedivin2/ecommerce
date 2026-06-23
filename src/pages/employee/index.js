import '../admin/style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

let _activeTab = 'orders';
let _orderCache = [];
let _returnCache = [];

const ICONS = {
  orders:   `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
  returns:  `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>`,
  profile:  `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
};

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];

function fmtMoney(n) { return 'RWF ' + Math.round(Number(n||0)).toLocaleString('en-US'); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}
function statusBadge(s) {
  const map = { PENDING:'#f59e0b', CONFIRMED:'#3b82f6', PROCESSING:'#8b5cf6', SHIPPED:'#0ea5e9', DELIVERED:'#10b981', CANCELLED:'#ef4444' };
  const c = map[s] || '#6b7280';
  return `<span style="background:${c}22;color:${c};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${s}</span>`;
}

function buildOrderRows(orders) {
  return orders.map(o => `
    <tr>
      <td style="font-size:11px;color:#94a3b8;">${o.orderNumber||'—'}</td>
      <td>${o.customerName || (o.customer?.firstName||'') + ' ' + (o.customer?.lastName||'')}</td>
      <td>${fmtMoney(o.totalAmount)}</td>
      <td>${statusBadge(o.status)}</td>
      <td style="font-size:12px;color:#64748b;">${fmtDate(o.createdAt)}</td>
      <td>
        <select class="dash-filter-select" data-action="emp-update-status" data-id="${o.id}" style="font-size:12px;padding:4px 8px;">
          ${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('');
}

function buildOrdersTab(orders) {
  return `
    <div class="dash-section-header">
      <h3>Orders</h3>
      <div style="display:flex;gap:8px;">
        <input id="emp-order-search" class="dash-search-input" placeholder="Search order # or customer…" style="width:220px;">
        <select id="emp-order-status" class="dash-filter-select">
          <option value="">All Status</option>
          ${ORDER_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr>
          <th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Update Status</th>
        </tr></thead>
        <tbody id="emp-orders-tbody">
          ${buildOrderRows(orders)}
        </tbody>
      </table>
    </div>
  `;
}

function buildReturnsTab(returns) {
  if (!returns.length) return `<div class="dash-empty">No return requests.</div>`;
  return `
    <div class="dash-section-header"><h3>Return Requests</h3></div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr>
          <th>Return #</th><th>Order</th><th>Customer</th><th>Reason</th><th>Status</th><th>Date</th>
        </tr></thead>
        <tbody>
          ${returns.map(r => `
            <tr>
              <td style="font-size:11px;color:#94a3b8;">#${(r.id||'').toString().slice(0,8)}</td>
              <td style="font-size:12px;">${r.orderNumber||'—'}</td>
              <td>${r.customerName||'—'}</td>
              <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;">${r.reason||'—'}</td>
              <td>${statusBadge(r.status||'PENDING')}</td>
              <td style="font-size:12px;color:#64748b;">${fmtDate(r.createdAt)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function buildProfileTab() {
  const user = ApiService.getCurrentUser() || {};
  return `
    <div class="dash-section-header"><h3>My Profile</h3></div>
    <div style="background:white;border-radius:12px;padding:28px;max-width:420px;border:1px solid #e2e8f0;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="width:56px;height:56px;border-radius:50%;background:#3b82f6;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700;">
          ${(user.firstName||'E')[0]}
        </div>
        <div>
          <div style="font-weight:700;font-size:16px;">${user.firstName||''} ${user.lastName||''}</div>
          <div style="font-size:13px;color:#64748b;">Employee</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;">
        <div><span style="color:#64748b;width:80px;display:inline-block;">Email</span>${user.email||'—'}</div>
        <div><span style="color:#64748b;width:80px;display:inline-block;">Phone</span>${user.phoneNumber||'—'}</div>
      </div>
    </div>
  `;
}

export async function render(state) {
  _activeTab = 'orders';
  const user = ApiService.getCurrentUser();
  return `
    <div class="dash-root" id="emp-root">
      <aside class="dash-sidebar" id="emp-sidebar">
        <div class="dash-sidebar-header">
          <div class="dash-sidebar-logo" style="background:#3b82f6;">E</div>
          <div class="dash-sidebar-brand">
            Employee Portal
            <span>${user?.firstName||'Employee'} ${user?.lastName||''}</span>
          </div>
        </div>
        <div class="dash-sidebar-section">
          <div class="dash-sidebar-label">Menu</div>
          <button class="dash-nav-item active" data-emp-tab="orders">${ICONS.orders}<span class="dash-nav-label">Orders</span></button>
          <button class="dash-nav-item" data-emp-tab="returns">${ICONS.returns}<span class="dash-nav-label">Returns</span></button>
          <button class="dash-nav-item" data-emp-tab="profile">${ICONS.profile}<span class="dash-nav-label">My Profile</span></button>
        </div>
        <div style="margin-top:auto;padding:12px 14px;">
          <button class="dash-nav-item" id="emp-logout" style="color:#ef4444;">
            <svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span class="dash-nav-label">Logout</span>
          </button>
        </div>
      </aside>
      <main class="dash-content" id="emp-content">
        <div class="dash-content-inner" id="emp-tab-body">
          <div style="text-align:center;padding:48px;color:#94a3b8;">Loading orders…</div>
        </div>
      </main>
    </div>
  `;
}

async function loadTab(tab) {
  _activeTab = tab;
  const body = document.getElementById('emp-tab-body');
  if (!body) return;
  body.innerHTML = `<div style="text-align:center;padding:48px;color:#94a3b8;">Loading…</div>`;
  document.querySelectorAll('[data-emp-tab]').forEach(b => b.classList.toggle('active', b.dataset.empTab === tab));

  const jwt = localStorage.getItem('luz_jwt');
  const headers = { 'Authorization': 'Bearer ' + jwt };

  try {
    if (tab === 'orders') {
      const res = await fetch('http://localhost:8080/api/orders?page=0&size=100', { headers }).then(r => r.json());
      _orderCache = res.data?.content || res.data || [];
      body.innerHTML = buildOrdersTab(_orderCache);
      bindOrderTabEvents();
    } else if (tab === 'returns') {
      const res = await fetch('http://localhost:8080/api/returns?page=0&size=100', { headers }).then(r => r.json());
      _returnCache = res.data?.content || res.data || [];
      body.innerHTML = buildReturnsTab(_returnCache);
    } else if (tab === 'profile') {
      body.innerHTML = buildProfileTab();
    }
  } catch (e) {
    body.innerHTML = `<div class="dash-empty">Failed to load: ${e.message}</div>`;
  }
}

function bindOrderTabEvents() {
  document.getElementById('emp-order-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = _orderCache.filter(o =>
      (o.orderNumber||'').toLowerCase().includes(q) ||
      (o.customerName||'').toLowerCase().includes(q)
    );
    document.getElementById('emp-orders-tbody').innerHTML = buildOrderRows(filtered);
    bindStatusSelects();
  });

  document.getElementById('emp-order-status')?.addEventListener('change', e => {
    const s = e.target.value;
    const filtered = s ? _orderCache.filter(o => o.status === s) : _orderCache;
    document.getElementById('emp-orders-tbody').innerHTML = buildOrderRows(filtered);
    bindStatusSelects();
  });

  bindStatusSelects();
}

function bindStatusSelects() {
  document.querySelectorAll('[data-action="emp-update-status"]').forEach(sel => {
    sel.addEventListener('change', async () => {
      const { id } = sel.dataset;
      const status = sel.value;
      try {
        await fetch(`http://localhost:8080/api/orders/${id}/status?status=${status}`, {
          method: 'PATCH',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') }
        });
        // update local cache
        const order = _orderCache.find(o => o.id == id);
        if (order) order.status = status;
        document.getElementById('emp-orders-tbody').innerHTML = buildOrderRows(_orderCache);
        bindStatusSelects();
      } catch (err) {
        alert('Failed to update status');
      }
    });
  });
}

export async function bindEvents(state, helpers) {
  const headerEl = document.getElementById('app-header-container');
  if (headerEl) {
    const h = headerEl.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--admin-header-h', h + 'px');
  }

  document.querySelectorAll('[data-emp-tab]').forEach(btn => {
    btn.addEventListener('click', () => loadTab(btn.dataset.empTab));
  });

  document.getElementById('emp-logout')?.addEventListener('click', () => {
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_user');
    localStorage.removeItem('luz_refresh_token');
    setState({ currentView: 'home' });
    import('../../router.js').then(m => m.renderAll());
  });

  await loadTab('orders');
}
