import './ChatWidget.css';
import { ApiService } from '../api.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../chat-ws.js';

// ── module state ──────────────────────────────────────────
let _sessionId     = null;
let _activeSession = null;
let _messagesHtml  = '';
let _unreadCount   = 0;
let _panelOpen     = false;
let _loaded        = false;
let _loading       = false;
let _selectedTopic = '';

// Fix 4: subscription guard — tracks whether WS subscriptions are active
// so we never register the same channel twice.
let _subscribedSessionId  = null;  // which session we're subscribed to
let _subscribedSessions   = false; // whether /topic/live-chat/sessions is subscribed

const TOPICS = ['Order issue', 'Product question', 'Return request', 'Payment help', 'Other'];

// ── render ────────────────────────────────────────────────
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

// ── bindEvents ────────────────────────────────────────────
export function bindEvents(helpers) {
  const { renderChatWidget } = helpers;
  const bubble = document.getElementById('support-bubble-btn');
  const panel  = document.getElementById('support-chat-panel');
  const badge  = document.getElementById('chat-unread-badge');

  // ── Toggle panel open/close ──
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

  // ── Close button ──
  document.getElementById('close-chat-btn')?.addEventListener('click', () => {
    if (panel) _closePanel(panel);
  });

  // ── End session ──
  document.getElementById('btn-end-chat')?.addEventListener('click', () => {
    if (!_sessionId) return;
    const btn = document.getElementById('btn-end-chat');
    if (!btn) return;

    if (btn.dataset.confirming === 'true') {
      btn.dataset.confirming = 'false';
      btn.textContent = 'End';
      btn.style.background = '';
      btn.style.borderColor = '';
      clearTimeout(btn._confirmTimer);
      (async () => {
        try { await ApiService.chat.closeSession(_sessionId); } catch (_) {}
        _teardownSubscriptions();
        _sessionId     = null;
        _activeSession = null;
        _messagesHtml  = '';
        _loaded        = false;
        _selectedTopic = '';
        await renderChatWidget({ open: true });
      })();
    } else {
      btn.dataset.confirming = 'true';
      btn.textContent = 'Sure?';
      btn.style.background = 'rgba(239,68,68,0.25)';
      btn.style.borderColor = '#ef4444';
      btn._confirmTimer = setTimeout(() => {
        btn.dataset.confirming = 'false';
        btn.textContent = 'End';
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 4000);
    }
  });

  // ── Sign-in prompt ──
  document.getElementById('btn-chat-signin')?.addEventListener('click', () => {
    const panel = document.getElementById('support-chat-panel');
    if (panel) _closePanel(panel);
    import('../router.js').then(m => {
      m.helpers.syncUrl({ authModalMode: 'login' });
      m.renderAuthModal();
    });
  });

  // ── Quick topic chips ──
  panel?.addEventListener('click', e => {
    const chip = e.target.closest('.chat-topic-chip');
    if (!chip) return;
    _selectedTopic = chip.dataset.topic;
    panel.querySelectorAll('.chat-topic-chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    const subjectInput = document.getElementById('chat-subject-input');
    if (subjectInput && !subjectInput.value) subjectInput.value = _selectedTopic;
    subjectInput?.focus();
  });

  // ── Start conversation ──
  document.getElementById('btn-start-chat')?.addEventListener('click', async () => {
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
    _appendBubble(msg, true, me?.email, new Date().toISOString());
    try { await ApiService.chat.sendMessage(_sessionId, msg); } catch (_) {}
  });

  // Fix 4: only set up WS subscriptions if not already active for this session
  _setupSubscriptions(renderChatWidget, badge);
}

// ── Body renderer ─────────────────────────────────────────
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
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l-4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
          </svg>
          Sign In
        </button>
      </div>
    `;
  }

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
        <input type="text" id="chat-subject-input" class="chat-subject-input"
          placeholder="Describe your issue…" maxlength="120" value="${_esc(_selectedTopic)}">
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

// ── Panel animation ───────────────────────────────────────
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

// ── Session loading ───────────────────────────────────────
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

  if (_sessionId) {
    try {
      const res  = await ApiService.chat.getMessages(_sessionId);
      const msgs = res.data || [];
      const me   = ApiService.getCurrentUser();

      // Fix 1: backend returns sentAt, not createdAt
      // Fix 3: build into temp first — only replace _messagesHtml on full success
      const built = msgs.map(m =>
        _bubble(m.message, m.senderId === me?.id, m.senderEmail, m.sentAt || m.createdAt)
      ).join('');
      _messagesHtml = built;
    } catch (_) {
      // Do NOT wipe _messagesHtml on error — keep whatever we had before
    }
  } else {
    // Only clear when there genuinely is no active session
    _messagesHtml = '';
  }

  _loaded = true;
}

// ── WebSocket subscriptions ───────────────────────────────

/**
 * Fix 4: Tear down both subscriptions cleanly.
 * Called before re-subscribing and when the session ends.
 */
function _teardownSubscriptions() {
  if (_subscribedSessionId) {
    unsubscribeWS('/topic/live-chat/' + _subscribedSessionId);
    _subscribedSessionId = null;
  }
  if (_subscribedSessions) {
    unsubscribeWS('/topic/live-chat/sessions');
    _subscribedSessions = false;
  }
}

/**
 * Fix 4: Only subscribe if not already subscribed for this exact session.
 * Replaces the old _subscribeToActiveSession which had no guard.
 */
function _setupSubscriptions(renderChatWidget, badge) {
  if (!_sessionId) return;
  const me = ApiService.getCurrentUser();

  connectWS(() => {
    // ── Message channel — guard against duplicate subscriptions ──
    if (_subscribedSessionId !== _sessionId) {
      // Unsubscribe from any previous session's message channel first
      if (_subscribedSessionId) {
        unsubscribeWS('/topic/live-chat/' + _subscribedSessionId);
      }

      subscribeWS('/topic/live-chat/' + _sessionId, (msgData) => {
        // Ignore own messages (already shown optimistically on send)
        if (msgData.senderId === me?.id) return;

        // Fix 1: use sentAt, fallback to createdAt
        _appendBubble(
          msgData.message,
          false,
          msgData.senderEmail,
          msgData.sentAt || msgData.createdAt
        );

        if (!_panelOpen) {
          _unreadCount++;
          if (badge) {
            badge.textContent = _unreadCount > 9 ? '9+' : _unreadCount;
            badge.style.display = 'flex';
          }
        }
      });

      _subscribedSessionId = _sessionId;
    }

    // ── Session-updates channel — guard against duplicate subscriptions ──
    if (!_subscribedSessions) {
      subscribeWS('/topic/live-chat/sessions', (session) => {
        const incomingId = session.id || session.sessionId;
        if (incomingId !== _sessionId) return;

        // Fix 2: DO NOT do a full re-render for every session event.
        // Only act on meaningful state changes:

        const newStatus = session.status;

        // Case A: agent was assigned — update header sub-label only, no re-render
        if (newStatus === 'ASSIGNED' && session.agent) {
          _activeSession = session;
          const sub = document.querySelector('.chat-header-sub');
          if (sub) {
            sub.textContent = 'Agent: ' + (session.agent.firstName || session.agent.email || 'Support');
          }
          return;
        }

        // Case B: session was closed by agent — do a full re-render to remove the
        // input form and show a "session closed" state, which requires new DOM
        if (newStatus === 'CLOSED') {
          _teardownSubscriptions();
          _sessionId     = null;
          _activeSession = null;
          _loaded        = false;
          renderChatWidget({ open: _panelOpen });
          return;
        }

        // Case C: any other update (e.g. OPEN → ASSIGNED timing) — update in memory only
        _activeSession = session;
      });

      _subscribedSessions = true;
    }
  });
}

// ── Bubble helpers ────────────────────────────────────────
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

// ── Utilities ─────────────────────────────────────────────
function _esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _relativeTime(ts) {
  if (!ts) return '';
  const date  = new Date(ts);
  const diff  = Math.floor((Date.now() - date.getTime()) / 1000);
  const clock = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  if (diff < 10)    return `just now · ${clock}`;
  if (diff < 60)    return `${diff}s ago · ${clock}`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago · ${clock}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago · ${clock}`;
  const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${dateLabel} · ${clock}`;
}
