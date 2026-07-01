import './ChatWidget.css';
import { ApiService } from '../api.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../chat-ws.js';

let _sessionId = null;
let _activeSession = null;
let _messagesHtml = '';
let _unreadCount = 0;
let _panelOpen = false;
let _loaded = false;
let _loading = false;

export async function render({ open = false } = {}) {
  _panelOpen = open;

  const agentLabel = _activeSession?.agent
    ? `<span class="chat-header-sub">Agent: ${_esc(_activeSession.agent.firstName || _activeSession.agent.email)}</span>`
    : `<span class="chat-header-sub">We respond in minutes</span>`;

  return `
    <button class="support-widget-bubble" id="support-bubble-btn" title="Live Chat">
      <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
      <span class="chat-bubble-badge" id="chat-unread-badge" style="display:none">0</span>
    </button>

    <div class="chat-panel" id="support-chat-panel" style="display:${open ? 'flex' : 'none'};">
      <div class="chat-header">
        <div class="chat-header-left">
          <div class="chat-header-avatar">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
          <div>
            <strong class="chat-header-title">Luz Support</strong>
            ${agentLabel}
          </div>
        </div>
        <div class="chat-header-actions">
          ${_sessionId ? '<button id="btn-end-chat" class="chat-end-btn" title="End chat">End</button>' : ''}
          <button id="close-chat-btn" class="chat-close-btn" title="Close">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="live-chat-messages-container">
        ${renderBody()}
      </div>

      ${_sessionId ? `
        <div class="chat-typing-bar" id="chat-typing-indicator" style="display:none">
          <span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>
          <span class="chat-typing-label">Agent is typing</span>
        </div>
        <form class="chat-input-row" id="live-chat-input-form">
          <input type="text" id="live-chat-input-element" class="chat-input" placeholder="Type a message..." autocomplete="off" required>
          <button class="chat-send-btn" type="submit" title="Send">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
      ` : ''}
    </div>
  `;
}

export function bindEvents(helpers) {
  const { renderChatWidget } = helpers;
  const bubble = document.getElementById('support-bubble-btn');
  const panel = document.getElementById('support-chat-panel');
  const badge = document.getElementById('chat-unread-badge');

  bubble?.addEventListener('click', async () => {
    if (!panel) return;
    _panelOpen = panel.style.display === 'none';
    panel.style.display = _panelOpen ? 'flex' : 'none';
    if (!_panelOpen) return;

    _unreadCount = 0;
    if (badge) badge.style.display = 'none';
    await ensureLoaded(renderChatWidget);
    _scrollBottom();
  });

  document.getElementById('close-chat-btn')?.addEventListener('click', () => {
    if (panel) panel.style.display = 'none';
    _panelOpen = false;
  });

  document.getElementById('btn-end-chat')?.addEventListener('click', async () => {
    if (!_sessionId || !confirm('End this chat session?')) return;
    try { await ApiService.chat.closeSession(_sessionId); } catch (_) {}
    unsubscribeWS(`/topic/live-chat/${_sessionId}`);
    unsubscribeWS('/topic/live-chat/sessions');
    _sessionId = null;
    _activeSession = null;
    _messagesHtml = '';
    _loaded = false;
    await renderChatWidget({ open: true });
  });

  document.getElementById('btn-start-chat')?.addEventListener('click', async () => {
    const subject = prompt('Briefly describe your issue:', 'Order inquiry');
    if (!subject) return;
    try {
      const res = await ApiService.chat.createSession(subject, 'Hello, I need help with: ' + subject);
      _sessionId = res.data?.id || res.data?.sessionId;
      _loaded = false;
      await loadExistingSession();
      await renderChatWidget({ open: true });
      _scrollBottom();
    } catch (_) {
      alert('Could not start chat. Please try again.');
    }
  });

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
    try {
      await ApiService.chat.sendMessage(_sessionId, msg);
    } catch (_) {}
  });

  subscribeToActiveSession(renderChatWidget, badge);
}

function renderBody() {
  if (_loading) {
    return `
      <div class="chat-empty-state">
        <div class="chat-empty-icon">
          <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        </div>
        <p class="chat-empty-title">Opening support...</p>
      </div>
    `;
  }

  if (_sessionId) return _messagesHtml;

  return `
    <div class="chat-empty-state">
      <div class="chat-empty-icon">
        <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
      </div>
      <p class="chat-empty-title">How can we help?</p>
      <p class="chat-empty-sub">Our support team is here for you. Start a conversation and we'll respond within minutes.</p>
      <button class="chat-start-btn" id="btn-start-chat">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path></svg>
        Start Conversation
      </button>
    </div>
  `;
}

async function ensureLoaded(renderChatWidget) {
  if (_loaded || _loading || !ApiService.getCurrentUser()) return;
  _loading = true;
  await renderChatWidget({ open: true });
  await loadExistingSession();
  _loading = false;
  await renderChatWidget({ open: true });
}

async function loadExistingSession() {
  let sessions = [];
  try {
    const res = await ApiService.chat.getMySessions();
    sessions = res.data || [];
  } catch (_) {}

  _activeSession = sessions.find(s => s.status === 'OPEN' || s.status === 'ASSIGNED') || null;
  _sessionId = _activeSession ? (_activeSession.id || _activeSession.sessionId) : null;
  _messagesHtml = '';

  if (_sessionId) {
    try {
      const res = await ApiService.chat.getMessages(_sessionId);
      const msgs = res.data || [];
      const me = ApiService.getCurrentUser();
      _messagesHtml = msgs.map(m => _bubble(m.message, m.senderId === me?.id, m.senderEmail)).join('');
    } catch (_) {}
  }

  _loaded = true;
}

function subscribeToActiveSession(renderChatWidget, badge) {
  if (!_sessionId) return;
  const me = ApiService.getCurrentUser();
  connectWS(() => {
    subscribeWS('/topic/live-chat/' + _sessionId, (msgData) => {
      if (msgData.senderId === me?.id) return;
      _appendBubble(msgData.message, false, msgData.senderEmail);
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

function _bubble(text, sent, label) {
  const lbl = !sent && label
    ? `<div class="chat-bubble-sender">${_esc(label.split('@')[0])}</div>` : '';
  return `<div class="chat-bubble ${sent ? 'sent' : 'received'}">${lbl}${_esc(text)}</div>`;
}

function _appendBubble(text, sent, label) {
  const c = document.getElementById('live-chat-messages-container');
  if (!c) return;
  c.insertAdjacentHTML('beforeend', _bubble(text, sent, label));
  _messagesHtml += _bubble(text, sent, label);
  _scrollBottom();
}

function _scrollBottom() {
  const c = document.getElementById('live-chat-messages-container');
  if (c) c.scrollTop = c.scrollHeight;
}

function _esc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
