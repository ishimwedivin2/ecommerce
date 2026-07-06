import '../admin/style.css';
import './style.css';
import '../role-profile.css';
import { ApiService } from '../../api.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../../chat-ws.js';

const BASE = 'http://localhost:8080';
function authHeaders() {
  return { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt'), 'Content-Type': 'application/json' };
}
async function api(path, opts = {}) {
  const res = await fetch(BASE + path, { headers: authHeaders(), ...opts });
  return res.json();
}

let _activeTab = 'tickets';
let _ticketCache = [];
let _chatCache = [];
let _customerCache = [];

// ── Icons ──────────────────────────────────────────────────
const ICONS = {
  tickets:   `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
  chat:      `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
  customers: `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  profile:   `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
};

function statusBadge(status) {
  const map = { OPEN:'#3b82f6', PENDING:'#f59e0b', CLOSED:'#6b7280', RESOLVED:'#10b981', IN_PROGRESS:'#8b5cf6' };
  const color = map[status] || '#6b7280';
  return `<span style="background:${color}22;color:${color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${status}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ── Tab content builders ───────────────────────────────────
function buildTicketsTab(tickets) {
  if (!tickets.length) return `<div class="dash-empty">No tickets found.</div>`;
  return `
    <div class="dash-section-header">
      <h3>Support Tickets</h3>
      <div style="display:flex;gap:8px;">
        <input id="sa-ticket-search" class="dash-search-input" placeholder="Search by subject or customer…" style="width:240px;">
        <select id="sa-ticket-status" class="dash-filter-select">
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="CLOSED">Closed</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr>
          <th>#</th><th>Subject</th><th>Customer</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th>
        </tr></thead>
        <tbody id="sa-tickets-tbody">
          ${buildTicketRows(tickets)}
        </tbody>
      </table>
    </div>
  `;
}

function buildTicketRows(tickets) {
  const me = ApiService.getCurrentUser();
  return tickets.map(t => {
    const isAssignedToMe = t.assignedAgent?.id === me?.id;
    const isOpen = t.status !== 'CLOSED' && t.status !== 'RESOLVED';
    return `
    <tr>
      <td style="font-size:11px;color:#94a3b8;">#${(t.id||'').toString().slice(0,8)}</td>
      <td style="font-weight:500;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title || t.subject || '—'}</td>
      <td>${t.customerName || t.customer?.firstName || '—'}</td>
      <td><span style="font-size:11px;font-weight:600;color:${t.priority==='HIGH'?'#ef4444':t.priority==='MEDIUM'?'#f59e0b':'#6b7280'}">${t.priority||'—'}</span></td>
      <td>${statusBadge(t.status)}</td>
      <td style="font-size:12px;color:#64748b;">${fmtDate(t.createdAt)}</td>
      <td style="display:flex;gap:4px;flex-wrap:wrap;">
        <button class="dash-action-btn" data-action="sa-view-ticket" data-id="${t.id}">View & Reply</button>
        ${isOpen && !isAssignedToMe ? `<button class="dash-action-btn" data-action="sa-assign-self" data-id="${t.id}">Assign to Me</button>` : ''}
        ${isOpen ? `<button class="dash-action-btn" data-action="sa-resolve-ticket" data-id="${t.id}" style="background:#10b98122;color:#10b981;border:1px solid #10b981;">Resolve</button>` : ''}
        ${isOpen ? `<button class="dash-action-btn danger" data-action="sa-close-ticket" data-id="${t.id}">Close</button>` : ''}
      </td>
    </tr>
  `}).join('');
}

function buildChatTab(sessions) {
  const me = ApiService.getCurrentUser();
  if (!sessions.length) return `
    <div class="dash-section-header"><h3>Live Chat Sessions</h3></div>
    <div class="sa-chat-empty">
      <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      <p>No live chat sessions yet</p>
    </div>`;

  return `
    <div class="dash-section-header">
      <h3>Live Chat Sessions <span class="sa-session-count">${sessions.length}</span></h3>
    </div>
    <div class="sa-chat-list">
      ${sessions.map(s => {
        const isAssignedToMe = s.agent?.id === me?.id;
        const isOpen = s.status !== 'CLOSED';
        const customerName = [s.customer?.firstName || s.customerName || '', s.customer?.lastName || ''].join(' ').trim() || 'Customer';
        const initials = customerName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
        const statusColor = s.status === 'ASSIGNED' ? '#10b981' : s.status === 'CLOSED' ? '#6b7280' : '#3b82f6';
        return `
        <div class="sa-chat-card ${s.hasUnread ? 'sa-chat-card--unread' : ''}" id="sa-chat-card-${s.id}">
          <div class="sa-chat-card-left">
            <div class="sa-chat-avatar">${initials}</div>
            ${isOpen ? '<span class="sa-chat-online-dot"></span>' : ''}
          </div>
          <div class="sa-chat-card-body">
            <div class="sa-chat-card-top">
              <span class="sa-chat-customer">${customerName}</span>
              <span class="sa-chat-time">${fmtDate(s.createdAt)}</span>
            </div>
            <div class="sa-chat-subject">${s.subject || 'No subject'}</div>
            <div class="sa-chat-card-bottom">
              <span class="sa-chat-status-badge" style="background:${statusColor}22;color:${statusColor}">${s.status || 'OPEN'}</span>
              ${s.agent ? `<span class="sa-chat-agent-tag">Agent: ${s.agent.firstName || s.agent.email || '—'}</span>` : '<span class="sa-chat-agent-tag sa-chat-agent-tag--none">Unassigned</span>'}
            </div>
          </div>
          <div class="sa-chat-card-actions">
            <button class="sa-chat-btn sa-chat-btn--primary" data-action="sa-view-chat" data-id="${s.id}">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Open
            </button>
            ${isOpen && !isAssignedToMe ? `<button class="sa-chat-btn" data-action="sa-assign-chat" data-id="${s.id}">Assign</button>` : ''}
            ${isOpen ? `<button class="sa-chat-btn sa-chat-btn--danger" data-action="sa-close-chat" data-id="${s.id}">Close</button>` : ''}
          </div>
        </div>
      `}).join('')}
    </div>
  `;
}

function _escH(s) { return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function _escV(s) { return String(s==null?'':s).replace(/"/g,'&quot;'); }
function _fmtDS(v) { return v ? new Date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'; }

function buildProfileTab() {
  const user = ApiService.getCurrentUser() || {};
  const initials = ((user.firstName||'S')[0]).toUpperCase();
  return `
    <div style="max-width:760px;">
      <!-- Hero card -->
      <div class="rp-hero-card">
        <div class="rp-hero-banner purple"></div>
        <div class="rp-hero-body">
          <div class="rp-hero-avatar-wrap">
            <div class="rp-hero-avatar purple">${initials}</div>
            <div class="rp-hero-avatar-ring"></div>
          </div>
          <div class="rp-hero-info">
            <div class="rp-hero-name">${_escH(user.firstName||'')} ${_escH(user.lastName||'')}</div>
            <div class="rp-hero-email">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              ${_escH(user.email||'')}
            </div>
            <div class="rp-hero-since">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Member since ${_fmtDS(user.createdAt)}
            </div>
          </div>
          <div class="rp-hero-badge purple">Support Agent</div>
        </div>
      </div>

      <!-- Edit Profile -->
      <div class="rp-form-card">
        <div class="rp-form-header">
          <div class="rp-form-header-icon purple">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
          <div>
            <div class="rp-form-title">Edit Profile</div>
            <div class="rp-form-sub">Update your personal information</div>
          </div>
        </div>
        <form id="sa-prof-edit-form">
          <div class="rp-field-grid">
            <div class="rp-field">
              <label>First Name</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="sa-prof-fn" type="text" value="${_escV(user.firstName)}" placeholder="First name" required>
              </div>
            </div>
            <div class="rp-field">
              <label>Last Name</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="sa-prof-ln" type="text" value="${_escV(user.lastName)}" placeholder="Last name" required>
              </div>
            </div>
            <div class="rp-field rp-field-full">
              <label>Email Address <span class="rp-badge-locked">Locked</span></label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                <input type="email" value="${_escV(user.email)}" disabled placeholder="Email">
              </div>
            </div>
            <div class="rp-field rp-field-full">
              <label>Phone Number</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l1.14-1.14a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <input id="sa-prof-phone" type="tel" value="${_escV(user.phoneNumber)}" placeholder="+250 7XX XXX XXX">
              </div>
            </div>
          </div>
          <div id="sa-prof-msg" class="rp-msg" style="display:none"></div>
          <div class="rp-form-footer">
            <button type="submit" class="rp-save-btn purple">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <!-- Change Password -->
      <div class="rp-form-card">
        <div class="rp-form-header">
          <div class="rp-form-header-icon purple">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <div class="rp-form-title">Change Password</div>
            <div class="rp-form-sub">Keep your account secure with a strong password</div>
          </div>
        </div>
        <form id="sa-prof-pwd-form">
          <div class="rp-field-grid rp-pwd-grid">
            <div class="rp-field">
              <label>Current Password</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input id="sa-prof-cur-pwd" type="password" placeholder="Current password" required>
              </div>
            </div>
            <div class="rp-field">
              <label>New Password</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input id="sa-prof-new-pwd" type="password" placeholder="Min 8 characters" required>
              </div>
            </div>
            <div class="rp-field">
              <label>Confirm New Password</label>
              <div class="rp-input-wrap">
                <svg class="rp-input-icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input id="sa-prof-cfm-pwd" type="password" placeholder="Repeat new password" required>
              </div>
            </div>
          </div>
          <div id="sa-prof-pwd-msg" class="rp-msg" style="display:none"></div>
          <div class="rp-form-footer">
            <button type="submit" class="rp-save-btn purple">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Update Password
            </button>
          </div>
        </form>
      </div>

      <!-- Logout -->
      <div class="rp-logout-card">
        <div class="rp-logout-icon">
          <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div class="rp-logout-text">
          <div class="rp-logout-title">Sign Out</div>
          <div class="rp-logout-desc">End your current session and return to the homepage.</div>
        </div>
        <button class="rp-logout-btn" id="sa-prof-logout-btn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Log Out
        </button>
      </div>
    </div>
  `;
}

function _showRpMsg(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'rp-msg rp-msg-' + type;
  el.style.display = '';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function bindSaProfileEvents() {
  document.getElementById('sa-prof-edit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const res = await fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+localStorage.getItem('luz_jwt') },
        body: JSON.stringify({
          firstName: document.getElementById('sa-prof-fn').value.trim(),
          lastName:  document.getElementById('sa-prof-ln').value.trim(),
          phoneNumber: document.getElementById('sa-prof-phone').value.trim(),
        })
      });
      if (res.ok) {
        const data = await res.json();
        const u = JSON.parse(localStorage.getItem('luz_user') || '{}');
        localStorage.setItem('luz_user', JSON.stringify({ ...u, ...(data.data || {}) }));
        _showRpMsg('sa-prof-msg', 'Profile saved successfully!', 'success');
      } else {
        const d = await res.json().catch(() => ({}));
        _showRpMsg('sa-prof-msg', d.message || 'Failed to save', 'error');
      }
    } catch (err) {
      _showRpMsg('sa-prof-msg', err.message || 'Network error', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });

  document.getElementById('sa-prof-pwd-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const newPwd = document.getElementById('sa-prof-new-pwd').value;
    const cfmPwd = document.getElementById('sa-prof-cfm-pwd').value;
    if (newPwd !== cfmPwd) { _showRpMsg('sa-prof-pwd-msg', 'Passwords do not match', 'error'); return; }
    if (newPwd.length < 8) { _showRpMsg('sa-prof-pwd-msg', 'Password must be at least 8 characters', 'error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Updating…';
    try {
      const res = await fetch('http://localhost:8080/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+localStorage.getItem('luz_jwt') },
        body: JSON.stringify({ currentPassword: document.getElementById('sa-prof-cur-pwd').value, newPassword: newPwd })
      });
      if (res.ok) {
        _showRpMsg('sa-prof-pwd-msg', 'Password updated!', 'success');
        e.target.reset();
      } else {
        const d = await res.json().catch(() => ({}));
        _showRpMsg('sa-prof-pwd-msg', d.message || 'Failed to update', 'error');
      }
    } catch (err) {
      _showRpMsg('sa-prof-pwd-msg', err.message || 'Network error', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Update Password';
    }
  });

  document.getElementById('sa-prof-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_user');
    localStorage.removeItem('luz_refresh_token');
    window.location.href = '/';
  });
}

// ── Ticket detail modal ────────────────────────────────────
async function openTicketModal(ticketId) {
  const me = ApiService.getCurrentUser();

  const [ticketRes, msgsRes] = await Promise.all([
    api(`/api/support/tickets/${ticketId}`).catch(() => ({})),
    api(`/api/support/tickets/${ticketId}/messages`).catch(() => ({})),
  ]);

  const ticket = ticketRes?.data || _ticketCache.find(t => t.id == ticketId) || {};
  const messages = Array.isArray(msgsRes.data) ? msgsRes.data : [];
  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  const customerName = [ticket.customerFirstName || '', ticket.customerEmail || 'Customer'].filter(Boolean)[0];
  const initials = customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'C';
  const statusColor = { OPEN: '#3b82f6', IN_PROGRESS: '#8b5cf6', RESOLVED: '#10b981', CLOSED: '#6b7280' }[ticket.status] || '#6b7280';

  function buildBubble(m) {
    const isCustomer = m.senderId === ticket.customerId;
    const label = isCustomer ? (m.senderFirstName || 'Customer') : (m.senderFirstName || 'You');
    const time = fmtDate(m.createdAt);
    return `
      <div class="sa-msg-bubble ${isCustomer ? 'customer-msg' : 'agent-msg'}">
        <div class="sa-msg-sender">${_esc(label)}</div>
        ${_esc(m.message)}
        <div class="sa-msg-time">${time}</div>
      </div>`;
  }

  const msgsHtml = messages.length
    ? messages.map(buildBubble).join('')
    : `<div class="sa-chat-no-messages">
        <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        <span>No messages yet</span>
       </div>`;

  const overlay = document.createElement('div');
  overlay.className = 'sa-chat-modal-backdrop';
  overlay.innerHTML = `
    <div class="sa-ticket-modal-wide">
      <div class="sa-chat-modal-header">
        <div class="sa-modal-avatar">${initials}</div>
        <div class="sa-modal-header-info">
          <p class="sa-modal-customer-name">${_esc(customerName)}</p>
          <p class="sa-modal-subject">${_esc(ticket.title || 'Support Ticket')}</p>
        </div>
        <div class="sa-modal-header-actions">
          <span class="sa-modal-status-badge" style="color:${statusColor}">${ticket.status || 'OPEN'}</span>
          ${ticket.priority ? `<span class="sa-modal-status-badge" style="color:${ticket.priority==='HIGH'||ticket.priority==='CRITICAL'?'#ef4444':'#f59e0b'}">${ticket.priority}</span>` : ''}
          <button class="sa-modal-close-btn" id="sa-ticket-modal-close" title="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="sa-ticket-modal-body">
        <div class="sa-ticket-modal-main">
          <div class="sa-chat-modal-messages" id="sa-ticket-msg-list">${msgsHtml}</div>
          ${!isClosed ? `
            <form class="sa-chat-modal-input-row" id="sa-ticket-reply-form">
              <input class="sa-chat-modal-input" id="sa-ticket-reply-input" placeholder="Type a reply…" autocomplete="off" required>
              <button type="submit" class="sa-chat-modal-send-btn" title="Send">
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              </button>
            </form>
          ` : `<div style="padding:12px 16px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;background:white;">This ticket is ${ticket.status}</div>`}
        </div>
        <div class="sa-ticket-modal-context">
          <div class="sa-cp-section-title">Customer Context</div>
          <div id="sa-ticket-ctx-orders" class="sa-ticket-ctx-loading">
            <div class="sa-cp-info-row"><span>Name</span><strong>${_esc(customerName)}</strong></div>
            <div class="sa-cp-info-row"><span>Email</span><strong>${_esc(ticket.customerEmail || '—')}</strong></div>
            <div style="margin-top:12px;font-size:11px;font-weight:600;color:#64748b;letter-spacing:.5px;">ORDERS</div>
            <div id="sa-ticket-orders-list" style="margin-top:6px;color:#94a3b8;font-size:12px;">Loading…</div>
          </div>
          <div style="margin-top:16px;">
            <div class="sa-cp-section-title">Order Tracking</div>
            <div id="sa-ticket-tracking" style="color:#94a3b8;font-size:12px;padding:8px 0;">Select an order above</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const msgList = document.getElementById('sa-ticket-msg-list');
  function scrollBottom() { if (msgList) msgList.scrollTop = msgList.scrollHeight; }
  scrollBottom();

  // Load customer orders into context panel
  if (ticket.customerId) {
    api(`/api/orders/customer/${ticket.customerId}`).then(res => {
      const orders = Array.isArray(res.data) ? res.data : [];
      const el = document.getElementById('sa-ticket-orders-list');
      if (!el) return;
      if (!orders.length) { el.textContent = 'No orders found'; return; }
      el.innerHTML = orders.map(o => {
        const statusColor = { PENDING:'#f59e0b', PROCESSING:'#3b82f6', SHIPPED:'#8b5cf6', DELIVERED:'#10b981', CANCELLED:'#ef4444' }[o.status] || '#6b7280';
        return `
          <div class="sa-ctx-order-row">
            <div>
              <div style="font-size:12px;font-weight:700;">#${(o.orderNumber||o.id||'').toString().slice(0,8)}</div>
              <div style="font-size:11px;color:#94a3b8;">${fmtDate(o.createdAt)}</div>
            </div>
            <span class="sa-chat-status-badge" style="background:${statusColor}22;color:${statusColor};font-size:10px;">${o.status}</span>
            <button class="sa-chat-btn" style="padding:3px 8px;font-size:11px;" data-action="sa-ctx-track" data-id="${o.id}">Track</button>
          </div>`;
      }).join('');
      overlay.querySelectorAll('[data-action="sa-ctx-track"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const trackEl = document.getElementById('sa-ticket-tracking');
          if (trackEl) trackEl.innerHTML = '<span style="color:#94a3b8;font-size:12px;">Loading…</span>';
          const [trackRes, shipRes] = await Promise.all([
            api(`/api/orders/${btn.dataset.id}/tracking`).catch(() => ({})),
            api(`/api/shipments/order/${btn.dataset.id}`).catch(() => ({})),
          ]);
          const t = trackRes.data || {};
          const s = shipRes.data || {};
          if (trackEl) trackEl.innerHTML = `
            <div class="sa-cp-tracking-card" style="margin-top:0;">
              <div class="sa-cp-info-row"><span>Status</span><strong>${t.orderStatus||s.status||'—'}</strong></div>
              <div class="sa-cp-info-row"><span>Tracking #</span><strong>${_esc(s.trackingNumber||t.trackingNumber||'—')}</strong></div>
              <div class="sa-cp-info-row"><span>Carrier</span><strong>${_esc(s.carrier||'—')}</strong></div>
              <div class="sa-cp-info-row"><span>Est. Delivery</span><strong>${fmtDate(s.estimatedDeliveryDate||t.estimatedDelivery)}</strong></div>
            </div>`;
        });
      });
    }).catch(() => {
      const el = document.getElementById('sa-ticket-orders-list');
      if (el) el.textContent = 'Could not load orders';
    });
  }

  // Fix 2: subscribe WebSocket so agent sees customer messages live
  connectWS(() => {
    subscribeWS('/topic/tickets/' + ticketId, (msgData) => {
      if (msgData.senderId === me?.id) return;
      msgList?.insertAdjacentHTML('beforeend', `
        <div class="sa-msg-bubble customer-msg">
          <div class="sa-msg-sender">${_esc(msgData.senderFirstName || 'Customer')}</div>
          ${_esc(msgData.message)}
          <div class="sa-msg-time">${fmtDate(msgData.createdAt)}</div>
        </div>`);
      scrollBottom();
    });
  });

  function closeModal() {
    unsubscribeWS('/topic/tickets/' + ticketId);
    overlay.remove();
  }

  document.getElementById('sa-ticket-modal-close').onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };

  if (!isClosed) {
    const replyInput = document.getElementById('sa-ticket-reply-input');
    const replyForm  = document.getElementById('sa-ticket-reply-form');

    replyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = replyInput.value.trim();
      if (!msg) return;
      // Fix 1: optimistic append — no modal close/reopen
      msgList?.insertAdjacentHTML('beforeend', `
        <div class="sa-msg-bubble agent-msg">
          <div class="sa-msg-sender">You</div>
          ${_esc(msg)}
          <div class="sa-msg-time">just now</div>
        </div>`);
      scrollBottom();
      replyInput.value = '';
      await api(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      }).catch(console.error);
    });

    replyInput.focus();
  }
}

