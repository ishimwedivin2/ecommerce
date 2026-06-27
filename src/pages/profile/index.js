import './style.css';
import { ApiService } from '../../api.js';

// ── helpers ──────────────────────────────────────────────
const fmtMoney = v => 'RWF ' + Number(v || 0).toLocaleString();
const fmtDate  = v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDateShort = v => v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_META = {
  CREATED:          { label: 'Order Placed',   color: '#64748B', bg: '#F1F5F9', icon: '📋' },
  PENDING:          { label: 'Pending',         color: '#D97706', bg: '#FFFBEB', icon: '⏳' },
  PAID:             { label: 'Payment Done',    color: '#059669', bg: '#ECFDF5', icon: '✅' },
  PROCESSING:       { label: 'Processing',      color: '#2563EB', bg: '#EFF6FF', icon: '⚙️' },
  PICKED:           { label: 'Picked',          color: '#7C3AED', bg: '#F5F3FF', icon: '📦' },
  PACKED:           { label: 'Packed',          color: '#7C3AED', bg: '#F5F3FF', icon: '🗃️' },
  DISPATCHED:       { label: 'Dispatched',      color: '#0891B2', bg: '#ECFEFF', icon: '🚚' },
  SHIPPED:          { label: 'Shipped',         color: '#0891B2', bg: '#ECFEFF', icon: '🚀' },
  DELIVERED:        { label: 'Delivered',       color: '#15803D', bg: '#DCFCE7', icon: '🎉' },
  CANCELLED:        { label: 'Cancelled',       color: '#DC2626', bg: '#FEF2F2', icon: '✗' },
  RETURN_REQUESTED: { label: 'Return Requested',color: '#C026D3', bg: '#FDF4FF', icon: '↩️' },
  RETURNED:         { label: 'Returned',        color: '#9333EA', bg: '#FAF5FF', icon: '🔄' },
  REFUNDED:         { label: 'Refunded',        color: '#0369A1', bg: '#F0F9FF', icon: '💸' },
};

const PIPELINE = ['CREATED', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];

function statusBadge(status) {
  const m = STATUS_META[status] || { label: status, color: '#64748B', bg: '#F1F5F9' };
  return `<span class="prof-badge" style="color:${m.color};background:${m.bg}">${m.icon || ''} ${m.label}</span>`;
}

