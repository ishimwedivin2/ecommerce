import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

export async function render(state) {
  const ticketsRes = await ApiService.support.getMyTickets();
  const tickets = ticketsRes.data || [];
  const ticket = tickets.find(t => t.id === state.selectedTicketId);

  if (!ticket) return '<p style="padding:48px;text-align:center;color:var(--text-light);">Ticket not found.</p>';

  let msgs = [];
  try {
    const mRes = await ApiService.support.getTicketMessages(ticket.id);
    msgs = mRes.data || [];
  } catch (_) {}

  const me = ApiService.getCurrentUser();
  const messagesHtml = msgs.map(m => {
    const isMe = m.sender && m.sender.id === me?.id;
    const label = isMe ? '' : '<strong style="font-size:11px;opacity:.7;">' + ((m.sender && (m.sender.firstName || m.sender.email)) || 'Support') + ': </strong>';
    return '<div class="chat-bubble ' + (isMe ? 'sent' : 'received') + '">' + label + (m.message || '') + '<div style="font-size:9px;margin-top:4px;opacity:0.7;text-align:right;">' + _fmt(m.createdAt) + '</div></div>';
  }).join('');

  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="btn-secondary" id="btn-back-support" style="padding:6px 12px;font-size:13px;">← Back to Support</button>
      <h2>Ticket: ${ticket.title}</h2>
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
        <div style="padding:16px;background:#FFF1F2;text-align:center;border-top:1px solid var(--border);">
          <strong style="color:var(--danger);">This ticket is ${ticket.status}.</strong>
        </div>
      `}
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, refresh, toast } = helpers;

  const chatBox = document.getElementById('ticket-chat-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  document.getElementById('btn-back-support')?.addEventListener('click', () => {
    setState({ selectedTicketId: null });
    navigate('support');
  });

  document.getElementById('ticket-chat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('ticket-chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    try {
      await ApiService.support.sendTicketMessage(state.selectedTicketId, msg);
      const box = document.getElementById('ticket-chat-box');
      if (box) {
        box.insertAdjacentHTML('beforeend',
          '<div class="chat-bubble sent">' + msg + '<div style="font-size:9px;margin-top:4px;opacity:0.7;text-align:right;">just now</div></div>');
        box.scrollTop = box.scrollHeight;
      }
    } catch (err) {
      toast((err && err.message) || 'Failed to send', 'error');
    }
  });

  document.getElementById('btn-close-ticket')?.addEventListener('click', async () => {
    if (confirm('Close this support ticket?')) {
      try {
        await ApiService.support.closeTicket(state.selectedTicketId);
        toast('Ticket closed');
        refresh();
      } catch (err) {
        toast((err && err.message) || 'Failed to close ticket', 'error');
      }
    }
  });
}

function _fmt(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
