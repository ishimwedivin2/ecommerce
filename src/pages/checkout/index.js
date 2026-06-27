import './style.css';
import { ApiService } from '../../api.js';
import { setState } from '../../store.js';

const BACKEND = 'http://localhost:8080';

function getItemImage(item) {
  const p = item.product || item;
  if (Array.isArray(p.images) && p.images.length > 0) {
    const primary = p.images.find(i => i.isPrimary || i.primary) || p.images[0];
    const url = primary?.url || '';
    return url.startsWith('/uploads/') ? BACKEND + url : url;
  }
  const url = p.imageUrl || item.imageUrl || '';
  return url.startsWith('/uploads/') ? BACKEND + url : url;
}

// ── state ────────────────────────────────────────────────
let _step          = 1;   // 1=shipping 2=payment 3=processing 4=success
let _paymentMethod = 'MTN_MOMO';
let _appliedCoupon = null;
let _cart          = null;
let _order         = null;   // created after checkout call
let _receipt       = null;   // fetched after payment confirmed
let _pollTimer     = null;
let _pollCount     = 0;
const MAX_POLLS    = 40;     // 40 × 3 s = 2 min timeout

// ── helpers ──────────────────────────────────────────────
const fmtMoney = v => 'RWF ' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0 });
const fmtDate  = v => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function setStep(n) {
  _step = n;
  document.querySelectorAll('.chk-step').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === n);
    el.classList.toggle('done',   i + 1 < n);
  });
  document.querySelectorAll('.chk-panel').forEach((el, i) => {
    el.style.display = i + 1 === n ? '' : 'none';
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = msg ? '' : 'none'; }
}

function cardFormatInput(el) {
  el.addEventListener('input', () => {
    const raw = el.value.replace(/\D/g, '').slice(0, 16);
    el.value = raw.replace(/(.{4})/g, '$1 ').trim();
  });
}

function expiryFormatInput(el) {
  el.addEventListener('input', () => {
    const raw = el.value.replace(/\D/g, '').slice(0, 4);
    el.value = raw.length > 2 ? raw.slice(0, 2) + '/' + raw.slice(2) : raw;
  });
}