// ── render ───────────────────────────────────────────────
export async function render() {
  const [userRes, ordersRes] = await Promise.all([
    ApiService.profile.get(),
    ApiService.orders.getCustomerOrders().catch(() => ({ data: [] })),
  ]);

  const user   = userRes.data || {};
  const orders = (ordersRes.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const ordersHtml = orders.length ? orders.map(o => buildOrderCard(o)).join('') :
    `<div class="prof-empty"><div class="prof-empty-ico">🛍️</div><p>You haven't placed any orders yet.</p></div>`;

  return `
<div class="prof-wrap">

  <!-- ── Left column: profile card ── -->
  <div class="prof-left">
    <div class="prof-card">
      <div class="prof-avatar">${(user.firstName || 'U')[0].toUpperCase()}</div>
      <div class="prof-name">${user.firstName || ''} ${user.lastName || ''}</div>
      <div class="prof-email">${user.email || ''}</div>
      <div class="prof-joined">Member since ${fmtDateShort(user.createdAt)}</div>
    </div>

    <!-- Edit form -->
    <div class="prof-section">
      <div class="prof-section-title">Edit Profile</div>
      <form id="prof-edit-form">
        <div class="prof-field">
          <label>First Name</label>
          <input id="prof-fn" type="text" value="${escVal(user.firstName)}" required>
        </div>
        <div class="prof-field">
          <label>Last Name</label>
          <input id="prof-ln" type="text" value="${escVal(user.lastName)}" required>
        </div>
        <div class="prof-field">
          <label>Email Address</label>
          <input type="email" value="${escVal(user.email)}" disabled>
          <small>Email cannot be changed</small>
        </div>
        <div class="prof-field">
          <label>Phone Number</label>
          <input id="prof-phone" type="tel" value="${escVal(user.phoneNumber)}" placeholder="+250 7XX XXX XXX">
        </div>
        <div class="prof-field">
          <label>Default Shipping Address</label>
          <input id="prof-addr" type="text" value="${escVal(user.address)}" placeholder="Street, City, Country">
        </div>
        <div id="prof-edit-msg" class="prof-msg" style="display:none"></div>
        <button type="submit" class="btn-primary prof-save-btn">Save Changes</button>
      </form>
    </div>

    <!-- Change password -->
    <div class="prof-section">
      <div class="prof-section-title">Change Password</div>
      <form id="prof-pwd-form">
        <div class="prof-field">
          <label>Current Password</label>
          <input id="prof-cur-pwd" type="password" placeholder="••••••••" required>
        </div>
        <div class="prof-field">
          <label>New Password</label>
          <input id="prof-new-pwd" type="password" placeholder="Min 8 characters" required>
        </div>
        <div class="prof-field">
          <label>Confirm New Password</label>
          <input id="prof-cfm-pwd" type="password" placeholder="Repeat new password" required>
        </div>
        <div id="prof-pwd-msg" class="prof-msg" style="display:none"></div>
        <button type="submit" class="btn-primary prof-save-btn">Update Password</button>
      </form>
    </div>

    <!-- Danger zone -->
    <div class="prof-section prof-danger-zone">
      <div class="prof-section-title" style="color:#DC2626">Danger Zone</div>
      <p class="prof-danger-desc">Deleting your account is permanent. Your personal data will be removed but order history is retained for legal compliance.</p>
      <button id="btn-delete-account" class="prof-delete-btn">🗑 Delete My Account</button>
    </div>
  </div>

  <!-- ── Right column: orders ── -->
  <div class="prof-right">
    <div class="prof-orders-header">
      <div class="prof-orders-title">My Orders</div>
      <div class="prof-orders-count">${orders.length} order${orders.length !== 1 ? 's' : ''}</div>
    </div>
    <div id="orders-container">${ordersHtml}</div>
  </div>

</div>`;
}

const BACKEND_URL = 'http://localhost:8080';

function resolveImg(url) {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${BACKEND_URL}${url}` : url;
}

function buildOrderCard(o) {
  const items     = o.orderItems || [];
  const pipeIdx   = PIPELINE.indexOf(o.status);
  const cancelled = ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(o.status);
  const canCancel = ['CREATED', 'PENDING', 'PAID'].includes(o.status);
  const canReturn = o.status === 'DELIVERED';

  // Collapsed summary — just first 2 product thumbnails + names
  const thumbsHtml = items.slice(0, 2).map(item => `
    <div class="ord-thumb">
      <img class="ord-thumb-img" src="${resolveImg(item.imageUrl)}"
        alt="${item.productName || ''}"
        onerror="this.style.display='none'">
      <span class="ord-thumb-name">${item.productName || '—'}</span>
    </div>`).join('');
  const moreCount = items.length > 2 ? `<span class="ord-thumb-more">+${items.length - 2} more</span>` : '';

  // Expanded items list
  const itemsHtml = items.map(item => `
    <div class="ord-item">
      <img class="ord-item-img" src="${resolveImg(item.imageUrl)}"
        alt="${item.productName || ''}"
        onerror="this.style.display='none'">
      <div class="ord-item-info">
        <div class="ord-item-name">${item.productName || '—'}</div>
        <div class="ord-item-meta">Qty ${item.quantity} × ${fmtMoney(Number(item.unitPrice || 0) * 1.18)}</div>
      </div>
      <div class="ord-item-sub">${fmtMoney(Number(item.subTotal || 0) * 1.18)}</div>
    </div>`).join('');

  const pipelineHtml = !cancelled ? `
    <div class="ord-pipeline">
      ${PIPELINE.map((step, i) => {
        const done    = pipeIdx >= 0 && i < pipeIdx;
        const active  = i === pipeIdx;
        const stepMeta = STATUS_META[step] || {};
        return `<div class="ord-pipe-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
          <div class="ord-pipe-dot">${done ? '✓' : (stepMeta.icon || (i + 1))}</div>
          <div class="ord-pipe-lbl">${stepMeta.label || step}</div>
        </div>`;
      }).join('<div class="ord-pipe-line"></div>')}
    </div>` : `<div class="prof-badge" style="color:#DC2626;background:#FEF2F2;display:inline-block;margin:8px 0">${STATUS_META[o.status]?.icon || ''} ${STATUS_META[o.status]?.label || o.status}</div>`;

  return `
  <div class="ord-card" id="ord-${o.id}">

    <!-- Collapsed header — always visible -->
    <div class="ord-card-header">
      <div class="ord-card-meta">
        <div class="ord-num">${o.orderNumber || '#' + o.id.slice(0, 8)}</div>
        <div class="ord-date">${fmtDateShort(o.createdAt)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${statusBadge(o.status)}
        <button class="ord-view-btn" data-action="toggle-order" data-id="${o.id}">View Order ▾</button>
      </div>
    </div>

    <!-- Collapsed summary -->
    <div class="ord-collapsed" id="ord-collapsed-${o.id}">
      <div class="ord-thumbs">${thumbsHtml}${moreCount}</div>
      <div class="ord-summary-total">
        <span class="ord-pay-method">${(o.paymentMethod || '—').replace(/_/g, ' ')}</span>
        <span class="ord-total">${fmtMoney(o.totalAmount)}</span>
      </div>
    </div>

    <!-- Expanded details — hidden by default -->
    <div class="ord-expanded" id="ord-expanded-${o.id}" style="display:none">
      <div class="ord-items-list">${itemsHtml}</div>
      ${pipelineHtml}

      <div id="tracking-${o.id}" class="ord-tracking-panel" style="display:none">
        <div class="ord-tracking-loading">Loading tracking info…</div>
      </div>

      <div class="ord-card-footer">
        <div class="ord-payment">
          <span class="ord-pay-method">${(o.paymentMethod || '—').replace(/_/g, ' ')}</span>
          <span class="ord-total">${fmtMoney(o.totalAmount)}</span>
        </div>
        <div class="ord-actions">
          <button class="ord-btn" data-action="toggle-tracking" data-id="${o.id}">📍 Track</button>
          <button class="ord-btn" data-action="view-receipt" data-id="${o.id}" data-num="${o.orderNumber || ''}">🧾 Receipt</button>
          <button class="ord-btn" data-action="download-invoice" data-id="${o.id}" data-num="${o.orderNumber || ''}">📄 PDF</button>
          ${canReturn ? `<button class="ord-btn ord-btn-warn" data-action="request-return" data-id="${o.id}">↩ Return</button>` : ''}
          ${canCancel ? `<button class="ord-btn ord-btn-danger" data-action="cancel-order" data-id="${o.id}">✗ Cancel</button>` : ''}
        </div>
      </div>
    </div>

  </div>`;
}

// ── bind events ──────────────────────────────────────────
export function bindEvents(state, helpers) {
  const { navigate, toast, refresh } = helpers;
  const container = document.getElementById('orders-container');

  // ── Profile edit ──
  document.getElementById('prof-edit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const msgEl = document.getElementById('prof-edit-msg');
    const btn   = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const res = await ApiService.profile.update({
        firstName:   document.getElementById('prof-fn').value.trim(),
        lastName:    document.getElementById('prof-ln').value.trim(),
        phoneNumber: document.getElementById('prof-phone').value.trim(),
        address:     document.getElementById('prof-addr').value.trim(),
      });
      // Refresh cached user without touching tokens
      const updated = res.data || {};
      const u = ApiService.getCurrentUser() || {};
      const r = localStorage.getItem('luz_refresh_token');
      ApiService.setSession({ token: ApiService.getToken(), refreshToken: r, user: { ...u, ...updated } });
      showMsg(msgEl, 'Profile saved successfully!', 'success');
    } catch (err) {
      showMsg(msgEl, err.message || 'Failed to save profile', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });

  // ── Password change ──
  document.getElementById('prof-pwd-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const msgEl  = document.getElementById('prof-pwd-msg');
    const newPwd = document.getElementById('prof-new-pwd').value;
    const cfmPwd = document.getElementById('prof-cfm-pwd').value;
    if (newPwd !== cfmPwd) { showMsg(msgEl, 'Passwords do not match', 'error'); return; }
    if (newPwd.length < 8)  { showMsg(msgEl, 'New password must be at least 8 characters', 'error'); return; }
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Updating…';
    try {
      await ApiService.auth.changePassword({
        currentPassword: document.getElementById('prof-cur-pwd').value,
        newPassword: newPwd,
      });
      showMsg(msgEl, 'Password updated!', 'success');
      e.target.reset();
    } catch (err) {
      showMsg(msgEl, err.message || 'Failed to update password', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Update Password';
    }
  });

  // ── Delete account ──
  document.getElementById('btn-delete-account')?.addEventListener('click', async () => {
    const confirmed = confirm(
      'Are you absolutely sure?\n\n' +
      'This will permanently disable your account and remove your personal information. ' +
      'Your order history is kept for legal compliance but you will not be able to log back in.\n\n' +
      'Type your intention: this action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      await ApiService.profile.deleteAccount();
      // Clear session and redirect to home
      ApiService.setSession({ token: null, refreshToken: null, user: null });
      localStorage.removeItem('luz_jwt');
      localStorage.removeItem('luz_refresh_token');
      localStorage.removeItem('luz_user');
      toast('Your account has been deleted.');
      navigate('home');
    } catch (err) {
      toast(err.message || 'Failed to delete account', 'error');
    }
  });

  // ── Order actions (delegated) ──
  container?.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const oid    = btn.dataset.id;
    const num    = btn.dataset.num || oid;

    if (action === 'toggle-order') {
      const collapsed = document.getElementById(`ord-collapsed-${oid}`);
      const expanded  = document.getElementById(`ord-expanded-${oid}`);
      if (!expanded) return;
      const isOpen = expanded.style.display !== 'none';
      expanded.style.display  = isOpen ? 'none' : '';
      collapsed.style.display = isOpen ? '' : 'none';
      btn.textContent = isOpen ? 'View Order ▾' : 'Close ▴';
    }

    if (action === 'toggle-tracking') {
      const panel = document.getElementById(`tracking-${oid}`);
      if (!panel) return;
      if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
      panel.style.display = '';
      panel.innerHTML = '<div class="ord-tracking-loading">Loading tracking info…</div>';
      try {
        const res  = await ApiService.orders.getTracking(oid);
        const data = res.data || res;
        panel.innerHTML = buildTrackingPanel(data);
      } catch (err) {
        panel.innerHTML = `<div class="ord-tracking-err">Could not load tracking: ${err.message}</div>`;
      }
    }

    if (action === 'view-receipt') {
      btn.textContent = '…'; btn.disabled = true;
      try {
        const res = await ApiService.receipts.get(oid);
        showReceiptModal(res.data || res, oid);
      } catch (err) {
        toast('Could not load receipt: ' + err.message, 'error');
      } finally {
        btn.innerHTML = '🧾 Receipt'; btn.disabled = false;
      }
    }

    if (action === 'download-invoice') {
      btn.textContent = '…'; btn.disabled = true;
      try {
        await ApiService.receipts.downloadPdf(oid, num);
        toast('Receipt downloaded!');
      } catch (err) {
        toast('Could not download: ' + err.message, 'error');
      } finally {
        btn.innerHTML = '📄 PDF'; btn.disabled = false;
      }
    }

    if (action === 'cancel-order') {
      if (!confirm('Cancel this order?')) return;
      btn.disabled = true; btn.textContent = '…';
      try {
        await ApiService.orders.cancel(oid);
        toast('Order cancelled');
        refresh();
      } catch (err) {
        toast(err.message || 'Could not cancel', 'error');
        btn.disabled = false; btn.textContent = '✗ Cancel';
      }
    }

    if (action === 'request-return') {
      const reason = prompt('Please describe the reason for your return:');
      if (!reason?.trim()) return;
      btn.disabled = true; btn.textContent = '…';
      try {
        await ApiService.returns.create(oid, reason.trim());
        toast('Return request submitted — we\'ll review it shortly.');
        refresh();
      } catch (err) {
        toast(err.message || 'Could not submit return', 'error');
        btn.disabled = false; btn.textContent = '↩ Return';
      }
    }
  });
}

// ── tracking panel ───────────────────────────────────────
function buildTrackingPanel(data) {
  const timeline = (data.timeline || []).map(ev => `
    <div class="trk-event">
      <div class="trk-dot"></div>
      <div class="trk-info">
        <div class="trk-status">${ev.status?.replace(/_/g, ' ') || '—'}</div>
        <div class="trk-note">${ev.note || ''}</div>
        <div class="trk-time">${fmtDate(ev.occurredAt)}</div>
      </div>
    </div>`).join('');

  const shipHtml = data.trackingNumber ? `
    <div class="trk-shipment">
      <span>📦 ${data.carrier || 'Carrier'}</span>
      <span class="trk-tracking-num">${data.trackingNumber}</span>
      ${data.estimatedDeliveryDate ? `<span>Est. delivery: ${fmtDateShort(data.estimatedDeliveryDate)}</span>` : ''}
    </div>` : '';

  return `
  <div class="ord-tracking-inner">
    ${shipHtml}
    <div class="trk-timeline">${timeline || '<div style="color:#94A3B8;font-size:13px">No tracking events yet.</div>'}</div>
  </div>`;
}

// ── receipt modal ────────────────────────────────────────
function showReceiptModal(r, orderId) {
  const taxRate = Number(r.taxRate || 0);
  const itemsHtml = (r.items || []).map(item => {
    const unitPrice = Number(item.unitPrice || 0);
    const unitWithTax = unitPrice * (1 + taxRate);
    const subTotal = Number(item.subTotal || 0);
    const totalWithTax = subTotal * (1 + taxRate);
    return `
    <tr>
      <td>${item.productName || '—'}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmtMoney(unitWithTax)}</td>
      <td style="text-align:right">${fmtMoney(totalWithTax)}</td>
    </tr>`;
  }).join('');

  document.getElementById('rcpt-overlay')?.remove();
  const div = document.createElement('div');
  div.id = 'rcpt-overlay';
  div.className = 'rcpt-overlay';
  div.innerHTML = `
  <div class="rcpt-modal">
    <div class="rcpt-modal-head">
      <span style="font-weight:700;font-size:16px">Receipt</span>
      <div style="display:flex;gap:8px">
        <button id="rcpt-dl-btn" class="rcpt-head-btn">⬇ PDF</button>
        <button id="rcpt-close-btn" class="rcpt-head-close">×</button>
      </div>
    </div>
    <div class="rcpt-modal-body">
      <div class="rcpt-brand-bar"><div class="rcpt-brand-name">Luz Technology</div><div class="rcpt-brand-sub">Payment Receipt</div></div>
      <div class="rcpt-meta-grid">
        <div class="rcpt-mrow"><span>Receipt No</span><span>${r.receiptNumber || '—'}</span></div>
        <div class="rcpt-mrow"><span>Order No</span><span>${r.orderNumber || '—'}</span></div>
        <div class="rcpt-mrow"><span>Customer</span><span>${r.customerName || '—'}</span></div>
        <div class="rcpt-mrow"><span>Payment</span><span>${(r.paymentMethod || '—').replace(/_/g, ' ')}</span></div>
        <div class="rcpt-mrow"><span>Reference</span><span class="rcpt-ref">${r.paymentReference || '—'}</span></div>
        <div class="rcpt-mrow"><span>Date</span><span>${fmtDate(r.issuedAt)}</span></div>
      </div>
      <table class="rcpt-tbl">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="rcpt-totals">
        <div class="rcpt-trow"><span>Subtotal</span><span>${fmtMoney(Number(r.subTotalAmount || 0) * (1 + taxRate))}</span></div>
        <div class="rcpt-trow rcpt-grand"><span>Total Paid</span><span>${fmtMoney(r.totalAmount)}</span></div>
        <div class="rcpt-trow" style="font-size:12px;color:#94a3b8"><span>Tax (${Number((r.taxRate || 0) * 100).toFixed(0)}%) included</span><span>${fmtMoney(r.taxAmount)}</span></div>
      </div>
      <div class="rcpt-thanks">Thank you for shopping at Luz Technology!</div>
    </div>
  </div>`;
  document.body.appendChild(div);

  div.addEventListener('click', e => { if (e.target === div) div.remove(); });
  document.getElementById('rcpt-close-btn').addEventListener('click', () => div.remove());
  document.getElementById('rcpt-dl-btn').addEventListener('click', async function() {
    this.textContent = '…'; this.disabled = true;
    try { await ApiService.receipts.downloadPdf(orderId, r.orderNumber || orderId); }
    catch (err) { alert('PDF error: ' + err.message); }
    finally { this.textContent = '⬇ PDF'; this.disabled = false; }
  });
}

// ── utils ────────────────────────────────────────────────
function escVal(s) { return (s || '').replace(/"/g, '&quot;'); }
function showMsg(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className   = 'prof-msg prof-msg-' + type;
  el.style.display = '';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}