// ── Chat session modal ─────────────────────────────────────
function _esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function openChatModal(sessionId) {
  const me = ApiService.getCurrentUser();

  const msgsRes = await api(`/api/support/live-chat/sessions/${sessionId}/messages`).catch(() => ({}));
  const messages = Array.isArray(msgsRes.data) ? msgsRes.data : [];

  const session = _chatCache.find(s => s.id === sessionId) || {};
  const isClosed = session.status === 'CLOSED';
  const customerName = [session.customer?.firstName || '', session.customer?.lastName || ''].join(' ').trim() || 'Customer';
  const initials = customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const statusColor = session.status === 'ASSIGNED' ? '#10b981' : session.status === 'CLOSED' ? '#6b7280' : '#3b82f6';

  function buildMsgBubbles(msgs) {
    if (!msgs.length) return `
      <div class="sa-chat-no-messages">
        <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        <span>No messages yet</span>
      </div>`;
    return msgs.map(m => {
      const isMe = m.senderId === me?.id;
      const label = isMe ? 'You' : (m.senderEmail ? m.senderEmail.split('@')[0] : 'Customer');
      const time = fmtDate(m.sentAt || m.createdAt);
      return `
        <div class="sa-msg-bubble ${isMe ? 'agent-msg' : 'customer-msg'}">
          <div class="sa-msg-sender">${label}</div>
          ${_esc(m.message)}
          <div class="sa-msg-time">${time}</div>
        </div>`;
    }).join('');
  }

  const overlay = document.createElement('div');
  overlay.id = 'sa-chat-modal-backdrop';
  overlay.className = 'sa-chat-modal-backdrop';
  overlay.innerHTML = `
    <div class="sa-chat-modal" id="sa-chat-modal-box">
      <div class="sa-chat-modal-header">
        <div class="sa-modal-avatar">${initials}</div>
        <div class="sa-modal-header-info">
          <p class="sa-modal-customer-name">${_esc(customerName)}</p>
          <p class="sa-modal-subject">${_esc(session.subject || 'Live Chat')}</p>
        </div>
        <div class="sa-modal-header-actions">
          <span class="sa-modal-status-badge" style="color:${statusColor}">${session.status || 'OPEN'}</span>
          <button class="sa-modal-close-btn" id="sa-chat-modal-close" title="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="sa-chat-modal-body">
        <div class="sa-chat-modal-messages" id="sa-chat-msg-list">
          ${buildMsgBubbles(messages)}
        </div>
        ${!isClosed ? `
          <form class="sa-chat-modal-input-row" id="sa-chat-reply-form">
            <input class="sa-chat-modal-input" id="sa-chat-reply-input" placeholder="Type a reply…" autocomplete="off" required>
            <button type="submit" class="sa-chat-modal-send-btn" id="sa-chat-reply-send" title="Send">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>
        ` : `<div style="padding:12px 16px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;background:white;">This session is closed</div>`}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const msgList = document.getElementById('sa-chat-msg-list');
  function scrollBottom() { if (msgList) msgList.scrollTop = msgList.scrollHeight; }
  scrollBottom();

  connectWS(() => {
    subscribeWS('/topic/live-chat/' + sessionId, (msgData) => {
      if (msgData.senderId === me?.id) return;
      const label = msgData.senderEmail ? msgData.senderEmail.split('@')[0] : 'Customer';
      const time = fmtDate(msgData.sentAt);
      msgList?.insertAdjacentHTML('beforeend', `
        <div class="sa-msg-bubble customer-msg">
          <div class="sa-msg-sender">${label}</div>
          ${_esc(msgData.message)}
          <div class="sa-msg-time">${time}</div>
        </div>`);
      scrollBottom();
    });
  });

  function closeModal() {
    unsubscribeWS('/topic/live-chat/' + sessionId);
    overlay.remove();
  }

  document.getElementById('sa-chat-modal-close').onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };

  if (!isClosed) {
    const replyInput = document.getElementById('sa-chat-reply-input');
    const replyBtn   = document.getElementById('sa-chat-reply-send');
    const replyForm  = document.getElementById('sa-chat-reply-form');

    async function sendReply() {
      const msg = replyInput?.value.trim();
      if (!msg) return;
      replyBtn.disabled = true;
      msgList?.insertAdjacentHTML('beforeend', `
        <div class="sa-msg-bubble agent-msg">
          <div class="sa-msg-sender">You</div>
          ${_esc(msg)}
        </div>`);
      scrollBottom();
      replyInput.value = '';
      replyBtn.disabled = false;
      await api(`/api/support/live-chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      }).catch(console.error);
    }

    replyForm.addEventListener('submit', e => { e.preventDefault(); sendReply(); });
    replyInput.focus();
  }
}

