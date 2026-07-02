import './style.css';
import { ApiService } from '../../api.js';

const BACKEND_URL = 'http://localhost:8080';

const fmtMoney = v => 'RWF ' + Number(v || 0).toLocaleString();
const fmtDate = v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDateShort = v => v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const PROFILE_SECTIONS = new Set(['profile', 'orders', 'addresses', 'password', 'returns', 'logout']);

const STATUS_META = {
  CREATED:          { label: 'Order Placed', color: '#64748B', bg: '#F1F5F9', icon: '📋' },
  PENDING:          { label: 'Pending', color: '#D97706', bg: '#FFFBEB', icon: '⏳' },
  PAID:             { label: 'Payment Done', color: '#059669', bg: '#ECFDF5', icon: '✅' },
  PROCESSING:       { label: 'Processing', color: '#2563EB', bg: '#EFF6FF', icon: '⚙️' },
  PICKED:           { label: 'Picked', color: '#7C3AED', bg: '#F5F3FF', icon: '📦' },
  PACKED:           { label: 'Packed', color: '#7C3AED', bg: '#F5F3FF', icon: '🗃️' },
  DISPATCHED:       { label: 'Dispatched', color: '#0891B2', bg: '#ECFEFF', icon: '🚚' },
  SHIPPED:          { label: 'Shipped', color: '#0891B2', bg: '#ECFEFF', icon: '🚀' },
  DELIVERED:        { label: 'Delivered', color: '#15803D', bg: '#DCFCE7', icon: '🎉' },
  CANCELLED:        { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2', icon: '✗' },
  RETURN_REQUESTED: { label: 'Return Requested', color: '#C026D3', bg: '#FDF4FF', icon: '↩️' },
  RETURNED:         { label: 'Returned', color: '#9333EA', bg: '#FAF5FF', icon: '🔄' },
  REFUNDED:         { label: 'Refunded', color: '#0369A1', bg: '#F0F9FF', icon: '💸' },
};

const PIPELINE = ['CREATED', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];

function activeSection() {
  const params = new URLSearchParams(window.location.search);
  const section = (params.get('section') || 'profile').toLowerCase();
  return PROFILE_SECTIONS.has(section) ? section : 'profile';
}

function setSection(section) {
  const next = PROFILE_SECTIONS.has(section) ? section : 'profile';
  const url = new URL(window.location.href);
  url.searchParams.set('section', next);
  window.history.replaceState(window.history.state || {}, '', `${url.pathname}${url.search}`);
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escVal(s) {
  return String(s == null ? '' : s).replace(/"/g, '&quot;');
}

function resolveImg(url) {
  if (!url) return '';
  return url.startsWith('/uploads/') ? `${BACKEND_URL}${url}` : url;
}

function statusBadge(status) {
  const m = STATUS_META[status] || { label: status, color: '#64748B', bg: '#F1F5F9', icon: '' };
  return `<span class="prof-badge" style="color:${m.color};background:${m.bg}">${m.icon ? `${m.icon} ` : ''}${m.label}</span>`;
}

function menuItem(id, label, icon, current) {
  return `<button class="prof-menu-item ${current === id ? 'active' : ''}" data-section="${id}">${icon} ${label}</button>`;
}

function renderProfileSection(user) {
  return `
  <div class="prof-stack">
    <div class="prof-card">
      <div class="prof-avatar">${(user.firstName || 'U')[0].toUpperCase()}</div>
      <div class="prof-name">${escHtml(user.firstName || '')} ${escHtml(user.lastName || '')}</div>
      <div class="prof-email">${escHtml(user.email || '')}</div>
      <div class="prof-joined">Member since ${fmtDateShort(user.createdAt)}</div>
    </div>

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
  </div>`;
}

function buildOrderCard(o) {
  const items = o.orderItems || [];
  const pipeIdx = PIPELINE.indexOf(o.status);
  const cancelled = ['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(o.status);
  const canCancel = ['CREATED', 'PENDING', 'PAID'].includes(o.status);
  const canReturn = o.status === 'DELIVERED';

  const thumbsHtml = items.slice(0, 2).map(item => `
    <div class="ord-thumb">
      <img class="ord-thumb-img" src="${resolveImg(item.imageUrl)}" alt="${escHtml(item.productName || '')}" onerror="this.style.display='none'">
      <span class="ord-thumb-name">${escHtml(item.productName || '—')}</span>
    </div>`).join('');
  const moreCount = items.length > 2 ? `<span class="ord-thumb-more">+${items.length - 2} more</span>` : '';

  const itemsHtml = items.map(item => `
    <div class="ord-item">
      <img class="ord-item-img" src="${resolveImg(item.imageUrl)}" alt="${escHtml(item.productName || '')}" onerror="this.style.display='none'">
      <div class="ord-item-info">
        <div class="ord-item-name">${escHtml(item.productName || '—')}</div>
        <div class="ord-item-meta">Qty ${item.quantity} × ${fmtMoney(Number(item.unitPrice || 0) * 1.18)}</div>
      </div>
      <div class="ord-item-sub">${fmtMoney(Number(item.subTotal || 0) * 1.18)}</div>
    </div>`).join('');

  const pipelineHtml = !cancelled ? `
    <div class="ord-pipeline">
      ${PIPELINE.map((step, i) => {
        const done = pipeIdx >= 0 && i < pipeIdx;
        const active = i === pipeIdx;
        const stepMeta = STATUS_META[step] || {};
        return `<div class="ord-pipe-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
          <div class="ord-pipe-dot">${done ? '✓' : (stepMeta.icon || (i + 1))}</div>
          <div class="ord-pipe-lbl">${stepMeta.label || step}</div>
        </div>`;
      }).join('<div class="ord-pipe-line"></div>')}
    </div>` : `<div class="prof-badge" style="color:#DC2626;background:#FEF2F2;display:inline-block;margin:8px 0">${STATUS_META[o.status]?.icon || ''} ${STATUS_META[o.status]?.label || o.status}</div>`;

  return `
  <div class="ord-card" id="ord-${o.id}">
    <div class="ord-card-header">
      <div class="ord-card-meta">
        <div class="ord-num">${escHtml(o.orderNumber || ('#' + o.id.slice(0, 8)))}</div>
        <div class="ord-date">${fmtDateShort(o.createdAt)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${statusBadge(o.status)}
        <button class="ord-view-btn" data-action="toggle-order" data-id="${o.id}">View Order ▾</button>
      </div>
    </div>

    <div class="ord-collapsed" id="ord-collapsed-${o.id}">
      <div class="ord-thumbs">${thumbsHtml}${moreCount}</div>
      <div class="ord-summary-total">
        <span class="ord-pay-method">${escHtml((o.paymentMethod || '—').replace(/_/g, ' '))}</span>
        <span class="ord-total">${fmtMoney(o.totalAmount)}</span>
      </div>
    </div>

    <div class="ord-expanded" id="ord-expanded-${o.id}" style="display:none">
      <div class="ord-items-list">${itemsHtml}</div>
      ${pipelineHtml}

      <div id="tracking-${o.id}" class="ord-tracking-panel" style="display:none">
        <div class="ord-tracking-loading">Loading tracking info…</div>
      </div>

      <div class="ord-card-footer">
        <div class="ord-payment">
          <span class="ord-pay-method">${escHtml((o.paymentMethod || '—').replace(/_/g, ' '))}</span>
          <span class="ord-total">${fmtMoney(o.totalAmount)}</span>
        </div>
        <div class="ord-actions">
          <button class="ord-btn" data-action="toggle-tracking" data-id="${o.id}">📍 Track</button>
          <button class="ord-btn" data-action="view-receipt" data-id="${o.id}" data-num="${escHtml(o.orderNumber || '')}">🧾 Receipt</button>
          <button class="ord-btn" data-action="download-invoice" data-id="${o.id}" data-num="${escHtml(o.orderNumber || '')}">📄 PDF</button>
          ${canReturn ? `<button class="ord-btn ord-btn-warn" data-action="request-return" data-id="${o.id}">↩ Return</button>` : ''}
          ${canCancel ? `<button class="ord-btn ord-btn-danger" data-action="cancel-order" data-id="${o.id}">✗ Cancel</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function renderOrdersSection(orders) {
  const ordersHtml = orders.length
    ? orders.map(o => buildOrderCard(o)).join('')
    : `<div class="prof-empty"><div class="prof-empty-ico">🛍️</div><p>You haven't placed any orders yet.</p></div>`;

  return `
  <div class="prof-stack">
    <div class="prof-orders-header">
      <div class="prof-orders-title">My Orders</div>
      <div class="prof-orders-count">${orders.length} order${orders.length !== 1 ? 's' : ''}</div>
    </div>
    <div id="orders-container">${ordersHtml}</div>
  </div>`;
}

function addressCard(a) {
  return `
  <div class="addr-card" data-id="${a.id}">
    <div class="addr-head">
      <div class="addr-title">
        <strong>${escHtml(a.label || 'Address')}</strong>
        ${a.defaultAddress ? '<span class="addr-default">Default</span>' : ''}
      </div>
    </div>
    <div class="addr-lines">
      <div>${escHtml(a.formattedAddress || [a.village, a.cell, a.sector, a.district, a.province].filter(Boolean).join(', '))}</div>
      ${a.deliveryPhoneNumber ? `<div>Phone: ${escHtml(a.deliveryPhoneNumber)}</div>` : ''}
      ${a.deliveryInstructions ? `<div>Note: ${escHtml(a.deliveryInstructions)}</div>` : ''}
    </div>
    <div class="addr-actions">
      ${!a.defaultAddress ? `<button class="ord-btn" data-action="set-default-address" data-id="${a.id}">Set Default</button>` : ''}
      <button class="ord-btn" data-action="edit-address" data-id="${a.id}">Edit</button>
      <button class="ord-btn ord-btn-danger" data-action="delete-address" data-id="${a.id}">Delete</button>
    </div>
  </div>`;
}

function renderAddressForm(address = null) {
  const a = address || {};
  return `
  <form id="address-form" class="prof-grid-form" data-id="${a.id || ''}">
    <div class="prof-field"><label>Label</label><input id="addr-label" value="${escVal(a.label)}" placeholder="Home, Office"></div>
    <div class="prof-field"><label>Province *</label><input id="addr-province" required value="${escVal(a.province)}"></div>
    <div class="prof-field"><label>District *</label><input id="addr-district" required value="${escVal(a.district)}"></div>
    <div class="prof-field"><label>Sector *</label><input id="addr-sector" required value="${escVal(a.sector)}"></div>
    <div class="prof-field"><label>Cell *</label><input id="addr-cell" required value="${escVal(a.cell)}"></div>
    <div class="prof-field"><label>Village *</label><input id="addr-village" required value="${escVal(a.village)}"></div>
    <div class="prof-field"><label>Delivery Phone</label><input id="addr-phone" value="${escVal(a.deliveryPhoneNumber)}"></div>
    <div class="prof-field"><label>Instructions</label><input id="addr-note" value="${escVal(a.deliveryInstructions)}" placeholder="Landmark, gate code..."></div>
    <label class="addr-check"><input id="addr-default" type="checkbox" ${a.defaultAddress ? 'checked' : ''}> Set as default</label>
    <div id="addr-msg" class="prof-msg" style="display:none"></div>
    <div class="addr-form-actions">
      <button type="button" class="ord-btn" id="btn-cancel-address">Cancel</button>
      <button type="submit" class="btn-primary">Save Address</button>
    </div>
  </form>`;
}

function renderAddressesSection(addresses) {
  const cards = addresses.length
    ? addresses.map(addressCard).join('')
    : '<div class="prof-empty"><div class="prof-empty-ico">📍</div><p>No shipping addresses yet.</p></div>';

  return `
  <div class="prof-stack">
    <div class="prof-orders-header">
      <div class="prof-orders-title">Shipping Addresses</div>
      <button class="btn-primary" id="btn-add-address">+ Add Address</button>
    </div>
    <div id="address-form-wrap" style="display:none"></div>
    <div id="addresses-container" class="addr-grid">${cards}</div>
  </div>`;
}

function renderPasswordSection() {
  return `
  <div class="prof-stack">
    <div class="prof-section">
      <div class="prof-section-title">Reset Password</div>
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
  </div>`;
}

function renderReturnsSection(returns) {
  const rows = returns.length ? returns.map(r => `
    <tr>
      <td class="td-sm">${fmtDateShort(r.createdAt)}</td>
      <td>${escHtml(r.order?.orderNumber || r.orderId || '—')}</td>
      <td>${statusBadge(r.status || 'PENDING')}</td>
      <td>${escHtml(r.reason || '—')}</td>
      <td>${fmtMoney(r.refundedAmount || 0)}</td>
    </tr>`).join('') : `<tr><td colspan="5"><div class="d-empty"><div class="d-empty-ttl">No return requests yet</div></div></td></tr>`;

  return `
  <div class="prof-stack">
    <div class="prof-orders-header">
      <div class="prof-orders-title">Returns & Refunds</div>
      <div class="prof-orders-count">${returns.length} request${returns.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="dash-tcard">
      <table class="dt">
        <thead><tr><th>Date</th><th>Order</th><th>Status</th><th>Reason</th><th>Refunded</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

function renderLogoutSection() {
  return `
  <div class="prof-stack">
    <div class="prof-section prof-danger-zone">
      <div class="prof-section-title" style="color:#DC2626">Logout</div>
      <p class="prof-danger-desc">End your current session and return to the homepage.</p>
      <button id="btn-account-logout" class="prof-delete-btn">Log Out</button>
    </div>
  </div>`;
}

function renderContent(section, data) {
  if (section === 'orders') return renderOrdersSection(data.orders);
  if (section === 'addresses') return renderAddressesSection(data.addresses);
  if (section === 'password') return renderPasswordSection();
  if (section === 'returns') return renderReturnsSection(data.returns);
  if (section === 'logout') return renderLogoutSection();
  return renderProfileSection(data.user);
}

async function loadAccountData(section) {
  const [userRes, ordersRes, addressesRes] = await Promise.all([
    ApiService.profile.get(),
    ApiService.orders.getCustomerOrders().catch(() => ({ data: [] })),
    ApiService.addresses.get().catch(() => ({ data: [] })),
  ]);

  const user = userRes.data || {};
  const orders = (ordersRes.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const addresses = addressesRes.data || [];

  // Customer-safe returns loading: fetch return data per customer order instead of staff-only /api/returns.
  const returnResults = await Promise.allSettled(
    orders.map(o => ApiService.returns.getByOrder(o.id))
  );
  const byOrderReturns = returnResults
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value?.data || null)
    .filter(Boolean);

  // Fallback for statuses that may be represented on orders even if return record is missing.
  const fallbackReturns = orders
    .filter(o => ['RETURN_REQUESTED', 'RETURNED', 'REFUNDED'].includes(o.status))
    .filter(o => !byOrderReturns.some(rr => rr?.order?.id === o.id || rr?.orderId === o.id))
    .map(o => ({
      id: `fallback-${o.id}`,
      orderId: o.id,
      order: { id: o.id, orderNumber: o.orderNumber },
      status: o.status,
      reason: o.status === 'REFUNDED' ? 'Order refunded' : 'Return requested from order status',
      refundedAmount: o.status === 'REFUNDED' ? (o.totalAmount || 0) : 0,
      createdAt: o.updatedAt || o.createdAt,
    }));

  const returns = [...byOrderReturns, ...fallbackReturns].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  return { section, user, orders, addresses, returns };
}

export async function render() {
  const section = activeSection();
  const data = await loadAccountData(section);

  return `
  <div class="prof-account-wrap">
    <aside class="prof-menu">
      <div class="prof-menu-title">My Account</div>
      ${menuItem('profile', 'Profile Info', '👤', section)}
      ${menuItem('orders', 'Orders', '🧾', section)}
      ${menuItem('addresses', 'Shipping Addresses', '📍', section)}
      ${menuItem('password', 'Password Reset', '🔐', section)}
      ${menuItem('returns', 'Returns & Refunds', '↩️', section)}
      ${menuItem('logout', 'Logout', '🚪', section)}
    </aside>

    <main class="prof-account-content">
      ${renderContent(section, data)}
    </main>
  </div>`;
}

function buildTrackingPanel(data) {
  const timeline = (data.timeline || []).map(ev => `
    <div class="trk-event">
      <div class="trk-dot"></div>
      <div class="trk-info">
        <div class="trk-status">${escHtml(ev.status?.replace(/_/g, ' ') || '—')}</div>
        <div class="trk-note">${escHtml(ev.note || '')}</div>
        <div class="trk-time">${fmtDate(ev.occurredAt)}</div>
      </div>
    </div>`).join('');

  const shipHtml = data.trackingNumber ? `
    <div class="trk-shipment">
      <span>📦 ${escHtml(data.carrier || 'Carrier')}</span>
      <span class="trk-tracking-num">${escHtml(data.trackingNumber)}</span>
      ${data.estimatedDeliveryDate ? `<span>Est. delivery: ${fmtDateShort(data.estimatedDeliveryDate)}</span>` : ''}
    </div>` : '';

  return `
  <div class="ord-tracking-inner">
    ${shipHtml}
    <div class="trk-timeline">${timeline || '<div style="color:#94A3B8;font-size:13px">No tracking events yet.</div>'}</div>
  </div>`;
}

function showReceiptModal(r, orderId) {
  const taxRate = Number(r.taxRate || 0);
  const itemsHtml = (r.items || []).map(item => {
    const unitPrice = Number(item.unitPrice || 0);
    const unitWithTax = unitPrice * (1 + taxRate);
    const subTotal = Number(item.subTotal || 0);
    const totalWithTax = subTotal * (1 + taxRate);
    return `
    <tr>
      <td>${escHtml(item.productName || '—')}</td>
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
        <div class="rcpt-mrow"><span>Receipt No</span><span>${escHtml(r.receiptNumber || '—')}</span></div>
        <div class="rcpt-mrow"><span>Order No</span><span>${escHtml(r.orderNumber || '—')}</span></div>
        <div class="rcpt-mrow"><span>Customer</span><span>${escHtml(r.customerName || '—')}</span></div>
        <div class="rcpt-mrow"><span>Payment</span><span>${escHtml((r.paymentMethod || '—').replace(/_/g, ' '))}</span></div>
        <div class="rcpt-mrow"><span>Reference</span><span class="rcpt-ref">${escHtml(r.paymentReference || '—')}</span></div>
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
    this.textContent = '…';
    this.disabled = true;
    try {
      await ApiService.receipts.downloadPdf(orderId, r.orderNumber || orderId);
    } catch (err) {
      alert('PDF error: ' + err.message);
    } finally {
      this.textContent = '⬇ PDF';
      this.disabled = false;
    }
  });
}

function showMsg(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = 'prof-msg prof-msg-' + type;
  el.style.display = '';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

async function rerenderProfile(helpers) {
  const container = document.getElementById('app-view-container');
  if (!container) return;
  container.innerHTML = await render();
  bindEvents({}, helpers);
}

function bindSectionMenu(helpers) {
  document.querySelectorAll('.prof-menu-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      const section = btn.dataset.section || 'profile';
      setSection(section);
      await rerenderProfile(helpers);
    });
  });
}

function bindProfileEdit() {
  document.getElementById('prof-edit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const msgEl = document.getElementById('prof-edit-msg');
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const res = await ApiService.profile.update({
        firstName: document.getElementById('prof-fn').value.trim(),
        lastName: document.getElementById('prof-ln').value.trim(),
        phoneNumber: document.getElementById('prof-phone').value.trim(),
        address: document.getElementById('prof-addr').value.trim(),
      });
      const updated = res.data || {};
      const u = ApiService.getCurrentUser() || {};
      const r = localStorage.getItem('luz_refresh_token');
      ApiService.setSession({ token: ApiService.getToken(), refreshToken: r, user: { ...u, ...updated } });
      showMsg(msgEl, 'Profile saved successfully!', 'success');
    } catch (err) {
      showMsg(msgEl, err.message || 'Failed to save profile', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });
}

function bindPasswordReset() {
  document.getElementById('prof-pwd-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const msgEl = document.getElementById('prof-pwd-msg');
    const newPwd = document.getElementById('prof-new-pwd').value;
    const cfmPwd = document.getElementById('prof-cfm-pwd').value;
    if (newPwd !== cfmPwd) {
      showMsg(msgEl, 'Passwords do not match', 'error');
      return;
    }
    if (newPwd.length < 8) {
      showMsg(msgEl, 'New password must be at least 8 characters', 'error');
      return;
    }

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Updating…';
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
      btn.disabled = false;
      btn.textContent = 'Update Password';
    }
  });
}

