import '../admin/style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';
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
  const me = ApiService.getCurrentUser();
  return `
    <div class="dash-section-header">
      <h3>Live Chat Sessions</h3>
    </div>
    <div class="dash-table-wrap">
      <table class="dash-table">
        <thead><tr>
          <th>Session</th><th>Customer</th><th>Subject</th><th>Status</th><th>Started</th><th>Actions</th>
        </tr></thead>
        <tbody>
          ${sessions.map(s => {
            const isAssignedToMe = s.agent?.id === me?.id;
            return `
            <tr>
              <td style="font-size:11px;color:#94a3b8;">#${(s.id||'').toString().slice(0,8)}</td>
              <td>${s.customer?.firstName || s.customerName || '—'} ${s.customer?.lastName || ''}</td>
              <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.subject || '—'}</td>
              <td>${statusBadge(s.status || 'OPEN')}</td>
              <td style="font-size:12px;color:#64748b;">${fmtDate(s.createdAt)}</td>
              <td style="display:flex;gap:4px;flex-wrap:wrap;">
                <button class="dash-action-btn" data-action="sa-view-chat" data-id="${s.id}">View Chat</button>
                ${s.status !== 'CLOSED' && !isAssignedToMe
                  ? `<button class="dash-action-btn" data-action="sa-assign-chat" data-id="${s.id}">Assign to Me</button>`
                  : ''}
                ${s.status !== 'CLOSED'
                  ? `<button class="dash-action-btn danger" data-action="sa-close-chat" data-id="${s.id}">Close</button>`
                  : ''}
              </td>
            </tr>
          `}).join('')}
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
          const isCustomer = m.senderId === (ticket.customerId || ticket.customer?.id);
          const senderName = isCustomer
            ? (m.senderFirstName || 'Customer')
            : (m.senderFirstName || 'Agent');
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

// ── Chat session modal ─────────────────────────────────────
async function openChatModal(sessionId) {
  const me = ApiService.getCurrentUser();

  const msgsRes = await api(`/api/support/live-chat/sessions/${sessionId}/messages`).catch(() => ({}));
  const messages = Array.isArray(msgsRes.data) ? msgsRes.data : [];

  // Find session in cache for subject / status
  const session = _chatCache.find(s => s.id === sessionId) || {};
  const isClosed = session.status === 'CLOSED';

  function buildMsgHtml(msgs) {
    if (!msgs.length) return '<div style="color:#94a3b8;text-align:center;padding:24px;">No messages yet</div>';
    return msgs.map(m => {
      const isMe = m.senderId === me?.id;
      const label = isMe ? 'You' : (m.senderEmail ? m.senderEmail.split('@')[0] : 'Customer');
      return `
        <div style="max-width:80%;${isMe ? 'align-self:flex-end;' : 'align-self:flex-start;'}">
          <div style="font-size:10px;color:#94a3b8;margin-bottom:3px;${isMe ? 'text-align:right;' : ''}">${label}</div>
          <div style="background:${isMe ? '#FF6B00' : '#f1f5f9'};color:${isMe ? 'white' : '#1e293b'};padding:10px 14px;border-radius:12px;font-size:13px;">${String(m.message).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:3px;text-align:${isMe ? 'right' : 'left'};">${fmtDate(m.sentAt || m.createdAt)}</div>
        </div>
      `;
    }).join('');
  }

  const overlay = document.createElement('div');
  overlay.id = 'sa-chat-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:white;border-radius:14px;width:580px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:700;font-size:15px;">${session.subject || 'Live Chat'}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">
            Customer: ${session.customer?.firstName || '—'} ${session.customer?.lastName || ''}
            &nbsp;·&nbsp; ${statusBadge(session.status || 'OPEN')}
          </div>
        </div>
        <button id="sa-chat-modal-close" style="background:none;border:none;cursor:pointer;font-size:22px;color:#94a3b8;line-height:1;">×</button>
      </div>
      <div id="sa-chat-msg-list" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;">
        ${buildMsgHtml(messages)}
      </div>
      ${!isClosed ? `
        <div style="padding:14px 16px;border-top:1px solid #e2e8f0;display:flex;gap:8px;">
          <input id="sa-chat-reply-input" style="flex:1;padding:9px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;" placeholder="Type a reply…" autocomplete="off">
          <button id="sa-chat-reply-send" class="dash-action-btn" style="padding:9px 18px;">Send</button>
        </div>
      ` : '<div style="padding:12px 16px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;">This session is closed</div>'}
    </div>
  `;

  document.body.appendChild(overlay);

  const msgList = document.getElementById('sa-chat-msg-list');
  function scrollBottom() { if (msgList) msgList.scrollTop = msgList.scrollHeight; }
  scrollBottom();

  // Real-time incoming messages
  connectWS(() => {
    subscribeWS('/topic/live-chat/' + sessionId, (msgData) => {
      // Skip own messages — REST response already handles optimistic local append
      if (msgData.senderId === me?.id) return;
      const el = document.createElement('div');
      const label = msgData.senderEmail ? msgData.senderEmail.split('@')[0] : 'Customer';
      el.style.cssText = 'max-width:80%;align-self:flex-start;';
      el.innerHTML = `
        <div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">${label}</div>
        <div style="background:#f1f5f9;color:#1e293b;padding:10px 14px;border-radius:12px;font-size:13px;">${String(msgData.message).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:3px;">${fmtDate(msgData.sentAt)}</div>
      `;
      msgList?.appendChild(el);
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
    const replyBtn = document.getElementById('sa-chat-reply-send');

    async function sendReply() {
      const msg = replyInput?.value.trim();
      if (!msg) return;
      replyBtn.disabled = true;
      replyBtn.textContent = 'Sending…';
      // Optimistic local append
      const el = document.createElement('div');
      el.style.cssText = 'max-width:80%;align-self:flex-end;';
      el.innerHTML = `
        <div style="font-size:10px;color:#94a3b8;margin-bottom:3px;text-align:right;">You</div>
        <div style="background:#FF6B00;color:white;padding:10px 14px;border-radius:12px;font-size:13px;">${String(msg).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      `;
      msgList?.appendChild(el);
      scrollBottom();
      replyInput.value = '';
      replyBtn.disabled = false;
      replyBtn.textContent = 'Send';
      await api(`/api/support/live-chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      }).catch(console.error);
    }

    replyBtn.addEventListener('click', sendReply);
    replyInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendReply(); });
    replyInput.focus();
  }
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