// ── Customers Tab ──────────────────────────────────────────
function buildCustomersTab(customers) {
  return `
    <div class="dash-section-header">
      <h3>Customers <span class="sa-session-count">${customers.length}</span></h3>
      <input id="sa-customer-search" class="dash-search-input" placeholder="Search by name or email…" style="width:260px;">
    </div>
    <div class="sa-customer-grid" id="sa-customer-grid">
      ${buildCustomerCards(customers)}
    </div>
  `;
}

function buildCustomerCards(customers) {
  if (!customers.length) return `<div class="sa-chat-empty"><p>No customers found.</p></div>`;
  return customers.map(c => {
    const name = [c.firstName || '', c.lastName || ''].join(' ').trim() || 'Customer';
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="sa-customer-card" data-action="sa-view-customer" data-id="${c.id}">
        <div class="sa-customer-avatar">${initials}</div>
        <div class="sa-customer-info">
          <div class="sa-customer-name">${_esc(name)}</div>
          <div class="sa-customer-email">${_esc(c.email || '—')}</div>
          <div class="sa-customer-phone">${_esc(c.phoneNumber || '—')}</div>
        </div>
        <button class="sa-chat-btn sa-chat-btn--primary" data-action="sa-view-customer" data-id="${c.id}">
          View Profile
        </button>
      </div>`;
  }).join('');
}

function bindCustomerTabEvents() {
  document.getElementById('sa-customer-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = _customerCache.filter(c =>
      (c.firstName || '').toLowerCase().includes(q) ||
      (c.lastName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
    document.getElementById('sa-customer-grid').innerHTML = buildCustomerCards(filtered);
    bindCustomerCardClicks();
  });
  bindCustomerCardClicks();
}

function bindCustomerCardClicks() {
  document.querySelectorAll('[data-action="sa-view-customer"]').forEach(el => {
    el.addEventListener('click', () => openCustomerPanel(el.dataset.id));
  });
}

async function openCustomerPanel(customerId) {
  const overlay = document.createElement('div');
  overlay.className = 'sa-chat-modal-backdrop';
  overlay.innerHTML = `
    <div class="sa-customer-modal">
      <div class="sa-customer-modal-header">
        <div class="sa-modal-avatar" id="sa-cp-avatar">…</div>
        <div class="sa-modal-header-info">
          <p class="sa-modal-customer-name" id="sa-cp-name">Loading…</p>
          <p class="sa-modal-subject" id="sa-cp-email"></p>
        </div>
        <div class="sa-modal-header-actions">
          <button class="sa-modal-close-btn" id="sa-cp-close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div class="sa-customer-modal-body">
        <div class="sa-customer-modal-left">
          <div class="sa-cp-section">
            <div class="sa-cp-section-title">Contact Info</div>
            <div id="sa-cp-contact">Loading…</div>
          </div>
          <div class="sa-cp-section">
            <div class="sa-cp-section-title">Order History</div>
            <div id="sa-cp-orders">Loading…</div>
          </div>
          <div class="sa-cp-section">
            <div class="sa-cp-section-title">Returns & Refunds</div>
            <div id="sa-cp-returns">Loading…</div>
          </div>
        </div>
        <div class="sa-customer-modal-right">
          <div class="sa-cp-section-title">Quick Actions</div>
          <div class="sa-cp-actions" id="sa-cp-quick-actions">
            <button class="sa-chat-btn sa-chat-btn--primary" id="sa-cp-create-return" style="width:100%;justify-content:center;display:none;">
              + Create Return Request
            </button>
          </div>
          <div class="sa-cp-section-title" style="margin-top:20px;">Tracking</div>
          <div id="sa-cp-tracking" class="sa-cp-tracking-area">
            <p style="color:#94a3b8;font-size:12px;">Select an order to view tracking</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('sa-cp-close').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  // Load all data in parallel
  const [summaryRes, ordersRes, returnsRes] = await Promise.all([
    api(`/api/crm/customers/${customerId}/summary`).catch(() => ({})),
    api(`/api/orders/customer/${customerId}`).catch(() => ({})),
    api(`/api/returns`).catch(() => ({})),
  ]);

  const summary = summaryRes.data || {};
  const customer = summary.customer || _customerCache.find(c => c.id === customerId) || {};
  const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
  const allReturns = Array.isArray(returnsRes.data) ? returnsRes.data : [];
  const customerReturns = allReturns.filter(r => r.order?.customer?.id === customerId || r.customerId === customerId);

  const name = [customer.firstName || '', customer.lastName || ''].join(' ').trim() || 'Customer';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  document.getElementById('sa-cp-avatar').textContent = initials;
  document.getElementById('sa-cp-name').textContent = name;
  document.getElementById('sa-cp-email').textContent = customer.email || '—';

  document.getElementById('sa-cp-contact').innerHTML = `
    <div class="sa-cp-info-row"><span>Email</span><strong>${_esc(customer.email || '—')}</strong></div>
    <div class="sa-cp-info-row"><span>Phone</span><strong>${_esc(customer.phoneNumber || '—')}</strong></div>
    <div class="sa-cp-info-row"><span>Joined</span><strong>${fmtDate(customer.createdAt)}</strong></div>
    <div class="sa-cp-info-row"><span>Orders</span><strong>${orders.length}</strong></div>
  `;

  // Orders list
  if (!orders.length) {
    document.getElementById('sa-cp-orders').innerHTML = `<p style="color:#94a3b8;font-size:12px;">No orders found</p>`;
  } else {
    document.getElementById('sa-cp-orders').innerHTML = orders.map(o => {
      const total = o.totalAmount ? `RM ${(o.totalAmount * 1.18).toFixed(2)}` : '—';
      const statusColor = { PENDING:'#f59e0b', PROCESSING:'#3b82f6', SHIPPED:'#8b5cf6', DELIVERED:'#10b981', CANCELLED:'#ef4444' }[o.status] || '#6b7280';
      return `
        <div class="sa-cp-order-row" data-order-id="${o.id}">
          <div class="sa-cp-order-left">
            <div class="sa-cp-order-num">#${(o.orderNumber || o.id || '').toString().slice(0,8)}</div>
            <div class="sa-cp-order-date">${fmtDate(o.createdAt)}</div>
          </div>
          <div>
            <span class="sa-chat-status-badge" style="background:${statusColor}22;color:${statusColor}">${o.status || '—'}</span>
          </div>
          <div class="sa-cp-order-total">${total}</div>
          <button class="sa-chat-btn" data-action="sa-track-order" data-id="${o.id}" title="View tracking">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Track
          </button>
        </div>`;
    }).join('');

    // Show Create Return button — populate order selector
    const createBtn = document.getElementById('sa-cp-create-return');
    createBtn.style.display = 'flex';
    createBtn.dataset.customerId = customerId;
    createBtn.addEventListener('click', () => openCreateReturnModal(orders, customerId, overlay));

    // Track order clicks
    overlay.querySelectorAll('[data-action="sa-track-order"]').forEach(btn => {
      btn.addEventListener('click', () => loadOrderTracking(btn.dataset.id));
    });
  }

  // Returns list
  if (!customerReturns.length) {
    document.getElementById('sa-cp-returns').innerHTML = `<p style="color:#94a3b8;font-size:12px;">No returns found</p>`;
  } else {
    document.getElementById('sa-cp-returns').innerHTML = customerReturns.map(r => {
      const statusColor = { PENDING:'#f59e0b', APPROVED:'#10b981', REJECTED:'#ef4444', COMPLETED:'#6b7280' }[r.status] || '#6b7280';
      return `
        <div class="sa-cp-return-row">
          <div>
            <div style="font-size:12px;font-weight:600;color:#1e293b;">Order #${(r.orderId || r.order?.id || '').toString().slice(0,8)}</div>
            <div style="font-size:11px;color:#64748b;">${_esc(r.reason || '—')}</div>
          </div>
          <span class="sa-chat-status-badge" style="background:${statusColor}22;color:${statusColor}">${r.status}</span>
        </div>`;
    }).join('');
  }
}

async function loadOrderTracking(orderId) {
  const trackingEl = document.getElementById('sa-cp-tracking');
  if (!trackingEl) return;
  trackingEl.innerHTML = `<p style="color:#94a3b8;font-size:12px;">Loading…</p>`;
  try {
    const [trackRes, shipRes] = await Promise.all([
      api(`/api/orders/${orderId}/tracking`).catch(() => ({})),
      api(`/api/shipments/order/${orderId}`).catch(() => ({})),
    ]);
    const tracking = trackRes.data || {};
    const shipment = shipRes.data || {};
    trackingEl.innerHTML = `
      <div class="sa-cp-tracking-card">
        <div class="sa-cp-info-row"><span>Order Status</span><strong>${tracking.orderStatus || '—'}</strong></div>
        <div class="sa-cp-info-row"><span>Tracking #</span><strong>${_esc(shipment.trackingNumber || tracking.trackingNumber || '—')}</strong></div>
        <div class="sa-cp-info-row"><span>Carrier</span><strong>${_esc(shipment.carrier || '—')}</strong></div>
        <div class="sa-cp-info-row"><span>Shipment Status</span><strong>${shipment.status || '—'}</strong></div>
        <div class="sa-cp-info-row"><span>Estimated Delivery</span><strong>${fmtDate(shipment.estimatedDeliveryDate || tracking.estimatedDelivery)}</strong></div>
        ${tracking.events?.length ? `
          <div style="margin-top:10px;">
            <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px;">TIMELINE</div>
            ${tracking.events.map(ev => `
              <div class="sa-cp-timeline-item">
                <div class="sa-cp-timeline-dot"></div>
                <div>
                  <div style="font-size:12px;font-weight:600;">${_esc(ev.status || ev.description || '')}</div>
                  <div style="font-size:11px;color:#94a3b8;">${fmtDate(ev.timestamp || ev.date)}</div>
                </div>
              </div>`).join('')}
          </div>` : ''}
      </div>`;
  } catch (_) {
    trackingEl.innerHTML = `<p style="color:#ef4444;font-size:12px;">Could not load tracking</p>`;
  }
}

function openCreateReturnModal(orders, customerId, parentOverlay) {
  const modal = document.createElement('div');
  modal.className = 'sa-chat-modal-backdrop';
  modal.style.zIndex = '1100';
  modal.innerHTML = `
    <div class="sa-chat-modal" style="height:auto;max-height:420px;">
      <div class="sa-chat-modal-header">
        <div class="sa-modal-header-info">
          <p class="sa-modal-customer-name">Create Return Request</p>
          <p class="sa-modal-subject">On behalf of customer</p>
        </div>
        <div class="sa-modal-header-actions">
          <button class="sa-modal-close-btn" id="sa-crm-close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div class="sa-cp-form-group">
          <label class="sa-cp-label">Select Order</label>
          <select class="sa-cp-select" id="sa-crm-order-select">
            <option value="">— choose order —</option>
            ${orders.filter(o => o.status !== 'CANCELLED').map(o =>
              `<option value="${o.id}">#${(o.orderNumber || o.id).toString().slice(0,8)} — ${o.status} — RM ${o.totalAmount ? (o.totalAmount*1.18).toFixed(2) : '—'}</option>`
            ).join('')}
          </select>
        </div>
        <div class="sa-cp-form-group">
          <label class="sa-cp-label">Reason for Return</label>
          <textarea class="sa-cp-textarea" id="sa-crm-reason" rows="3" placeholder="Describe the return reason…"></textarea>
        </div>
        <button class="sa-chat-btn sa-chat-btn--primary" id="sa-crm-submit" style="width:100%;justify-content:center;">Submit Return Request</button>
        <div id="sa-crm-msg" style="display:none;text-align:center;font-size:13px;font-weight:600;"></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('sa-crm-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  document.getElementById('sa-crm-submit').addEventListener('click', async () => {
    const orderId = document.getElementById('sa-crm-order-select').value;
    const reason = document.getElementById('sa-crm-reason').value.trim();
    const msgEl = document.getElementById('sa-crm-msg');
    if (!orderId) { msgEl.style.display='block'; msgEl.style.color='#ef4444'; msgEl.textContent='Please select an order.'; return; }
    if (!reason)  { msgEl.style.display='block'; msgEl.style.color='#ef4444'; msgEl.textContent='Please enter a reason.'; return; }
    const btn = document.getElementById('sa-crm-submit');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      await api('/api/returns', { method:'POST', body: JSON.stringify({ orderId, reason }) });
      msgEl.style.display='block'; msgEl.style.color='#10b981'; msgEl.textContent='✓ Return request created successfully!';
      setTimeout(() => modal.remove(), 1500);
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Submit Return Request';
      msgEl.style.display='block'; msgEl.style.color='#ef4444'; msgEl.textContent = err.message || 'Failed to create return.';
    }
  });
}

