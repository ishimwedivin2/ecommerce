import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

export async function render(state) {
  const ticketsRes = await ApiService.support.getMyTickets();
  const tickets = ticketsRes.data || [];
  const ticket = tickets.find(t => t.id === state.selectedTicketId);

  if (!ticket) return '<p style="padding:48px;text-align:center;color:var(--text-light);">Ticket not found.</p>';

  const user = ApiService.getCurrentUser();
  const messagesHtml = (ticket.messages || []).map(m => {
    const isMe = m.senderId === user?.id;
    return `
      <div class="chat-bubble ${isMe ? 'sent' : 'received'}">
        <strong>${m.senderName}:</strong> ${m.message}
        <div style="font-size:9px;margin-top:4px;opacity:0.8;text-align:right;">${m.timestamp}</div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="btn-secondary" id="btn-back-support" style="padding:6px 12px;font-size:13px;">← Back to Support</button>
      <h2>Ticket: ${ticket.title}</h2>
      <span class="status-badge ${ticket.status === 'OPEN' ? 'paid' : 'created'}">${ticket.status}</span>
    </div>

    <div class="chat-panel" style="position:static;width:100%;height:500px;max-width:800px;margin:0 auto;display:flex;">
      <div class="chat-messages" style="flex:1;padding:20px;" id="ticket-chat-box">
        ${messagesHtml}
      </div>

      ${ticket.status === 'OPEN' ? `
        <form class="chat-input-row" id="ticket-chat-form">
          <input type="text" id="ticket-chat-input" placeholder="Type a message to support..." style="flex:1;" required>
          <button class="btn-primary" type="submit">Send</button>
          <button class="btn-secondary" type="button" id="btn-close-ticket" style="border-color:var(--danger);color:var(--danger);">Close Ticket</button>
        </form>
      ` : `
        <div style="padding:16px;background:#FFF1F2;text-align:center;border-top:1px solid var(--border);">
          <strong style="color:var(--danger);">This ticket is CLOSED.</strong>
        </div>
      `}
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, refresh, toast } = helpers;

  // Scroll chat to bottom
  const chatBox = document.getElementById('ticket-chat-box');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  document.getElementById('btn-back-support')?.addEventListener('click', () => {
    setState({ selectedTicketId: null });
    navigate('support');
  });

  document.getElementById('ticket-chat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('ticket-chat-input');
    const msg = input.value;
    await ApiService.support.sendTicketMessage(state.selectedTicketId, msg);
    input.value = '';
    refresh();
  });

  document.getElementById('btn-close-ticket')?.addEventListener('click', async () => {
    if (confirm('Close this support ticket?')) {
      await ApiService.support.closeTicket(state.selectedTicketId);
      toast('Ticket closed');
      refresh();
    }
  });
}