function bindOrders(helpers) {
  const { toast, refresh } = helpers;
  const container = document.getElementById('orders-container');
  if (!container) return;

  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const oid = btn.dataset.id;
    const num = btn.dataset.num || oid;

    if (action === 'toggle-order') {
      const collapsed = document.getElementById(`ord-collapsed-${oid}`);
      const expanded = document.getElementById(`ord-expanded-${oid}`);
      if (!expanded) return;
      const isOpen = expanded.style.display !== 'none';
      expanded.style.display = isOpen ? 'none' : '';
      if (collapsed) collapsed.style.display = isOpen ? '' : 'none';
      btn.textContent = isOpen ? 'View Order ▾' : 'Close ▴';
    }

    if (action === 'toggle-tracking') {
      const panel = document.getElementById(`tracking-${oid}`);
      if (!panel) return;
      if (panel.style.display !== 'none') {
        panel.style.display = 'none';
        return;
      }
      panel.style.display = '';
      panel.innerHTML = '<div class="ord-tracking-loading">Loading tracking info…</div>';
      try {
        const res = await ApiService.orders.getTracking(oid);
        panel.innerHTML = buildTrackingPanel(res.data || res);
      } catch (err) {
        panel.innerHTML = `<div class="ord-tracking-err">Could not load tracking: ${escHtml(err.message)}</div>`;
      }
    }

    if (action === 'view-receipt') {
      btn.textContent = '…';
      btn.disabled = true;
      try {
        const res = await ApiService.receipts.get(oid);
        showReceiptModal(res.data || res, oid);
      } catch (err) {
        toast('Could not load receipt: ' + err.message, 'error');
      } finally {
        btn.innerHTML = '🧾 Receipt';
        btn.disabled = false;
      }
    }

    if (action === 'download-invoice') {
      btn.textContent = '…';
      btn.disabled = true;
      try {
        await ApiService.receipts.downloadPdf(oid, num);
        toast('Receipt downloaded!');
      } catch (err) {
        toast('Could not download: ' + err.message, 'error');
      } finally {
        btn.innerHTML = '📄 PDF';
        btn.disabled = false;
      }
    }

    if (action === 'cancel-order') {
      if (!confirm('Cancel this order?')) return;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        await ApiService.orders.cancel(oid);
        toast('Order cancelled');
        refresh();
      } catch (err) {
        toast(err.message || 'Could not cancel', 'error');
        btn.disabled = false;
        btn.textContent = '✗ Cancel';
      }
    }

    if (action === 'request-return') {
      const reason = prompt('Please describe the reason for your return:');
      if (!reason?.trim()) return;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        await ApiService.returns.create(oid, reason.trim());
        toast('Return request submitted — we will review it shortly.');
        refresh();
      } catch (err) {
        toast(err.message || 'Could not submit return', 'error');
        btn.disabled = false;
        btn.textContent = '↩ Return';
      }
    }
  });
}

