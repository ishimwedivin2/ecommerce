import '../admin/style.css';
import '../role-profile.css';
import { ApiService } from '../../api.js';

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

function escH(s) { return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function escV(s) { return String(s==null?'':s).replace(/"/g,'&quot;'); }
function fmtDateShortEmp(v) { return v ? new Date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'; }

function buildProfileTab() {
  const user = ApiService.getCurrentUser() || {};
  const initials = ((user.firstName||'E')[0]).toUpperCase();
  return `
    <div style="max-width:760px;">
      <!-- Hero card -->
      <div class="rp-hero-card">
        <div class="rp-hero-banner blue"></div>
        <div class="rp-hero-body">
          <div class="rp-hero-avatar-wrap">
            <div class="rp-hero-avatar blue">${initials}</div>
            <div class="rp-hero-avatar-ring"></div>
          </div>
          <div class="rp-hero-info">
            <div class="rp-hero-name">${escH(user.firstName||'')} ${escH(user.lastName||'')}</div>
            <div class="rp-hero-email">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              ${escH(user.email||'')}
            </div>
            <div class="rp-hero-since">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Member since ${fmtDateShortEmp(user.createdAt)}
            </div>
          </div>
          <div class="rp-hero-badge blue">Employee</div>
        </div>
      </div>

      <!-- Edit Profile -->
      <div class="rp-form-card">
        <div class="rp-form-header">
          <div class="rp-form-header-icon blue">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div>
            <div class="rp-form-title">Edit Profile</div>
            <div class="rp-form-sub">Update your personal information</div>
          </div>
        </div>
        <form id="emp-prof-edit-form">
          <div class="rp-field-grid">
            <div class="rp-field">
              <label>First Name</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="emp-prof-fn" type="text" value="${escV(user.firstName)}" placeholder="First name" required>
              </div>
            </div>
            <div class="rp-field">
              <label>Last Name</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="emp-prof-ln" type="text" value="${escV(user.lastName)}" placeholder="Last name" required>
              </div>
            </div>
            <div class="rp-field rp-field-full">
              <label>Email Address <span class="rp-badge-locked">Locked</span></label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                <input type="email" value="${escV(user.email)}" disabled placeholder="Email">
              </div>
            </div>
            <div class="rp-field rp-field-full">
              <label>Phone Number</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.14-1.14a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <input id="emp-prof-phone" type="tel" value="${escV(user.phoneNumber)}" placeholder="+250 7XX XXX XXX">
              </div>
            </div>
          </div>
          <div id="emp-prof-msg" class="rp-msg" style="display:none"></div>
          <div class="rp-form-footer">
            <button type="submit" class="rp-save-btn blue">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <!-- Change Password -->
      <div class="rp-form-card">
        <div class="rp-form-header">
          <div class="rp-form-header-icon blue">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <div class="rp-form-title">Change Password</div>
            <div class="rp-form-sub">Keep your account secure with a strong password</div>
          </div>
        </div>
        <form id="emp-prof-pwd-form">
          <div class="rp-field-grid rp-pwd-grid">
            <div class="rp-field">
              <label>Current Password</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input id="emp-prof-cur-pwd" type="password" placeholder="Current password" required>
              </div>
            </div>
            <div class="rp-field">
              <label>New Password</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input id="emp-prof-new-pwd" type="password" placeholder="Min 8 characters" required>
              </div>
            </div>
            <div class="rp-field">
              <label>Confirm New Password</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input id="emp-prof-cfm-pwd" type="password" placeholder="Repeat new password" required>
              </div>
            </div>
          </div>
          <div id="emp-prof-pwd-msg" class="rp-msg" style="display:none"></div>
          <div class="rp-form-footer">
            <button type="submit" class="rp-save-btn blue">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Update Password
            </button>
          </div>
        </form>
      </div>

      <!-- Logout -->
      <div class="rp-logout-card" id="emp-prof-logout-card">
        <div class="rp-logout-icon">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div class="rp-logout-text">
          <div class="rp-logout-title">Sign Out</div>
          <div class="rp-logout-desc">End your current session and return to the homepage.</div>
        </div>
        <button class="rp-logout-btn" id="emp-prof-logout-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log Out
        </button>
      </div>
    </div>
  `;
}

export async function render(state) {
  _activeTab = state.activeEmployeeTab || 'orders';
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
          <button class="dash-nav-item ${_activeTab==='orders'?'active':''}" data-emp-tab="orders">${ICONS.orders}<span class="dash-nav-label">Orders</span></button>
          <button class="dash-nav-item ${_activeTab==='returns'?'active':''}" data-emp-tab="returns">${ICONS.returns}<span class="dash-nav-label">Returns</span></button>
          <button class="dash-nav-item ${_activeTab==='profile'?'active':''}" data-emp-tab="profile">${ICONS.profile}<span class="dash-nav-label">My Profile</span></button>
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
      bindProfileTabEvents();
    }
  } catch (e) {
    body.innerHTML = `<div class="dash-empty">Failed to load: ${e.message}</div>`;
  }
}

function showRpMsg(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'rp-msg rp-msg-' + type;
  el.style.display = '';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function bindProfileTabEvents() {
  // Edit form
  document.getElementById('emp-prof-edit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const res = await fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+localStorage.getItem('luz_jwt') },
        body: JSON.stringify({
          firstName: document.getElementById('emp-prof-fn').value.trim(),
          lastName:  document.getElementById('emp-prof-ln').value.trim(),
          phoneNumber: document.getElementById('emp-prof-phone').value.trim(),
        })
      });
      if (res.ok) {
        const data = await res.json();
        const u = JSON.parse(localStorage.getItem('luz_user') || '{}');
        const updated = { ...u, ...(data.data || {}) };
        localStorage.setItem('luz_user', JSON.stringify(updated));
        showRpMsg('emp-prof-msg', 'Profile saved successfully!', 'success');
      } else {
        const d = await res.json().catch(() => ({}));
        showRpMsg('emp-prof-msg', d.message || 'Failed to save profile', 'error');
      }
    } catch (err) {
      showRpMsg('emp-prof-msg', err.message || 'Network error', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });

  // Password form
  document.getElementById('emp-prof-pwd-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const newPwd = document.getElementById('emp-prof-new-pwd').value;
    const cfmPwd = document.getElementById('emp-prof-cfm-pwd').value;
    if (newPwd !== cfmPwd) { showRpMsg('emp-prof-pwd-msg', 'Passwords do not match', 'error'); return; }
    if (newPwd.length < 8) { showRpMsg('emp-prof-pwd-msg', 'Password must be at least 8 characters', 'error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Updating…';
    try {
      const res = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+localStorage.getItem('luz_jwt') },
        body: JSON.stringify({ currentPassword: document.getElementById('emp-prof-cur-pwd').value, newPassword: newPwd })
      });
      if (res.ok) {
        showRpMsg('emp-prof-pwd-msg', 'Password updated successfully!', 'success');
        e.target.reset();
      } else {
        const d = await res.json().catch(() => ({}));
        showRpMsg('emp-prof-pwd-msg', d.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      showRpMsg('emp-prof-pwd-msg', err.message || 'Network error', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Update Password';
    }
  });

  // Logout button in profile tab
  document.getElementById('emp-prof-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_user');
    localStorage.removeItem('luz_refresh_token');
    window.location.href = '/';
  });
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
    btn.addEventListener('click', () => {
      helpers?.syncUrl?.({ currentView: 'employee', activeEmployeeTab: btn.dataset.empTab });
      loadTab(btn.dataset.empTab);
    });
  });

  document.getElementById('emp-logout')?.addEventListener('click', () => {
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_user');
    localStorage.removeItem('luz_refresh_token');
    helpers?.navigate?.('home', { activeCategory: null });
  });

  await loadTab(_activeTab);
}
