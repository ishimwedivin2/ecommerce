import '../admin/style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

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

// ── Icons ──────────────────────────────────────────────────
const ICONS = {
  tickets:  `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
  chat:     `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
  profile:  `<svg class="dash-nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`,
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
  if (!sessions.length) return `<div class="dash-empty">No live chat sessions.</div>`;
  return `
    <div class="dash-section-header">
      <h3>Live Chat Sessions</h3>
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr>
          <th>Session</th><th>Customer</th><th>Status</th><th>Started</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${sessions.map(s => `
            <tr>
              <td style="font-size:11px;color:#94a3b8;">#${(s.id||'').toString().slice(0,8)}</td>
              <td>${s.customerName || s.customer?.firstName || '—'}</td>
              <td>${statusBadge(s.status || 'OPEN')}</td>
              <td style="font-size:12px;color:#64748b;">${fmtDate(s.createdAt)}</td>
              <td>
                <button class="dash-action-btn" data-action="sa-assign-chat" data-id="${s.id}">Assign to Me</button>
                ${s.status !== 'CLOSED'
                  ? `<button class="dash-action-btn danger" data-action="sa-close-chat" data-id="${s.id}">Close</button>`
                  : ''}
              </td>
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
        <div style="width:56px;height:56px;border-radius:50%;background:#FF6B00;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:700;">
          ${(user.firstName||'S')[0]}
        </div>
        <div>
          <div style="font-weight:700;font-size:16px;">${user.firstName || ''} ${user.lastName || ''}</div>
          <div style="font-size:13px;color:#64748b;">Support Agent</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;">
        <div><span style="color:#64748b;width:80px;display:inline-block;">Email</span>${user.email || '—'}</div>
        <div><span style="color:#64748b;width:80px;display:inline-block;">Phone</span>${user.phoneNumber || '—'}</div>
      </div>
    </div>
  `;
}

// ── Ticket detail modal ────────────────────────────────────
async function openTicketModal(ticketId) {
  const [ticketRes, msgsRes] = await Promise.all([
    api(`/api/support/tickets/${ticketId}`).catch(() => ({})),
    api(`/api/support/tickets/${ticketId}/messages`).catch(() => ({})),
  ]);

  const ticket = ticketRes?.data || _ticketCache.find(t => t.id == ticketId) || {};
  const messages = Array.isArray(msgsRes.data) ? msgsRes.data : [];

  const overlay = document.createElement('div');
  overlay.id = 'sa-ticket-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:white;border-radius:14px;width:560px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;font-size:15px;">${ticket.title || ticket.subject || 'Ticket'} ${statusBadge(ticket.status)}</h3>
        <button id="sa-modal-close" style="background:none;border:none;cursor:pointer;font-size:20px;color:#94a3b8;">×</button>
      </div>
      <div id="sa-msg-list" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;">
        ${messages.length ? messages.map(m => {
          const isCustomer = m.sender?.id === ticket.customer?.id;
          const senderName = isCustomer
            ? (m.sender?.firstName || 'Customer')
            : (m.sender?.firstName || 'Agent');
          return `
          <div style="max-width:80%;${isCustomer?'align-self:flex-start;':'align-self:flex-end;'}">
            <div style="font-size:10px;color:#94a3b8;margin-bottom:3px;${isCustomer?'':'text-align:right'}">${senderName}</div>
            <div style="background:${isCustomer?'#f1f5f9':'#FF6B00'};color:${isCustomer?'#1e293b':'white'};padding:10px 14px;border-radius:12px;font-size:13px;">${m.message}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:3px;text-align:${isCustomer?'left':'right'}">${fmtDate(m.createdAt)}</div>
          </div>
        `}).join('') : '<div style="color:#94a3b8;text-align:center;">No messages yet</div>'}
      </div>
      ${ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' ? `
        <div style="padding:14px 16px;border-top:1px solid #e2e8f0;display:flex;gap:8px;">
          <input id="sa-reply-input" style="flex:1;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;" placeholder="Type reply…">
          <button id="sa-reply-send" class="dash-action-btn" data-ticket-id="${ticketId}">Send</button>
        </div>
      ` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('sa-modal-close').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const replyBtn = document.getElementById('sa-reply-send');
  const replyInput = document.getElementById('sa-reply-input');

  async function sendReply() {
    const msg = replyInput?.value.trim();
    if (!msg) return;
    replyBtn.disabled = true;
    replyBtn.textContent = 'Sending…';
    await api(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: msg })
    }).catch(console.error);
    overlay.remove();
    openTicketModal(ticketId);
  }

  replyBtn?.addEventListener('click', sendReply);
  replyInput?.addEventListener('keydown', e => { if (e.key === 'Enter') sendReply(); });
}

// ── render ─────────────────────────────────────────────────
export async function render(state) {
  _activeTab = 'tickets';

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
          <button class="dash-nav-item active" data-sa-tab="tickets">${ICONS.tickets}<span class="dash-nav-label">Tickets</span></button>
          <button class="dash-nav-item" data-sa-tab="chat">${ICONS.chat}<span class="dash-nav-label">Live Chat</span></button>
          <button class="dash-nav-item" data-sa-tab="profile">${ICONS.profile}<span class="dash-nav-label">My Profile</span></button>
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
    } else if (tab === 'profile') {
      body.innerHTML = buildProfileTab();
    }
  } catch (e) {
    body.innerHTML = `<div class="dash-empty">Failed to load: ${e.message}</div>`;
  }
}

function bindTicketTabEvents() {
  document.getElementById('sa-ticket-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = _ticketCache.filter(t =>
      (t.subject||'').toLowerCase().includes(q) ||
      (t.customerName||'').toLowerCase().includes(q)
    );
    document.getElementById('sa-tickets-tbody').innerHTML = buildTicketRows(filtered);
    bindTicketRowActions();
  });

  document.getElementById('sa-ticket-status')?.addEventListener('change', e => {
    const s = e.target.value;
    const filtered = s ? _ticketCache.filter(t => t.status === s) : _ticketCache;
    document.getElementById('sa-tickets-tbody').innerHTML = buildTicketRows(filtered);
    bindTicketRowActions();
  });

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
      await api(`/api/support/tickets/${btn.dataset.id}/close`, { method: 'PATCH' }).catch(console.error);
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
  document.querySelectorAll('[data-action="sa-assign-chat"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const me = ApiService.getCurrentUser();
      btn.disabled = true;
      await api(`/api/support/live-chat/sessions/${btn.dataset.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ agentId: me?.id })
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
    btn.addEventListener('click', () => loadTab(btn.dataset.saTab));
  });

  document.getElementById('sa-logout')?.addEventListener('click', () => {
    ApiService.logout?.();
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_user');
    localStorage.removeItem('luz_refresh_token');
    setState({ currentView: 'home' });
    import('../../router.js').then(m => m.renderAll());
  });

  await loadTab('tickets');
}
