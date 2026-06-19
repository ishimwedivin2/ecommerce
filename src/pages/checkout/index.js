import './style.css';
import { ApiService } from '../../api.js';
import { appState, setState } from '../../store.js';

export async function render() {
  const cartRes = await ApiService.cart.get();
  const cart = cartRes.data;
  const user = ApiService.getCurrentUser() || {};

  return `
    <h2 style="margin-bottom:24px;">Checkout</h2>
    <div class="cart-layout">
      <div class="cart-items-container">
        <form class="checkout-form" id="checkout-form-element">
          <h3>Shipping Information</h3>
          <div class="auth-form-group">
            <label>Full Name</label>
            <input type="text" id="chk-name" value="${user.firstName ? (user.firstName + ' ' + user.lastName) : ''}" required>
          </div>
          <div class="auth-form-group">
            <label>Shipping Address</label>
            <input type="text" id="chk-address" value="Kigali, Rwanda" placeholder="Street Address, City, Country" required>
          </div>
          <div class="auth-form-group">
            <label>Billing Address (Optional)</label>
            <input type="text" id="chk-billing" placeholder="Same as shipping address">
          </div>

          <h3 style="margin-top:20px;">Discount Code</h3>
          <div class="coupon-row">
            <input type="text" id="chk-coupon" placeholder="Enter coupon code (e.g. LUZ24)">
            <button type="button" id="btn-apply-coupon" class="btn-secondary">Apply</button>
          </div>
          <div id="coupon-feedback" class="coupon-feedback" style="display:none;"></div>

          <h3 style="margin-top:20px;">Payment Method</h3>
          <div class="payment-methods">
            <div class="payment-method-card active" data-method="MTN_MOMO">
              <span class="payment-method-icon">📱</span>
              <strong>MTN MoMo</strong>
              <span>Instant Mobile Money</span>
            </div>
            <div class="payment-method-card" data-method="BK_CARD">
              <span class="payment-method-icon">💳</span>
              <strong>BK Card</strong>
              <span>Bank of Kigali Card</span>
            </div>
            <div class="payment-method-card" data-method="PAYPAL">
              <span class="payment-method-icon">💸</span>
              <strong>PayPal</strong>
              <span>Global Checkout</span>
            </div>
            <div class="payment-method-card" data-method="AIRTEL_MONEY">
              <span class="payment-method-icon">📲</span>
              <strong>Airtel Money</strong>
              <span>Mobile Money Wallet</span>
            </div>
          </div>
        </form>
      </div>

      <div class="cart-summary">
        <h3>Your Order</h3>
        <div class="summary-row"><span>Subtotal</span><span>£${cart.totalPrice.toFixed(2)}</span></div>
        <div class="summary-row" id="discount-row" style="display:none;color:var(--success);">
          <span>Discount</span>
          <span id="discount-amount">-£0.00</span>
        </div>
        <div class="summary-row total" style="margin-top:8px;">
          <span>Total Amount</span>
          <span id="checkout-total">£${cart.totalPrice.toFixed(2)}</span>
        </div>
        <button class="btn-primary" id="btn-place-order" style="justify-content:center;width:100%;margin-top:8px;">
          Place Order & Pay
        </button>
      </div>
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { navigate, toast } = helpers;
  let selectedPaymentMethod = 'MTN_MOMO';

  // Coupon
  document.getElementById('btn-apply-coupon')?.addEventListener('click', async () => {
    const code = document.getElementById('chk-coupon')?.value?.trim();
    const feedback = document.getElementById('coupon-feedback');
    if (!code) return;
    try {
      const res = await ApiService.finance.validateCoupon(code);
      const coupon = res.data;
      setState({ appliedCoupon: coupon });

      const totalEl = document.getElementById('checkout-total');
      const discountRow = document.getElementById('discount-row');
      const discountAmountEl = document.getElementById('discount-amount');
      if (totalEl && discountRow && discountAmountEl) {
        const subtotal = parseFloat(totalEl.textContent.replace('£', ''));
        let discount = coupon.type === 'PERCENTAGE'
          ? (subtotal * coupon.amount / 100)
          : coupon.amount;
        discount = Math.min(discount, subtotal);
        discountAmountEl.textContent = `-£${discount.toFixed(2)}`;
        totalEl.textContent = `£${(subtotal - discount).toFixed(2)}`;
        discountRow.style.display = 'flex';
      }
      if (feedback) {
        feedback.style.display = 'block';
        feedback.className = 'coupon-feedback success';
        feedback.textContent = `✓ Code "${coupon.code}" applied — ${coupon.type === 'PERCENTAGE' ? coupon.amount + '% off' : '£' + coupon.amount + ' off'}`;
      }
    } catch (err) {
      setState({ appliedCoupon: null });
      if (feedback) {
        feedback.style.display = 'block';
        feedback.className = 'coupon-feedback error';
        feedback.textContent = '✗ ' + err.message;
      }
    }
  });

  // Payment method selection
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.payment-method-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedPaymentMethod = card.getAttribute('data-method');
    });
  });

  // Place order
  document.getElementById('btn-place-order')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const address = document.getElementById('chk-address').value;
    const name = document.getElementById('chk-name').value;
    const billing = document.getElementById('chk-billing').value || address;

    if (!address || !name) {
      toast('Please enter your name and address', 'error');
      return;
    }

    try {
      const couponCode = state.appliedCoupon?.code || null;
      const orderRes = await ApiService.cart.checkout(address, billing, selectedPaymentMethod, couponCode);
      const order = orderRes.data;

      toast(`Initiating ${selectedPaymentMethod} Payment Gateway...`);
      await ApiService.payments.initiate(order.id);

      setState({ appliedCoupon: null });
      toast('Order placed & paid successfully!');
      navigate('profile');
    } catch (err) {
      toast('Checkout failed: ' + err.message, 'error');
    }
  });
}
