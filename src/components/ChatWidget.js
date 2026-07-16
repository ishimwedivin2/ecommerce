import './ChatWidget.css';
import { ApiService } from '../api.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../chat-ws.js';

let _sessionId    = null;
let _activeSession = null;
let _messagesHtml = '';
let _unreadCount  = 0;
let _panelOpen    = false;
let _loaded       = false;
let _loading      = false;
let _selectedTopic = '';  // quick-topic chip selection

const TOPICS = [
  'Order issue',
  'Product question',
  'Return request',
  'Payment help',
  'Other',
];

export async function render({ open = false } = {}) {
  _panelOpen = open;

  const agentLabel = _activeSession?.agent
    ? `<span class="chat-header-sub">Agent: ${_esc(_activeSession.agent.firstName || _activeSession.agent.email)}</span>`
    : `<span class="chat-header-sub">We respond in minutes</span>`;

  return `
    <button class="support-widget-bubble" id="support-bubble-btn" title="Need help? Start a live chat">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
      <span class="chat-bubble-label">Chat</span>
      <span class="chat-bubble-badge" id="chat-unread-badge" style="display:none">0</span>
    </button>

    <div class="chat-panel${open ? ' chat-panel--open' : ''}" id="support-chat-panel" style="display:${open ? 'flex' : 'none'};">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-header-avatar">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div>
            <strong class="chat-header-title">Luz Support</strong>
            ${agentLabel}
          </div>
        </div>
        <div class="chat-header-actions">
          ${_sessionId ? '<button id="btn-end-chat" class="chat-end-btn" title="End chat">End</button>' : ''}
          <button id="close-chat-btn" class="chat-close-btn" title="Close">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="live-chat-messages-container">
        ${_renderBody()}
      </div>

      ${_sessionId ? `
        <div class="chat-typing-bar" id="chat-typing-indicator" style="display:none">
          <span class="chat-typing-dot"></span>
          <span class="chat-typing-dot"></span>
          <span class="chat-typing-dot"></span>
          <span class="chat-typing-label">Agent is typing</span>
        </div>
        <form class="chat-input-row" id="live-chat-input-form">
          <input type="text" id="live-chat-input-element" class="chat-input"
            placeholder="Type a message…" autocomplete="off" required>
          <button class="chat-send-btn" type="submit" title="Send">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          </button>
        </form>
      ` : ''}
    </div>
  `;
}