// ── render ─────────────────────────────────────────────────
export async function render(state) {
  _activeTab = state.activeSupportAgentTab || 'tickets';

  const user = ApiService.getCurrentUser();

  return `
    <div class="dash-root" id="sa-root">
      <aside class="dash-sidebar" id="sa-sidebar">
        <div class="dash-sidebar-header">
          <div class="dash-sidebar-logo">S</div>
          <div class="dash-sidebar-brand">
            Support Portal
            <span>${user?.firstName || 'Agent'} ${user?.lastName || ''}</span>
          </div>
        </div>
        <div class="dash-sidebar-section">
          <div class="dash-sidebar-label">Menu</div>
          <button class="dash-nav-item ${_activeTab==='tickets'?'active':''}" data-sa-tab="tickets">${ICONS.tickets}<span class="dash-nav-label">Tickets</span></button>
          <button class="dash-nav-item ${_activeTab==='chat'?'active':''}" data-sa-tab="chat">${ICONS.chat}<span class="dash-nav-label">Live Chat</span></button>
          <button class="dash-nav-item ${_activeTab==='customers'?'active':''}" data-sa-tab="customers">${ICONS.customers}<span class="dash-nav-label">Customers</span></button>
          <button class="dash-nav-item ${_activeTab==='profile'?'active':''}" data-sa-tab="profile">${ICONS.profile}<span class="dash-nav-label">My Profile</span></button>
        </div>
        <div style="margin-top:auto;padding:12px 14px;">
          <button class="dash-nav-item" id="sa-logout" style="color:#ef4444;">
            <svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span class="dash-nav-label">Logout</span>
          </button>
        </div>
      </aside>
      <main class="dash-content" id="sa-content">
        <div class="dash-content-inner" id="sa-tab-body">
          <div style="text-align:center;padding:48px;color:#94a3b8;">Loading tickets…</div>
        </div>
      </main>
    </div>
  `;
}