function readAddressPayload() {
  return {
    label: document.getElementById('addr-label')?.value?.trim() || null,
    province: document.getElementById('addr-province')?.value?.trim(),
    district: document.getElementById('addr-district')?.value?.trim(),
    sector: document.getElementById('addr-sector')?.value?.trim(),
    cell: document.getElementById('addr-cell')?.value?.trim(),
    village: document.getElementById('addr-village')?.value?.trim(),
    deliveryPhoneNumber: document.getElementById('addr-phone')?.value?.trim() || null,
    deliveryInstructions: document.getElementById('addr-note')?.value?.trim() || null,
    defaultAddress: !!document.getElementById('addr-default')?.checked,
  };
}

function bindAddresses(helpers) {
  const { toast, refresh } = helpers;
  const formWrap = document.getElementById('address-form-wrap');
  const container = document.getElementById('addresses-container');
  if (!container || !formWrap) return;

  const openForm = (address = null) => {
    formWrap.innerHTML = renderAddressForm(address);
    formWrap.style.display = '';

    document.getElementById('btn-cancel-address')?.addEventListener('click', () => {
      formWrap.style.display = 'none';
      formWrap.innerHTML = '';
    });

    document.getElementById('address-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const id = e.target.dataset.id;
      const msgEl = document.getElementById('addr-msg');
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Saving…';
      try {
        const payload = readAddressPayload();
        if (id) await ApiService.addresses.update(id, payload);
        else await ApiService.addresses.create(payload);
        showMsg(msgEl, 'Address saved.', 'success');
        setTimeout(() => refresh(), 300);
      } catch (err) {
        showMsg(msgEl, err.message || 'Failed to save address', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Address';
      }
    });
  };

  document.getElementById('btn-add-address')?.addEventListener('click', () => openForm(null));

  container.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'edit-address') {
      const res = await ApiService.addresses.get();
      const addresses = res.data || [];
      const current = addresses.find(a => a.id === id);
      openForm(current || null);
      return;
    }

    if (action === 'set-default-address') {
      try {
        await ApiService.addresses.setDefault(id);
        toast('Default address updated');
        refresh();
      } catch (err) {
        toast(err.message || 'Could not set default', 'error');
      }
      return;
    }

    if (action === 'delete-address') {
      if (!confirm('Delete this address?')) return;
      try {
        await ApiService.addresses.delete(id);
        toast('Address deleted');
        refresh();
      } catch (err) {
        toast(err.message || 'Could not delete address', 'error');
      }
    }
  });
}

function bindLogout(helpers) {
  const { navigate, toast } = helpers;
  document.getElementById('btn-account-logout')?.addEventListener('click', () => {
    ApiService.auth.logout();
    toast('Logged out successfully');
    navigate('home', { activeCategory: null, searchQuery: '' });
  });
}

export function bindEvents(state, helpers) {
  bindSectionMenu(helpers);

  const section = activeSection();
  if (section === 'profile') bindProfileEdit();
  if (section === 'orders') bindOrders(helpers);
  if (section === 'addresses') bindAddresses(helpers);
  if (section === 'password') bindPasswordReset();
  if (section === 'logout') bindLogout(helpers);
}