export function bindEvents(helpers) {
  const { renderChatWidget } = helpers;
  const bubble = document.getElementById('support-bubble-btn');
  const panel  = document.getElementById('support-chat-panel');
  const badge  = document.getElementById('chat-unread-badge');

  // ── Toggle panel open/close with animation ──
  bubble?.addEventListener('click', async () => {
    if (!panel) return;
    if (_panelOpen) {
      _closePanel(panel);
    } else {
      _openPanel(panel);
      _unreadCount = 0;
      if (badge) badge.style.display = 'none';
      await _ensureLoaded(renderChatWidget);
      _scrollBottom();
    }
  });

  // ── Close button with animation ──
  document.getElementById('close-chat-btn')?.addEventListener('click', () => {
    if (panel) _closePanel(panel);
  });

  // ── End session — two-step inline confirm ──
  document.getElementById('btn-end-chat')?.addEventListener('click', () => {
    if (!_sessionId) return;
    const btn = document.getElementById('btn-end-chat');
    if (!btn) return;

    if (btn.dataset.confirming === 'true') {
      // Second click — confirmed, proceed
      btn.dataset.confirming = 'false';
      btn.textContent = 'End';
      btn.style.background = '';
      btn.style.borderColor = '';
      clearTimeout(btn._confirmTimer);
      (async () => {
        try { await ApiService.chat.closeSession(_sessionId); } catch (_) {}
        unsubscribeWS(`/topic/live-chat/${_sessionId}`);
        unsubscribeWS('/topic/live-chat/sessions');
        _sessionId     = null;
        _activeSession = null;
        _messagesHtml  = '';
        _loaded        = false;
        _selectedTopic = '';
        await renderChatWidget({ open: true });
      })();
    } else {
      // First click — ask inline
      btn.dataset.confirming = 'true';
      btn.textContent = 'Sure?';
      btn.style.background = 'rgba(239,68,68,0.25)';
      btn.style.borderColor = '#ef4444';
      // Auto-reset after 4s if user doesn't confirm
      btn._confirmTimer = setTimeout(() => {
        btn.dataset.confirming = 'false';
        btn.textContent = 'End';
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 4000);
    }
  });

  // ── Sign-in prompt inside guest chat panel ──
  document.getElementById('btn-chat-signin')?.addEventListener('click', () => {
    const panel = document.getElementById('support-chat-panel');
    if (panel) _closePanel(panel);
    import('../router.js').then(m => {
      m.helpers.syncUrl({ authModalMode: 'login' });
      m.renderAuthModal();
    });
  });

  // ── Quick topic chip selection (event delegation) ──
  panel?.addEventListener('click', e => {
    const chip = e.target.closest('.chat-topic-chip');
    if (!chip) return;
    _selectedTopic = chip.dataset.topic;
    // update chip highlight
    panel.querySelectorAll('.chat-topic-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    // fill subject input with the chosen topic
    const subjectInput = document.getElementById('chat-subject-input');
    if (subjectInput && !subjectInput.value) subjectInput.value = _selectedTopic;
    subjectInput?.focus();
  });

  // ── Start conversation (inline form) ──
  document.getElementById('btn-start-chat')?.addEventListener('click', async () => {
    // Auth check — must be logged in to start a chat session
    if (!ApiService.getCurrentUser()) {
      import('../router.js').then(m => {
        import('./toast.js').then(t => t.showToast('Sign in to start a live chat', 'info'));
        m.helpers.syncUrl({ authModalMode: 'login' });
        m.renderAuthModal();
      });
      const panel = document.getElementById('support-chat-panel');
      if (panel) _closePanel(panel);
      return;
    }

    const subjectInput = document.getElementById('chat-subject-input');
    const subject = subjectInput?.value.trim() || _selectedTopic || 'General inquiry';

    const btn = document.getElementById('btn-start-chat');
    if (btn) { btn.disabled = true; btn.textContent = 'Starting…'; }

    try {
      const res = await ApiService.chat.createSession(subject, 'Hello, I need help with: ' + subject);
      _sessionId     = res.data?.id || res.data?.sessionId;
      _selectedTopic = '';
      _loaded        = false;
      await _loadExistingSession();
      await renderChatWidget({ open: true });
      _scrollBottom();
    } catch (_) {
      if (btn) { btn.disabled = false; btn.textContent = 'Start Conversation'; }
      const errEl = document.getElementById('chat-start-error');
      if (errEl) errEl.textContent = 'Could not start chat. Please try again.';
    }
  });

  // ── Send message ──
  const chatForm = document.getElementById('live-chat-input-form');
  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!_sessionId) return;
    const input = document.getElementById('live-chat-input-element');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const me = ApiService.getCurrentUser();
    _appendBubble(msg, true, me?.email);
    try { await ApiService.chat.sendMessage(_sessionId, msg); } catch (_) {}
  });

  _subscribeToActiveSession(renderChatWidget, badge);
}

// ── Body renderer ─────────────────────────────────────────────────
function _renderBody() {
  if (_loading) {
    return `
      <div class="chat-empty-state">
        <div class="chat-empty-icon">
          <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <p class="chat-empty-title">Connecting…</p>
      </div>
    `;
  }

  if (_sessionId) return _messagesHtml;

  // ── Guest state — not logged in ──
  if (!ApiService.getCurrentUser()) {
    return `
      <div class="chat-empty-state">
        <div class="chat-empty-icon">
          <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <p class="chat-empty-title">Sign in to chat</p>
        <p class="chat-empty-sub">You need an account to start a live chat with our support team.</p>
        <button class="chat-start-btn" id="btn-chat-signin">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
          Sign In
        </button>
      </div>
    `;
  }

  // ── Empty state with inline start form ──
  const topicChips = TOPICS.map(t => `
    <button type="button" class="chat-topic-chip${_selectedTopic === t ? ' selected' : ''}" data-topic="${t}">${t}</button>
  `).join('');

  return `
    <div class="chat-empty-state">
      <div class="chat-empty-icon">
        <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      </div>
      <p class="chat-empty-title">How can we help?</p>
      <p class="chat-empty-sub">Pick a topic or describe your issue below.</p>

      <div class="chat-topics">${topicChips}</div>

      <div class="chat-start-form">
        <input
          type="text"
          id="chat-subject-input"
          class="chat-subject-input"
          placeholder="Describe your issue…"
          maxlength="120"
          value="${_esc(_selectedTopic)}"
        >
        <div id="chat-start-error" style="font-size:11px;color:#ef4444;min-height:14px;text-align:center;"></div>
        <button class="chat-start-btn" id="btn-start-chat">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
          </svg>
          Start Conversation
        </button>
      </div>
    </div>
  `;
}