async function loadTab(tab) {
  if (_activeTab === 'chat' && tab !== 'chat') {
    unsubscribeWS('/topic/live-chat/sessions');
  }
  _activeTab = tab;
  const body = document.getElementById('sa-tab-body');
  if (!body) return;

  body.innerHTML = `<div style="text-align:center;padding:48px;color:#94a3b8;">Loading…</div>`;

  document.querySelectorAll('[data-sa-tab]').forEach(b => b.classList.toggle('active', b.dataset.saTab === tab));

  try {
    if (tab === 'tickets') {
      const res = await api('/api/support/tickets?page=0&size=100');
      _ticketCache = (res.data?.content || res.data || []);
      body.innerHTML = buildTicketsTab(_ticketCache);
      bindTicketTabEvents();
    } else if (tab === 'chat') {
      const res = await api('/api/support/live-chat/sessions?page=0&size=50');
      _chatCache = (res.data?.content || res.data || []);
      body.innerHTML = buildChatTab(_chatCache);
      bindChatTabEvents();
      connectWS(() => {
        subscribeWS('/topic/live-chat/sessions', (session) => {
          if (_activeTab !== 'chat') {
            unsubscribeWS('/topic/live-chat/sessions');
            return;
          }
          const sessionId = session.id || session.sessionId;
          const idx = _chatCache.findIndex(s => s.id === sessionId);
          if (idx >= 0) {
            _chatCache[idx] = session;
          } else {
            _chatCache.unshift(session);
          }
          body.innerHTML = buildChatTab(_chatCache);
          bindChatTabEvents();
        });
      });
    } else if (tab === 'customers') {
      const res = await api('/api/crm/customers');
      _customerCache = (res.data || []);
      body.innerHTML = buildCustomersTab(_customerCache);
      bindCustomerTabEvents();
    } else if (tab === 'profile') {
      body.innerHTML = buildProfileTab();
      bindSaProfileEvents();
    }
  } catch (e) {
    body.innerHTML = `<div class="dash-empty">Failed to load: ${e.message}</div>`;
  }
}

