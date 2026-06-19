import './style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

export async function render() {
  const ticketsRes = await ApiService.support.getMyTickets();
  const tickets = ticketsRes.data || [];

  const faqsRes = await ApiService.support.getFAQs('general');
  const faqs = faqsRes.data || [];

  const ticketsHtml = tickets.length > 0 ? tickets.map(t => `
    <div class="order-row-card" style="cursor:pointer;" data-action="view-ticket" data-id="${t.id}">
      <div style="display:flex;justify-content:space-between;">
        <h4>${t.title}</h4>
        <span class="status-badge ${t.status === 'OPEN' ? 'paid' : 'created'}">${t.status}</span>
      </div>
      <p style="font-size:13px;color:var(--text-medium);">${t.description}</p>
      <div style="font-size:11px;color:var(--text-light);display:flex;justify-content:space-between;margin-top:8px;">
        <span>Priority: <strong>${t.priority}</strong></span>
        <span>Opened: ${t.date}</span>
      </div>
    </div>
  `).join('') : '<p style="color:var(--text-light);">No active support tickets.</p>';

  const faqsHtml = faqs.map(f => `
    <details class="faq-item">
      <summary class="faq-question">${f.question}</summary>
      <p class="faq-answer">${f.answer}</p>
    </details>
  `).join('');

  return `
    <h2 style="margin-bottom:24px;">Support Center</h2>
    <div class="cart-layout">
      <div>
        <h3 style="margin-bottom:16px;">Knowledge Base FAQ</h3>
        <div style="margin-bottom:24px;">${faqsHtml}</div>

        <h3 style="margin-bottom:16px;">Create Support Ticket</h3>
        <div class="cart-items-container">
          <form class="checkout-form" id="support-ticket-form">
            <div class="auth-form-group">
              <label>Ticket Subject</label>
              <input type="text" id="tkt-title" placeholder="e.g. Delayed Delivery" required>
            </div>
            <div class="auth-form-group">
              <label>Priority</label>
              <select id="tkt-priority" style="width:140px;">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div class="auth-form-group">
              <label>Problem Description</label>
              <textarea id="tkt-desc" rows="4" placeholder="Detail the problem here..." required></textarea>
            </div>
            <button class="btn-primary" type="submit" style="width:fit-content;">Open Ticket</button>
          </form>
        </div>
      </div>

      <div>
        <h3 style="margin-bottom:16px;">My Tickets</h3>
        <div class="orders-list">${ticketsHtml}</div>
      </div>
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, refresh, toast } = helpers;
  const container = document.getElementById('app-view-container');

  document.getElementById('support-ticket-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('tkt-title').value;
    const priority = document.getElementById('tkt-priority').value;
    const desc = document.getElementById('tkt-desc').value;
    try {
      await ApiService.support.createTicket(title, desc, priority);
      toast('Support ticket created!');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  container?.querySelectorAll('[data-action="view-ticket"]').forEach(row => {
    row.addEventListener('click', () => {
      setState({ selectedTicketId: row.getAttribute('data-id') });
      navigate('ticket-detail');
    });
  });
}