// ── Panel open / close with animation ────────────────────────────
function _openPanel(panel) {
  panel.style.display = 'flex';
  panel.classList.remove('chat-panel--closing');
  panel.classList.add('chat-panel--open');
  _panelOpen = true;
}

function _closePanel(panel) {
  panel.classList.remove('chat-panel--open');
  panel.classList.add('chat-panel--closing');
  _panelOpen = false;
  panel.addEventListener('animationend', () => {
    panel.style.display = 'none';
    panel.classList.remove('chat-panel--closing');
  }, { once: true });
}

// ── Load sessions ─────────────────────────────────────────────────
async function _ensureLoaded(renderChatWidget) {
  if (_loaded || _loading || !ApiService.getCurrentUser()) return;
  _loading = true;
  await renderChatWidget({ open: true });
  await _loadExistingSession();
  _loading = false;
  await renderChatWidget({ open: true });
}

async function _loadExistingSession() {
  let sessions = [];
  try {
    const res = await ApiService.chat.getMySessions();
    sessions = res.data || [];
  } catch (_) {}

  _activeSession = sessions.find(s => s.status === 'OPEN' || s.status === 'ASSIGNED') || null;
  _sessionId     = _activeSession ? (_activeSession.id || _activeSession.sessionId) : null;
  _messagesHtml  = '';

  if (_sessionId) {
    try {
      const res  = await ApiService.chat.getMessages(_sessionId);
      const msgs = res.data || [];
      const me   = ApiService.getCurrentUser();
      _messagesHtml = msgs.map(m =>
        _bubble(m.message, m.senderId === me?.id, m.senderEmail, m.createdAt)
      ).join('');
    } catch (_) {}
  }
  _loaded = true;
}

// ── WebSocket subscription ────────────────────────────────────────
function _subscribeToActiveSession(renderChatWidget, badge) {
  if (!_sessionId) return;
  const me = ApiService.getCurrentUser();
  connectWS(() => {
    subscribeWS('/topic/live-chat/' + _sessionId, (msgData) => {
      if (msgData.senderId === me?.id) return;
      _appendBubble(msgData.message, false, msgData.senderEmail, msgData.createdAt);
      if (!_panelOpen) {
        _unreadCount++;
        if (badge) {
          badge.textContent = _unreadCount > 9 ? '9+' : _unreadCount;
          badge.style.display = 'flex';
        }
      }
    });
    subscribeWS('/topic/live-chat/sessions', (session) => {
      if ((session.id || session.sessionId) === _sessionId) {
        _loaded = false;
        renderChatWidget({ open: _panelOpen });
      }
    });
  });
}

// ── Bubble helpers ────────────────────────────────────────────────
function _bubble(text, sent, label, timestamp) {
  const senderLine = !sent && label
    ? `<div class="chat-bubble-sender">${_esc(label.split('@')[0])}</div>` : '';
  const timeLine = timestamp
    ? `<div class="chat-bubble-time">${_relativeTime(timestamp)}</div>` : '';
  return `<div class="chat-bubble ${sent ? 'sent' : 'received'}">${senderLine}${_esc(text)}${timeLine}</div>`;
}

function _appendBubble(text, sent, label, timestamp) {
  const c = document.getElementById('live-chat-messages-container');
  if (!c) return;
  const html = _bubble(text, sent, label, timestamp);
  c.insertAdjacentHTML('beforeend', html);
  _messagesHtml += html;
  _scrollBottom();
}

function _scrollBottom() {
  const c = document.getElementById('live-chat-messages-container');
  if (c) c.scrollTop = c.scrollHeight;
}

// ── Utilities ─────────────────────────────────────────────────────
function _esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _relativeTime(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}