function bindTicketTabEvents() {
  function applyFilters() {
    const q = (document.getElementById('sa-ticket-search')?.value || '').toLowerCase();
    const s = document.getElementById('sa-ticket-status')?.value || '';
    const filtered = _ticketCache.filter(t => {
      const matchSearch = !q ||
        (t.title || t.subject || '').toLowerCase().includes(q) ||
        (t.customerFirstName || t.customerName || t.customer?.firstName || '').toLowerCase().includes(q) ||
        (t.customerEmail || t.customer?.email || '').toLowerCase().includes(q);
      const matchStatus = !s || t.status === s;
      return matchSearch && matchStatus;
    });
    document.getElementById('sa-tickets-tbody').innerHTML = buildTicketRows(filtered);
    bindTicketRowActions();
  }

  document.getElementById('sa-ticket-search')?.addEventListener('input', applyFilters);
  document.getElementById('sa-ticket-status')?.addEventListener('change', applyFilters);

  bindTicketRowActions();
}

function bindTicketRowActions() {
  document.querySelectorAll('[data-action="sa-view-ticket"]').forEach(btn => {
    btn.addEventListener('click', () => openTicketModal(btn.dataset.id));
  });

  document.querySelectorAll('[data-action="sa-assign-self"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const me = ApiService.getCurrentUser();
      if (!me?.id) return alert('Cannot determine your user ID.');
      btn.disabled = true;
      await api(`/api/support/tickets/${btn.dataset.id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ agentId: me.id })
      }).catch(console.error);
      loadTab('tickets');
    });
  });

  document.querySelectorAll('[data-action="sa-resolve-ticket"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Mark this ticket as resolved?')) return;
      await api(`/api/support/tickets/${btn.dataset.id}/resolve`, { method: 'PATCH' }).catch(console.error);
      loadTab('tickets');
    });
  });

  document.querySelectorAll('[data-action="sa-close-ticket"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Close this ticket?')) return;
      await api(`/api/support/tickets/${btn.dataset.id}/close`, { method: 'PATCH' }).catch(console.error);
      loadTab('tickets');
    });
  });
}

function bindChatTabEvents() {
  document.querySelectorAll('[data-action="sa-view-chat"]').forEach(btn => {
    btn.addEventListener('click', () => openChatModal(btn.dataset.id));
  });

  document.querySelectorAll('[data-action="sa-assign-chat"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const me = ApiService.getCurrentUser();
      if (!me?.id) return alert('Cannot determine your user ID.');
      btn.disabled = true;
      await api(`/api/support/live-chat/sessions/${btn.dataset.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ agentId: me.id })
      }).catch(console.error);
      loadTab('chat');
    });
  });

  document.querySelectorAll('[data-action="sa-close-chat"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Close this chat session?')) return;
      await api(`/api/support/live-chat/sessions/${btn.dataset.id}/close`, { method: 'POST' }).catch(console.error);
      loadTab('chat');
    });
  });
}

export async function bindEvents(state, helpers) {
  const headerEl = document.getElementById('app-header-container');
  if (headerEl) {
    const h = headerEl.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--admin-header-h', h + 'px');
  }

  document.querySelectorAll('[data-sa-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      helpers?.syncUrl?.({ currentView: 'support-agent', activeSupportAgentTab: btn.dataset.saTab });
      loadTab(btn.dataset.saTab);
    });
  });

  document.getElementById('sa-logout')?.addEventListener('click', () => {
    ApiService.logout?.();
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_user');
    localStorage.removeItem('luz_refresh_token');
    helpers?.navigate?.('home', { activeCategory: null });
  });

  await loadTab(_activeTab);
}