// ── render ───────────────────────────────────────────────
export async function render() {
  const cartRes = await ApiService.cart.get();
  _cart = cartRes.data;
  _step = 1;
  _appliedCoupon = null;
  _order  = null;
  _receipt = null;
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }

  const user = ApiService.getCurrentUser() || {};
  const items = _cart.items || [];
  const subtotal = Number(_cart.totalAmount || 0);

  const itemsHtml = items.map(item => `
    <div class="chk-item">
      <img class="chk-item-img" src="${getItemImage(item)}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22><rect width=%2256%22 height=%2256%22 fill=%22%23f1f5f9%22/><text x=%2228%22 y=%2234%22 text-anchor=%22middle%22 font-size=%2220%22>📦</text></svg>'">
      <div class="chk-item-info">
        <div class="chk-item-name">${item.product?.name || item.productName || 'Product'}</div>
        <div class="chk-item-meta">Qty ${item.quantity} × ${fmtMoney((item.product?.price || item.unitPrice || 0) * 1.18)}</div>
      </div>
      <div class="chk-item-total">${fmtMoney((item.product?.price || item.unitPrice || 0) * item.quantity * 1.18)}</div>
    </div>`).join('');

  return `
<div class="chk-wrap">

  <!-- ── Step indicator ── -->
  <div class="chk-steps">
    <div class="chk-step active" data-step="1"><div class="chk-step-num">1</div><div class="chk-step-lbl">Shipping</div></div>
    <div class="chk-step-line"></div>
    <div class="chk-step" data-step="2"><div class="chk-step-num">2</div><div class="chk-step-lbl">Payment</div></div>
    <div class="chk-step-line"></div>
    <div class="chk-step" data-step="3"><div class="chk-step-num">3</div><div class="chk-step-lbl">Processing</div></div>
    <div class="chk-step-line"></div>
    <div class="chk-step" data-step="4"><div class="chk-step-num">4</div><div class="chk-step-lbl">Confirmed</div></div>
  </div>

  <div class="chk-body">

    <!-- ── Left panel (steps) ── -->
    <div class="chk-left">

      <!-- Step 1 – Shipping -->
      <div class="chk-panel" data-panel="1">
        <h3 class="chk-sect-title">Shipping Information</h3>
        <div class="chk-field">
          <label>Full Name <span class="req">*</span></label>
          <input id="chk-name" type="text" value="${user.firstName ? user.firstName + ' ' + (user.lastName || '') : ''}" placeholder="John Doe">
        </div>
        <div class="chk-field">
          <label>Shipping Address <span class="req">*</span></label>
          <input id="chk-address" type="text" value="Kigali, Rwanda" placeholder="Street, City, Country">
        </div>
        <div class="chk-field">
          <label>Billing Address <span class="opt">(optional)</span></label>
          <input id="chk-billing" type="text" placeholder="Leave blank to use shipping address">
        </div>

        <h3 class="chk-sect-title" style="margin-top:20px">Discount Code</h3>
        <div class="coupon-row">
          <input id="chk-coupon" type="text" placeholder="e.g. LUZ24">
          <button id="btn-apply-coupon" class="btn-secondary">Apply</button>
        </div>
        <div id="coupon-feedback" class="coupon-feedback" style="display:none"></div>

        <div id="step1-err" class="chk-err" style="display:none"></div>
        <button class="btn-primary chk-next" id="btn-step1-next">Continue to Payment →</button>
      </div>

      <!-- Step 2 – Payment -->
      <div class="chk-panel" data-panel="2" style="display:none">
        <h3 class="chk-sect-title">Choose Payment Method</h3>
        <div class="payment-methods">
          <div class="payment-method-card active" data-method="MTN_MOMO">
            <span class="payment-method-icon">📱</span>
            <strong>MTN MoMo</strong>
            <span>Mobile Money</span>
          </div>
          <div class="payment-method-card" data-method="AIRTEL_MONEY">
            <span class="payment-method-icon">📲</span>
            <strong>Airtel Money</strong>
            <span>Mobile Wallet</span>
          </div>
          <div class="payment-method-card" data-method="STRIPE">
            <span class="payment-method-icon">💳</span>
            <strong>Card (Stripe)</strong>
            <span>Visa / Mastercard</span>
          </div>
        </div>

        <!-- MTN MoMo fields -->
        <div id="fields-MTN_MOMO" class="pay-fields">
          <h3 class="chk-sect-title">MTN Mobile Money</h3>
          <div class="chk-field">
            <label>MTN Phone Number <span class="req">*</span></label>
            <input id="mtn-phone" type="tel" value="${user.phoneNumber || ''}" placeholder="e.g. 0788123456">
            <small class="chk-hint">You will receive a payment prompt on this number</small>
          </div>
        </div>

        <!-- Airtel Money fields -->
        <div id="fields-AIRTEL_MONEY" class="pay-fields" style="display:none">
          <h3 class="chk-sect-title">Airtel Money</h3>
          <div class="chk-field">
            <label>Airtel Phone Number <span class="req">*</span></label>
            <input id="airtel-phone" type="tel" value="${user.phoneNumber || ''}" placeholder="e.g. 0730123456">
            <small class="chk-hint">You will receive a payment prompt on this number</small>
          </div>
        </div>

        <!-- Stripe Card fields -->
        <div id="fields-STRIPE" class="pay-fields" style="display:none">
          <h3 class="chk-sect-title">Card Payment (Stripe)</h3>
          <div class="chk-field">
            <div id="stripe-card-element" style="border:1px solid #e2e8f0;padding:12px;border-radius:8px;background:#fff;min-height:42px"></div>
            <div id="stripe-card-errors" style="color:#dc2626;font-size:12px;margin-top:6px"></div>
            <small class="chk-hint">🔒 Your card is processed securely by Stripe. We never see your card number.</small>
          </div>
        </div>

        <div id="step2-err" class="chk-err" style="display:none"></div>
        <div class="chk-btn-row">
          <button class="btn-secondary" id="btn-step2-back">← Back</button>
          <button class="btn-primary" id="btn-step2-pay">Pay ${fmtMoney(subtotal * 1.18)}</button>
        </div>
      </div>

      <!-- Step 3 – Processing -->
      <div class="chk-panel" data-panel="3" style="display:none">
        <div class="chk-processing">
          <div class="chk-spinner"></div>
          <div id="proc-title" class="chk-proc-title">Processing Payment…</div>
          <div id="proc-msg" class="chk-proc-msg">Please wait while we confirm your payment.</div>
          <div id="proc-poll" class="chk-proc-poll" style="display:none">
            <div class="chk-poll-bar"><div class="chk-poll-fill" id="poll-fill"></div></div>
            <div id="poll-counter" class="chk-poll-counter">Checking…</div>
          </div>
        </div>
      </div>

      <!-- Step 4 – Success / Receipt -->
      <div class="chk-panel" data-panel="4" style="display:none">
        <div class="chk-success-banner">
          <div class="chk-success-ico">✓</div>
          <div class="chk-success-title">Payment Confirmed!</div>
          <div id="success-order-num" class="chk-success-sub"></div>
        </div>
        <div id="receipt-block" class="chk-receipt"></div>
        <div class="chk-receipt-actions">
          <button class="btn-primary" id="btn-download-pdf">⬇ Download PDF Receipt</button>
          <button class="btn-secondary" id="btn-print-receipt">🖨 Print Receipt</button>
          <button class="btn-secondary" id="btn-continue-shopping">Continue Shopping</button>
        </div>
      </div>

    </div><!-- /chk-left -->

    <!-- ── Right panel (order summary) ── -->
    <div class="chk-right">
      <div class="chk-summary">
        <h3 class="chk-summary-title">Your Order</h3>
        <div class="chk-summary-items">${itemsHtml}</div>
        <div class="chk-summary-divider"></div>
        <div class="chk-summary-row" id="sum-discount-row" style="display:none;color:#10B981">
          <span>Discount</span><span id="sum-discount">-RWF 0</span>
        </div>
        <div class="chk-summary-divider"></div>
        <div class="chk-summary-row total"><span>Total</span><span id="sum-total">${fmtMoney(subtotal * 1.18)}</span></div>
        <span id="sum-tax" style="display:none">${fmtMoney(subtotal * 0.18)}</span>
        <div class="chk-summary-method" id="sum-method">
          <span class="chk-method-ico">📱</span>
          <span id="sum-method-name">MTN MoMo</span>
        </div>
      </div>
    </div>

  </div><!-- /chk-body -->
</div>`;
}

