import './ChatWidget.css';
import { ApiService } from '../api.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../chat-ws.js';

let _sessionId = null;

export async function render() {
  let sessions = [];
  try {
    const res = await ApiService.chat.getMySessions();
    sessions = res.data || [];
  } catch (_) {}

  const active = sessions.find(s => s.status === 'OPEN' || s.status === 'ASSIGNED');
  _sessionId = active ? (active.id || active.sessionId) : null;

  let messagesHtml = '';
  if (_sessionId) {
    try {
      const res = await ApiService.chat.getMessages(_sessionId);
      const msgs = res.data || [];
      const me = ApiService.getCurrentUser();
      messagesHtml = msgs.map(m => _bubble(m.message, m.senderId === me?.id, m.senderEmail)).join('');
    } catch (_) {}
  }

  const agentLabel = active?.agent
    ? `<span style="font-size:10px;opacity:0.9;font-weight:500;margin-top:2px;">Agent: ${active.agent.firstName || active.agent.email}</span>`
    : `<span style="font-size:10px;opacity:0.9;font-weight:500;margin-top:2px;">We respond in minutes</span>`;

  return `
    <button class="support-widget-bubble" id="support-bubble-btn" title="Live Chat">
      <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
    </button>

    <div class="chat-panel" id="support-chat-panel" style="display:none;">
      <div class="chat-header">
        <div>
          <strong>Luz Support Chat</strong>
          ${agentLabel}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${_sessionId ? '<button id="btn-end-chat" title="End chat" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;">End</button>' : ''}
          <button id="close-chat-btn" style="color:white;font-size:20px;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:none;border:none;cursor:pointer;">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="live-chat-messages-container">
        ${_sessionId ? messagesHtml : `
          <div style="text-align:center;padding:32px 20px;color:var(--text-light);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
            <svg width="48" height="48" fill="none" stroke="var(--slate-300)" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p style="font-size:13.5px;color:var(--slate-600);line-height:1.5;max-width:240px;">Need help with your order or account?</p>
            <button class="btn-primary" id="btn-start-chat" style="margin-top:20px;font-size:13px;padding:10px 20px;">
              Start Support Chat
            </button>
          </div>
        `}
      </div>

      ${_sessionId ? `
        <form class="chat-input-row" id="live-chat-input-form">
          <input type="text" id="live-chat-input-element" placeholder="Type a message..." autocomplete="off" required>
          <button class="btn-primary" style="padding:10px 16px;" type="submit">Send</button>
        </form>
      ` : ''}
    </div>
  `;
}

export function bindEvents(helpers) {
  const { renderChatWidget } = helpers;
  const bubble = document.getElementById('support-bubble-btn');
  const panel  = document.getElementById('support-chat-panel');

  bubble?.addEventListener('click', () => {
    if (!panel) return;
    const open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'flex';
    if (!open) _scrollBottom();
  });

  document.getElementById('close-chat-btn')?.addEventListener('click', () => {
    if (panel) panel.style.display = 'none';
  });

  document.getElementById('btn-end-chat')?.addEventListener('click', async () => {
    if (!_sessionId || !confirm('End this chat session?')) return;
    try { await ApiService.chat.closeSession(_sessionId); } catch (_) {}
    unsubscribeWS(`/topic/live-chat/${_sessionId}`);
    unsubscribeWS('/topic/live-chat/sessions');
    _sessionId = null;
    renderChatWidget();
  });

  document.getElementById('btn-start-chat')?.addEventListener('click', async () => {
    const subject = prompt('Briefly describe your issue:', 'Order inquiry');
    if (!subject) return;
    try {
      const res = await ApiService.chat.createSession(subject, 'Hello, I need help with: ' + subject);
      _sessionId = res.data?.id || res.data?.sessionId;
      renderChatWidget();
      if (panel) panel.style.display = 'flex';
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
    // Append locally immediately so the sender sees their message without waiting for WS echo
    const me = ApiService.getCurrentUser();
    _appendBubble(msg, true, me?.email);
    try {
      await ApiService.chat.sendMessage(_sessionId, msg);
    } catch (_) {}
  });

  if (_sessionId) {
    const me = ApiService.getCurrentUser();
    connectWS(() => {
      subscribeWS('/topic/live-chat/' + _sessionId, (msgData) => {
        // Skip own messages — already appended locally on submit
        if (msgData.senderId === me?.id) return;
        _appendBubble(msgData.message, false, msgData.senderEmail);
      });
      subscribeWS('/topic/live-chat/sessions', (session) => {
        if ((session.id || session.sessionId) === _sessionId) {
          renderChatWidget();
        }
      });
    });
  }
}

function _bubble(text, sent, label) {
  const lbl = !sent && label ? '<div style="font-size:10px;opacity:0.65;margin-bottom:3px;">' + label.split('@')[0] + '</div>' : '';
  return '<div class="chat-bubble ' + (sent ? 'sent' : 'received') + '">' + lbl + _esc(text) + '</div>';
}

function _appendBubble(text, sent, label) {
  const c = document.getElementById('live-chat-messages-container');
  if (!c) return;
  c.insertAdjacentHTML('beforeend', _bubble(text, sent, label));
  _scrollBottom();
}

function _scrollBottom() {
  const c = document.getElementById('live-chat-messages-container');
  if (c) c.scrollTop = c.scrollHeight;
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
