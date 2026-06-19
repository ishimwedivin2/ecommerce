import './ChatWidget.css';
import { ApiService } from '../api.js';

export async function render() {
  let chats = [];
  try {
    const sessRes = await ApiService.chat.getMySessions();
    chats = sessRes.data || [];
  } catch (_) {}

  const activeSession = chats.find(c =>
    c.status === 'ACTIVE' || c.status === 'OPEN' || c.status === 'ASSIGNED'
  );

  let messagesHtml = '';
  let sessionId = '';

  if (activeSession) {
    sessionId = activeSession.id || activeSession.sessionId;
    const messagesRes = await ApiService.chat.getMessages(sessionId);
    const messages = messagesRes.data;
    messagesHtml = messages.map(m => {
      const isMe = m.senderId === (ApiService.getCurrentUser()?.id ?? 'guest');
      return `<div class="chat-bubble ${isMe ? 'sent' : 'received'}">${m.message}</div>`;
    }).join('');
  }

  return `
    <button class="support-widget-bubble" id="support-bubble-btn">
      <svg width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
    </button>

    <div class="chat-panel" id="support-chat-panel" style="display: none;">
      <div class="chat-header">
        <div>
          <strong>Luz Live Chat Support</strong>
          <div style="font-size:10px;opacity:0.9;font-weight:500;margin-top:2px;">We respond in minutes</div>
        </div>
        <button id="close-chat-btn" style="color:white;font-size:20px;display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:none;border:none;cursor:pointer;">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="chat-messages" id="live-chat-messages-container">
        ${activeSession ? messagesHtml : `
          <div style="text-align:center;padding:32px 20px;color:var(--text-light);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
            <svg width="48" height="48" fill="none" stroke="var(--slate-300)" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <p style="font-size:13.5px;color:var(--slate-600);line-height:1.5;max-width:240px;">Need help with your order or support ticket?</p>
            <button class="btn-primary" id="btn-start-chat" style="margin-top:20px;font-size:13px;padding:10px 20px;">
              Start Support Chat
            </button>
          </div>
        `}
      </div>

      ${activeSession ? `
        <form class="chat-input-row" id="live-chat-input-form" data-session-id="${sessionId}">
          <input type="text" id="live-chat-input-element" placeholder="Ask support a question..." required>
          <button class="btn-primary" style="padding:10px 16px;" type="submit">Send</button>
        </form>
      ` : ''}
    </div>
  `;
}

export function bindEvents(helpers) {
  const { renderChatWidget } = helpers;

  const bubble = document.getElementById('support-bubble-btn');
  const panel = document.getElementById('support-chat-panel');
  const closeBtn = document.getElementById('close-chat-btn');

  bubble?.addEventListener('click', () => {
    if (panel) panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    const msgContainer = document.getElementById('live-chat-messages-container');
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
  });

  closeBtn?.addEventListener('click', () => {
    if (panel) panel.style.display = 'none';
  });

  document.getElementById('btn-start-chat')?.addEventListener('click', async () => {
    const subject = prompt('What is the subject of your query?', 'Order Delay');
    if (subject) {
      await ApiService.chat.createSession(subject, 'Hello, I need help with ' + subject);
      renderChatWidget();
      if (panel) panel.style.display = 'flex';
    }
  });

  const chatForm = document.getElementById('live-chat-input-form');
  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sid = chatForm.getAttribute('data-session-id');
    const input = document.getElementById('live-chat-input-element');
    const msg = input.value;
    await ApiService.chat.sendMessage(sid, msg);
    input.value = '';
    const msgContainer = document.getElementById('live-chat-messages-container');
    if (msgContainer) {
      msgContainer.insertAdjacentHTML('beforeend', `<div class="chat-bubble sent">${msg}</div>`);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }
  });
}