// ── bind events ──────────────────────────────────────────
export function bindEvents(state, helpers) {
  const { navigate, toast } = helpers;

  // ── Step indicators ──
  setStep(1);

  // ── Payment method selection ──
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      _paymentMethod = card.dataset.method;
      // show matching fields
      document.querySelectorAll('.pay-fields').forEach(f => f.style.display = 'none');
      const fields = document.getElementById('fields-' + _paymentMethod);
      if (fields) fields.style.display = '';
      // Initialise Stripe Elements when Stripe tab is selected
      if (_paymentMethod === 'STRIPE' && !window._stripe) {
        const STRIPE_PK = 'pk_test_51TmMXjDaKj9gog2tfPZFR36HRUQwHVpsG8GhoKdmnRz3r9Rnv2cPlC7KqJrS7scBK845ggW2ESH7Gkb8iYFA69KY00yLaZLIyW';
        if (!window.Stripe) {
          const s = document.createElement('script');
          s.src = 'https://js.stripe.com/v3/';
          s.onload = () => mountStripeCard(STRIPE_PK);
          document.head.appendChild(s);
        } else {
          mountStripeCard(STRIPE_PK);
        }
      }
      // update summary icon
      const icons = { MTN_MOMO: '📱', AIRTEL_MONEY: '📲', STRIPE: '💳' };
      const names = { MTN_MOMO: 'MTN MoMo', AIRTEL_MONEY: 'Airtel Money', STRIPE: 'Card (Stripe)' };
      const ico  = document.getElementById('sum-method');
      const ico2 = ico?.querySelector('.chk-method-ico');
      const nm   = document.getElementById('sum-method-name');
      if (ico2) ico2.textContent = icons[_paymentMethod] || '💳';
      if (nm)   nm.textContent  = names[_paymentMethod] || _paymentMethod;
    });
  });

  // Card formatting was for BK Card (removed) — Stripe Elements handles its own formatting

  // ── Coupon ──
  document.getElementById('btn-apply-coupon')?.addEventListener('click', async () => {
    const code = document.getElementById('chk-coupon')?.value?.trim();
    const fb   = document.getElementById('coupon-feedback');
    if (!code) return;
    try {
      const res    = await ApiService.finance.validateCoupon(code);
      const coupon = res.data;
      _appliedCoupon = coupon;
      setState({ appliedCoupon: coupon });

      const subtotal = Number(_cart?.totalAmount || 0);
      const discount = coupon.type === 'PERCENTAGE'
        ? Math.min(subtotal * coupon.amount / 100, subtotal)
        : Math.min(Number(coupon.amount), subtotal);

      document.getElementById('sum-discount').textContent = '-' + fmtMoney(discount);
      document.getElementById('sum-discount-row').style.display = 'flex';
      const newBase  = subtotal - discount;
      const newTotal = newBase * 1.18;
      const newTax   = newBase * 0.18;
      document.getElementById('sum-total').textContent = fmtMoney(newTotal);
      document.getElementById('sum-tax').textContent   = fmtMoney(newTax);
      document.getElementById('btn-step2-pay').textContent = 'Pay ' + fmtMoney(newTotal);

      if (fb) {
        fb.style.display = '';
        fb.className = 'coupon-feedback success';
        fb.textContent = `✓ "${coupon.code}" applied — ${coupon.type === 'PERCENTAGE' ? coupon.amount + '% off' : fmtMoney(coupon.amount) + ' off'}`;
      }
    } catch (err) {
      _appliedCoupon = null;
      setState({ appliedCoupon: null });
      if (fb) {
        fb.style.display = '';
        fb.className = 'coupon-feedback error';
        fb.textContent = '✗ ' + err.message;
      }
    }
  });

  // ── Step 1 → 2 ──
  document.getElementById('btn-step1-next')?.addEventListener('click', () => {
    const name    = document.getElementById('chk-name')?.value?.trim();
    const address = document.getElementById('chk-address')?.value?.trim();
    showError('step1-err', '');
    if (!name || !address) {
      showError('step1-err', 'Please enter your full name and shipping address.');
      return;
    }
    setStep(2);
  });

  // ── Step 2 → 1 ──
  document.getElementById('btn-step2-back')?.addEventListener('click', () => setStep(1));

  // ── Step 2 → Pay ──
  document.getElementById('btn-step2-pay')?.addEventListener('click', async () => {
    showError('step2-err', '');
    if (!validatePaymentFields()) return;

    const address  = document.getElementById('chk-address').value.trim();
    const billing  = document.getElementById('chk-billing').value.trim() || address;
    const couponCode = _appliedCoupon?.code || null;

    const btn = document.getElementById('btn-step2-pay');
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    try {
      // 1. Create order from cart
      const orderRes = await ApiService.cart.checkout(address, billing, _paymentMethod, couponCode);
      _order = orderRes.data;
      setState({ appliedCoupon: null });

      // 2. Move to processing screen
      setStep(3);
      showProcessingUI(_paymentMethod);

      // 3. Initiate payment
      const payRes = await ApiService.payments.initiate(_order.id, _paymentMethod);
      const payData = payRes.data || payRes;

      if (_paymentMethod === 'STRIPE' && payData.clientSecret) {
        // Stripe: confirm card payment using Stripe.js
        if (!window._stripe || !window._stripeCardElement) {
          throw new Error('Stripe not initialised — please reload and try again.');
        }
        const { error, paymentIntent } = await window._stripe.confirmCardPayment(payData.clientSecret, {
          payment_method: { card: window._stripeCardElement }
        });
        if (error) throw new Error(error.message);
        // Verify server-side with Stripe API and mark order PAID
        await ApiService.payments.confirmStripe(_order.id, paymentIntent.id);
        await handlePaymentConfirmed();
      } else if (payData.paid) {
        // Immediate confirmation (Airtel stub)
        await handlePaymentConfirmed();
      } else {
        // Async (MTN) — start polling
        startPolling(_order.id);
      }
    } catch (err) {
      setStep(2);
      showError('step2-err', err.message || 'Payment failed. Please try again.');
      btn.disabled = false;
      const subtotal = Number(_cart?.totalAmount || 0);
      btn.textContent = 'Pay ' + fmtMoney(subtotal * 1.18);
    }
  });

  // ── Success buttons ──
  document.getElementById('btn-download-pdf')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-pdf');
    if (!_order?.id) return;
    btn.disabled = true; btn.textContent = 'Generating…';
    try {
      await ApiService.receipts.downloadPdf(_order.id, _order.orderNumber);
      toast('Receipt downloaded!');
    } catch (err) {
      toast('Could not download PDF: ' + err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = '⬇ Download PDF Receipt';
    }
  });

  document.getElementById('btn-print-receipt')?.addEventListener('click', () => {
    if (!_receipt) { toast('Receipt not yet loaded — try again in a moment', 'error'); return; }
    const r = _receipt;
    const itemsHtml = (r.items || []).map(i =>
      `<div class="pi"><span>${i.productName||'Product'} ×${i.quantity}</span><span>${fmtMoney(Number(i.subTotal) * 1.18)}</span></div>`
    ).join('');
    const win = window.open('', '_blank', 'width=520,height=760');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt — ${r.receiptNumber||r.orderNumber}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;padding:28px;color:#1e293b;max-width:420px;margin:0 auto}
        .brand{text-align:center;font-size:20px;font-weight:800;color:#FF6B00;margin-bottom:2px}
        .sub{text-align:center;font-size:11px;color:#94a3b8;margin-bottom:10px}
        h2{text-align:center;font-size:14px;font-weight:700;margin-bottom:12px}
        .meta{font-size:12px;color:#64748b;line-height:2;margin-bottom:12px}
        .meta div{display:flex;justify-content:space-between}
        .items{border-top:1px dashed #ccc;border-bottom:1px dashed #ccc;padding:10px 0;margin:12px 0}
        .pi{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px}
        .totals{font-size:13px}
        .tot-r{display:flex;justify-content:space-between;color:#64748b;margin-bottom:3px;padding:2px 0}
        .grand{display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:2px solid #e2e8f0;padding-top:8px;margin-top:6px}
        .grand span:last-child{color:#FF6B00}
        .footer{text-align:center;font-size:11px;color:#94a3b8;margin-top:20px;border-top:1px dashed #ccc;padding-top:12px}
        @media print{body{padding:10px}}
      </style>
    </head><body>
      <div class="brand">Luz Technology</div>
      <div class="sub">Payment Receipt</div>
      <h2>Order #${r.orderNumber||'—'}</h2>
      <div class="meta">
        <div><span>Receipt No</span><span>${r.receiptNumber||'—'}</span></div>
        <div><span>Customer</span><span>${r.customerName||'—'}</span></div>
        <div><span>Payment</span><span>${(r.paymentMethod||'—').replace(/_/g,' ')}</span></div>
        <div><span>Reference</span><span>${r.paymentReference||'—'}</span></div>
        <div><span>Date</span><span>${r.issuedAt ? new Date(r.issuedAt).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}) : '—'}</span></div>
      </div>
      <div class="items">${itemsHtml}</div>
      ${Number(r.discountAmount) > 0 ? `<div class="tot-r" style="color:#10b981;"><span>${r.couponCode ? 'Discount (' + r.couponCode + ')' : 'Discount'}</span><span>-${fmtMoney(r.discountAmount)}</span></div>` : ''}
      <div class="grand"><span>Total Paid</span><span>${fmtMoney(r.totalAmount)}</span></div>
      <div class="tot-r" style="margin-top:4px;"><span>Includes VAT (${Number((r.taxRate||0)*100).toFixed(0)}%)</span><span>${fmtMoney(r.taxAmount)}</span></div>
      <div class="footer">Thank you for shopping at Luz Technology!</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  });

  document.getElementById('btn-continue-shopping')?.addEventListener('click', () => {
    navigate('shop');
  });
}

// ── validate payment fields ──────────────────────────────
function validatePaymentFields() {
  if (_paymentMethod === 'MTN_MOMO') {
    const phone = document.getElementById('mtn-phone')?.value?.replace(/\s/g, '');
    if (!phone || !/^07[89]\d{7}$/.test(phone)) {
      showError('step2-err', 'MTN number must be 10 digits and start with 078 or 079.');
      return false;
    }
  } else if (_paymentMethod === 'AIRTEL_MONEY') {
    const phone = document.getElementById('airtel-phone')?.value?.replace(/\s/g, '').replace(/^\+/, '');
    if (!phone || phone.length < 9) {
      showError('step2-err', 'Please enter a valid Airtel phone number.');
      return false;
    }
  } else if (_paymentMethod === 'STRIPE') {
    if (!window._stripeCardElement) {
      showError('step2-err', 'Card element not loaded. Please wait a moment and try again.');
      return false;
    }
  }
  return true;
}

// ── Stripe Elements mount ─────────────────────────────────
function mountStripeCard(publishableKey) {
  window._stripe = window.Stripe(publishableKey);
  const elements = window._stripe.elements();
  window._stripeCardElement = elements.create('card', {
    style: {
      base: { fontSize: '16px', color: '#0F172A', fontFamily: 'inherit',
              '::placeholder': { color: '#94A3B8' } },
      invalid: { color: '#dc2626' }
    }
  });
  window._stripeCardElement.mount('#stripe-card-element');
  window._stripeCardElement.on('change', e => {
    const el = document.getElementById('stripe-card-errors');
    if (el) el.textContent = e.error ? e.error.message : '';
  });
}

// ── processing screen ────────────────────────────────────
function showProcessingUI(method) {
  const msgs = {
    MTN_MOMO:     ['Waiting for MTN approval…', 'Check your phone for a payment prompt and enter your PIN to confirm.'],
    AIRTEL_MONEY: ['Contacting Airtel Money…',  'Check your phone for a payment prompt.'],
    STRIPE:       ['Processing card payment…',  'Verifying your card securely with Stripe. Please do not close this page.'],
  };
  const [title, msg] = msgs[method] || ['Processing…', 'Please wait.'];
  const t = document.getElementById('proc-title');
  const m = document.getElementById('proc-msg');
  if (t) t.textContent = title;
  if (m) m.textContent = msg;
  if (method === 'MTN_MOMO') {
    const poll = document.getElementById('proc-poll');
    if (poll) poll.style.display = '';
  }
}

// ── MTN polling ──────────────────────────────────────────
function startPolling(orderId) {
  _pollCount = 0;
  if (_pollTimer) clearInterval(_pollTimer);

  _pollTimer = setInterval(async () => {
    _pollCount++;
    const fill    = document.getElementById('poll-fill');
    const counter = document.getElementById('poll-counter');
    const pct     = Math.min((_pollCount / MAX_POLLS) * 100, 100);
    if (fill)    fill.style.width = pct + '%';
    if (counter) counter.textContent = `Attempt ${_pollCount} of ${MAX_POLLS} — waiting for payment confirmation…`;

    if (_pollCount >= MAX_POLLS) {
      clearInterval(_pollTimer);
      _pollTimer = null;
      handlePaymentTimeout();
      return;
    }

    try {
      const res  = await ApiService.payments.checkStatus(orderId);
      const data = res.data || res;
      if (data.paid) {
        clearInterval(_pollTimer);
        _pollTimer = null;
        await handlePaymentConfirmed();
      }
    } catch (_) { /* keep polling */ }
  }, 3000);
}

// ── confirmed ────────────────────────────────────────────
async function handlePaymentConfirmed() {
  try {
    const res = await ApiService.receipts.get(_order.id);
    _receipt = res.data || res;
  } catch (_) {}

  const numEl = document.getElementById('success-order-num');
  if (numEl) numEl.textContent = 'Order ' + (_order?.orderNumber || '');

  renderReceiptBlock();
  setStep(4);
}

// ── timeout ──────────────────────────────────────────────
function handlePaymentTimeout() {
  const title = document.getElementById('proc-title');
  const msg   = document.getElementById('proc-msg');
  if (title) title.textContent = 'Payment Timed Out';
  if (msg)   msg.textContent   = 'We did not receive payment confirmation within 2 minutes. If your card was charged, please contact support with your order number.';
  const spinner = document.querySelector('.chk-spinner');
  if (spinner) { spinner.style.borderTopColor = '#EF4444'; spinner.style.animationDuration = '0s'; }
}

// ── receipt block ────────────────────────────────────────
function renderReceiptBlock() {
  const el = document.getElementById('receipt-block');
  if (!el) return;

  if (!_receipt) {
    el.innerHTML = `<p style="color:#64748B;text-align:center">Receipt details will appear here once loaded.</p>`;
    return;
  }

  const r = _receipt;
  const itemsHtml = (r.items || []).map(item => `
    <tr>
      <td>${item.productName || '—'}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${fmtMoney(item.unitPrice)}</td>
      <td style="text-align:right">${fmtMoney(item.subTotal)}</td>
    </tr>`).join('');

  el.innerHTML = `
  <div class="rcpt-box">
    <div class="rcpt-header">
      <div class="rcpt-brand">Luz Technology</div>
      <div class="rcpt-title">Payment Receipt</div>
    </div>
    <div class="rcpt-meta">
      <div class="rcpt-row"><span>Receipt No</span><span>${r.receiptNumber || '—'}</span></div>
      <div class="rcpt-row"><span>Order No</span><span>${r.orderNumber || '—'}</span></div>
      <div class="rcpt-row"><span>Customer</span><span>${r.customerName || '—'}</span></div>
      <div class="rcpt-row"><span>Payment Method</span><span>${(r.paymentMethod || '—').replace(/_/g,' ')}</span></div>
      <div class="rcpt-row"><span>Reference</span><span class="rcpt-ref">${r.paymentReference || '—'}</span></div>
      <div class="rcpt-row"><span>Date</span><span>${fmtDate(r.issuedAt)}</span></div>
    </div>
    <table class="rcpt-table">
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="rcpt-totals">
      <div class="rcpt-total-row"><span>Subtotal</span><span>${fmtMoney(r.subTotalAmount)}</span></div>
      ${Number(r.discountAmount) > 0 ? `
      <div class="rcpt-total-row" style="color:#10B981;">
        <span>${r.couponCode ? 'Discount (' + r.couponCode + ')' : 'Discount'}</span>
        <span>-${fmtMoney(r.discountAmount)}</span>
      </div>` : ''}
      <div class="rcpt-total-row"><span>Tax (${Number((r.taxRate || 0) * 100).toFixed(0)}%)</span><span>${fmtMoney(r.taxAmount)}</span></div>
      <div class="rcpt-total-row grand"><span>Total Paid</span><span>${fmtMoney(r.totalAmount)}</span></div>
    </div>
    <div class="rcpt-footer">Thank you for shopping at Luz Technology!</div>
  </div>`;
}
