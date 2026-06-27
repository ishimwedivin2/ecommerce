import { ApiService } from '../../api.js';
import { setState } from '../../store.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../../chat-ws.js';

export async function render(state) {
  // Fix 3: fetch single ticket by ID instead of loading all tickets to find one
  let ticket = null;
  try {
    const res = await ApiService.support.getTicket(state.selectedTicketId);
    ticket = res.data;
  } catch (_) {}

  if (!ticket) return '<p style="padding:48px;text-align:center;color:var(--text-light);">Ticket not found.</p>';

  let msgs = [];
  try {
    const mRes = await ApiService.support.getTicketMessages(ticket.id);
    msgs = mRes.data || [];
  } catch (_) {}

  const me = ApiService.getCurrentUser();
  const messagesHtml = msgs.map(m => {
    const isMe = m.senderId === me?.id;
    const label = isMe ? '' : '<strong style="font-size:11px;opacity:.7;">' + ((m.senderFirstName || m.senderEmail) || 'Support') + ': </strong>';
    return '<div class="chat-bubble ' + (isMe ? 'sent' : 'received') + '">' + label + _esc(m.message || '') + '<div style="font-size:9px;margin-top:4px;opacity:0.7;text-align:right;">' + _fmt(m.createdAt) + '</div></div>';
  }).join('');

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="btn-secondary" id="btn-back-support" style="padding:6px 12px;font-size:13px;">← Back to Support</button>
      <h2>Ticket: ${_esc(ticket.title)}</h2>
      <span class="status-badge ${ticket.status === 'OPEN' ? 'paid' : 'created'}">${ticket.status}</span>
      <span style="font-size:12px;color:var(--text-light);margin-left:auto;">Priority: <strong>${ticket.priority || 'MEDIUM'}</strong></span>
    </div>

    <div class="chat-panel" style="position:static;width:100%;height:500px;max-width:800px;margin:0 auto;display:flex;">
      <div class="chat-messages" style="flex:1;padding:20px;" id="ticket-chat-box">
        ${messagesHtml || '<div style="text-align:center;color:var(--text-light);padding:48px;">No messages yet.</div>'}
      </div>

      ${!isClosed ? `
        <form class="chat-input-row" id="ticket-chat-form">
          <input type="text" id="ticket-chat-input" placeholder="Type a message to support..." style="flex:1;" required autocomplete="off">
          <button class="btn-primary" type="submit">Send</button>
          <button class="btn-secondary" type="button" id="btn-close-ticket" style="border-color:var(--danger);color:var(--danger);">Close Ticket</button>
        </form>
      ` : `
        <div style="padding:16px;background:#FFF1F2;border-top:1px solid var(--border);">
          <div style="text-align:center;margin-bottom:12px"><strong style="color:var(--danger);">This ticket is ${ticket.status}.</strong></div>
          ${!ticket.surveyed ? `
          <div id="survey-box" style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:14px">
            <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#1e293b">How did we do? Rate your experience</div>
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:10px" id="star-row">
              ${[1,2,3,4,5].map(n=>`<button data-star="${n}" style="font-size:24px;background:none;border:none;cursor:pointer;padding:2px;opacity:.4;transition:opacity .15s">★</button>`).join('')}
            </div>
            <input type="hidden" id="survey-rating" value="0">
            <textarea id="survey-feedback" placeholder="Optional comment…" style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:13px;resize:none;height:60px;margin-bottom:8px"></textarea>
            <button id="btn-submit-survey" class="btn-primary" style="width:100%;padding:9px;font-size:13px">Submit Feedback</button>
            <div id="survey-msg" style="display:none;text-align:center;color:#16a34a;font-weight:600;margin-top:8px">Thank you for your feedback! ✓</div>
          </div>` : `<div style="text-align:center;color:#16a34a;font-size:13px;font-weight:600">✓ Survey already submitted</div>`}
        </div>
      `}
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, refresh, toast } = helpers;
  const me = ApiService.getCurrentUser();

  const chatBox = document.getElementById('ticket-chat-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  document.getElementById('btn-back-support')?.addEventListener('click', () => {
    unsubscribeWS('/topic/tickets/' + state.selectedTicketId);
    setState({ selectedTicketId: null });
    navigate('support');
  });

  // Fix 11: subscribe for real-time agent replies
  connectWS(() => {
    subscribeWS('/topic/tickets/' + state.selectedTicketId, (msgData) => {
      // skip own messages — already appended locally on send
      if (msgData.senderId === me?.id) return;
      const box = document.getElementById('ticket-chat-box');
      if (!box) return;
      const label = '<strong style="font-size:11px;opacity:.7;">' + _esc(msgData.senderFirstName || msgData.senderEmail || 'Support') + ': </strong>';
      box.insertAdjacentHTML('beforeend',
        '<div class="chat-bubble received">' + label + _esc(msgData.message || '') + '<div style="font-size:9px;margin-top:4px;opacity:0.7;text-align:right;">' + _fmt(msgData.createdAt) + '</div></div>');
      box.scrollTop = box.scrollHeight;
    });
  });

  document.getElementById('ticket-chat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('ticket-chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    // Optimistic local append
    const box = document.getElementById('ticket-chat-box');
    if (box) {
      box.insertAdjacentHTML('beforeend',
        '<div class="chat-bubble sent">' + _esc(msg) + '<div style="font-size:9px;margin-top:4px;opacity:0.7;text-align:right;">just now</div></div>');
      box.scrollTop = box.scrollHeight;
    }
    try {
      await ApiService.support.sendTicketMessage(state.selectedTicketId, msg);
    } catch (err) {
      toast((err && err.message) || 'Failed to send', 'error');
    }
  });

  document.getElementById('btn-close-ticket')?.addEventListener('click', async () => {
    if (confirm('Close this support ticket?')) {
      try {
        await ApiService.support.closeTicket(state.selectedTicketId);
        unsubscribeWS('/topic/tickets/' + state.selectedTicketId);
        toast('Ticket closed');
        refresh();
      } catch (err) {
        toast((err && err.message) || 'Failed to close ticket', 'error');
      }
    }
  });

  // Star rating widget
  document.querySelectorAll('#star-row button[data-star]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.star);
      document.getElementById('survey-rating').value = val;
      document.querySelectorAll('#star-row button[data-star]').forEach(b => {
        b.style.opacity = parseInt(b.dataset.star) <= val ? '1' : '.3';
      });
    });
  });

  document.getElementById('btn-submit-survey')?.addEventListener('click', async () => {
    const rating = parseInt(document.getElementById('survey-rating')?.value || '0');
    if (!rating) { toast('Please select a star rating', 'error'); return; }
    const feedback = document.getElementById('survey-feedback')?.value?.trim() || '';
    try {
      await ApiService.support.submitSurvey(state.selectedTicketId, { rating, feedback });
      // Fix 4: hide the form and show success inline after submission
      const box = document.getElementById('survey-box');
      if (box) box.innerHTML = '<div style="text-align:center;color:#16a34a;font-weight:700;padding:8px">✓ Thank you for your feedback!</div>';
    } catch (err) {
      toast((err && err.message) || 'Failed to submit survey', 'error');
    }
  });
}

function _fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function _esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
