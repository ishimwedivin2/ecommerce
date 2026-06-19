import './style.css';
import { ApiService } from '../../api.js';

export async function render() {
  const userRes = await ApiService.profile.get();
  const user = userRes.data || {};
  const ordersRes = await ApiService.orders.getCustomerOrders();
  const orders = ordersRes.data || [];

  const steps = ['CREATED', 'PAID', 'PICKED', 'PACKED', 'DISPATCHED', 'DELIVERED'];

  const ordersHtml = orders.length > 0 ? orders.map(o => {
    const currentIdx = steps.indexOf(o.status);
    const activeWidth = currentIdx >= 0 ? (currentIdx / (steps.length - 1)) * 100 : 0;
    return `
      <div class="order-row-card">
        <div class="order-row-header">
          <div>
            <strong>Order ID: #${o.id}</strong>
            <div style="font-size:12px;color:var(--text-light);margin-top:4px;">Placed on: ${new Date(o.timestamp).toLocaleString()}</div>
          </div>
          <span class="status-badge ${o.status.toLowerCase()}">${o.status}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          ${o.items.map(item => `
            <div style="display:flex;justify-content:space-between;font-size:14px;">
              <span>${item.productName} (x${item.quantity})</span>
              <strong>£${item.subtotal.toFixed(2)}</strong>
            </div>
          `).join('')}
        </div>

        ${o.status !== 'CANCELLED' ? `
          <div class="order-progress-container">
            <div class="order-progress-bar">
              <div class="order-progress-line"></div>
              <div class="order-progress-line-active" style="width:${activeWidth}%;"></div>
              ${steps.map((st, idx) => {
                let cls = '';
                if (idx < currentIdx) cls = 'completed';
                else if (idx === currentIdx) cls = 'active';
                return `
                  <div class="progress-step ${cls}">
                    <div class="progress-step-circle">${idx + 1}</div>
                    <span>${st}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:16px;">
          <div>
            <span style="font-size:13px;color:var(--text-light);">Payment:</span>
            <strong> ${o.paymentMethod}</strong>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn-secondary" style="padding:6px 12px;font-size:13px;" data-action="download-invoice" data-id="${o.id}">
              📄 PDF Invoice
            </button>
            ${o.status === 'DELIVERED' ? `
              <button class="btn-secondary" style="padding:6px 12px;font-size:13px;color:var(--warning);border-color:var(--warning);" data-action="request-return" data-id="${o.id}">
                ↩ Request Return
              </button>
            ` : ''}
            ${['CREATED', 'PAID'].includes(o.status) ? `
              <button class="btn-secondary" style="padding:6px 12px;font-size:13px;color:var(--danger);border-color:var(--danger);" data-action="cancel-order" data-id="${o.id}">
                Cancel Order
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') : '<p style="color:var(--text-light);">You have not placed any orders yet.</p>';

  return `
    <h2 style="margin-bottom:24px;">My Profile & Orders</h2>
    <div class="cart-layout">
      <div class="cart-items-container">
        <form class="checkout-form" id="profile-edit-form">
          <h3>Profile Details</h3>
          <div class="auth-form-group">
            <label>First Name</label>
            <input type="text" id="prof-firstname" value="${user.firstName || ''}" required>
          </div>
          <div class="auth-form-group">
            <label>Last Name</label>
            <input type="text" id="prof-lastname" value="${user.lastName || ''}" required>
          </div>
          <div class="auth-form-group">
            <label>Email Address</label>
            <input type="email" value="${user.email || ''}" disabled>
            <span style="font-size:11px;color:var(--text-light);">Email cannot be changed</span>
          </div>
          <div class="auth-form-group">
            <label>Phone Number</label>
            <input type="text" id="prof-phone" value="${user.phoneNumber || ''}">
          </div>
          <div class="auth-form-group">
            <label>Default Shipping Address</label>
            <input type="text" id="prof-address" value="${user.address || ''}">
          </div>
          <button class="btn-primary" type="submit" style="width:fit-content;">Save Changes</button>
        </form>
      </div>

      <div>
        <h3 style="margin-bottom:16px;">Order History</h3>
        <div class="orders-list">${ordersHtml}</div>
      </div>
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { refresh, toast } = helpers;
  const container = document.getElementById('app-view-container');

  document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('prof-firstname').value;
    const lastName = document.getElementById('prof-lastname').value;
    const phone = document.getElementById('prof-phone').value;
    const address = document.getElementById('prof-address').value;
    try {
      await ApiService.profile.update({ firstName, lastName, phoneNumber: phone, address });
      toast('Profile updated successfully!');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    }
  });

  container?.querySelectorAll('[data-action="cancel-order"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to cancel this order?')) {
        const oid = btn.getAttribute('data-id');
        await ApiService.orders.cancel(oid);
        toast('Order cancelled');
        refresh();
      }
    });
  });

  container?.querySelectorAll('[data-action="download-invoice"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const oid = btn.getAttribute('data-id');
      try {
        btn.textContent = 'Downloading...';
        btn.disabled = true;
        await ApiService.downloadReceiptPdf(oid);
        toast('Receipt downloaded!');
      } catch (err) {
        toast('Could not download receipt: ' + err.message, 'error');
      } finally {
        btn.innerHTML = '📄 PDF Invoice';
        btn.disabled = false;
      }
    });
  });

  container?.querySelectorAll('[data-action="request-return"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const oid = btn.getAttribute('data-id');
      const reason = prompt('Please describe the reason for your return request:');
      if (reason && reason.trim()) {
        ApiService.returns.create(oid, reason.trim())
          .then(() => { toast('Return request submitted! We\'ll review it shortly.'); refresh(); })
          .catch(err => toast('Failed to submit return: ' + err.message, 'error'));
      }
    });
  });
}
