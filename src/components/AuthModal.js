import './AuthModal.css';
import { ApiService } from '../api.js';
import { appState, setState } from '../store.js';
import { showToast } from './toast.js';

// ── SVG Icons ───────────────────────────────────────────────
const EyeIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EyeOffIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
const CloseIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
const GoogleIcon = `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
const LockIcon = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const ShieldIcon = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
const BackIcon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5m7-7l-7 7 7 7"/></svg>`;
const AlertIcon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const CheckIcon = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 6L9 17l-5-5"/></svg>`;

// ── Benefits lists ───────────────────────────────────────────
const LOGIN_BENEFITS = [
  { icon: '⚡', text: 'Faster checkout experience' },
  { icon: '📦', text: 'Track your orders in real time' },
  { icon: '❤️', text: 'Save favourite products' },
  { icon: '📍', text: 'Manage delivery addresses' },
  { icon: '🎁', text: 'Exclusive member offers' },
];
const REGISTER_BENEFITS = [
  { icon: '🚀', text: 'Faster future purchases' },
  { icon: '📋', text: 'Full order history access' },
  { icon: '💡', text: 'Personalised recommendations' },
  { icon: '🔔', text: 'Price drop notifications' },
  { icon: '🏷️', text: 'Member-only discounts' },
];

// ── Helpers ──────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return { score: 0, label: '', cls: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const cls    = ['', 'weak', 'fair', 'good', 'strong'];
  return { score, label: labels[score], cls: cls[score] };
}

function strengthBars(pw) {
  if (!pw) return '';
  const { cls, label, score } = pwStrength(pw);
  const bars = [1,2,3,4].map(i =>
    `<div class="auth-pw-bar${score >= i ? ' ' + cls : ''}"></div>`
  ).join('');
  return `
    <div class="auth-pw-strength">
      <div class="auth-pw-strength-bars">${bars}</div>
      <span class="auth-pw-label">Strength: <strong>${label}</strong></span>
    </div>`;
}

function googleBtn(label) {
  return `
    <button type="button" class="auth-google-btn" id="btn-google">
      ${GoogleIcon} ${label}
    </button>`;
}

function securityRow() {
  return `
    <div class="auth-security-row">
      <span class="auth-sec-badge">${LockIcon} Secure Login</span>
      <span class="auth-sec-badge">${ShieldIcon} SSL Protected</span>
      <span class="auth-sec-badge">${ShieldIcon} Encrypted</span>
    </div>`;
}

function sidePanel(benefits, headline, sub) {
  return `
    <div class="auth-side">
      <div class="auth-side-logo">
        <div class="auth-side-logo-icon">L</div>
        <div class="auth-side-logo-text">Luz Technology<span>Integrated Commerce</span></div>
      </div>
      <div class="auth-side-headline">${headline}</div>
      <div class="auth-side-sub">${sub}</div>
      <ul class="auth-benefits">
        ${benefits.map(b => `
          <li class="auth-benefit">
            <span class="auth-benefit-icon">${b.icon}</span>${b.text}
          </li>`).join('')}
      </ul>
      <div class="auth-side-security">
        ${ShieldIcon}
        <span>256-bit SSL encryption.<br>Your data is safe with us.</span>
      </div>
    </div>`;
}

// ── Screen renderers ─────────────────────────────────────────
function renderLogin() {
  return `
    <div class="auth-screen" id="auth-screen-login">
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">Sign In</button>
        <button class="auth-tab" data-tab="register">Create Account</button>
      </div>
      <h2 class="auth-screen-title">Welcome back</h2>
      <p class="auth-screen-subtitle">Sign in to your Luz Technology account</p>
      <div id="auth-alert-login"></div>
      ${googleBtn('Continue with Google')}
      <div class="auth-divider">or sign in with email</div>
      <form id="form-login" novalidate>
        <div class="auth-fields">
          <div class="auth-field">
            <label class="auth-label" for="login-email">Email Address</label>
            <input class="auth-input" type="email" id="login-email"
              placeholder="you@example.com" autocomplete="email" required>
            <span class="auth-field-error" id="err-login-email"></span>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="login-password">Password</label>
            <div class="auth-input-wrap">
              <input class="auth-input auth-input--pw" type="password" id="login-password"
                placeholder="Your password" autocomplete="current-password" required>
              <button type="button" class="auth-pw-toggle" data-target="login-password">${EyeIcon}</button>
            </div>
            <span class="auth-field-error" id="err-login-password"></span>
          </div>
          <div class="auth-meta-row">
            <label class="auth-remember">
              <input type="checkbox" id="login-remember"> Remember me
            </label>
            <button type="button" class="auth-link" id="btn-forgot">Forgot password?</button>
          </div>
        </div>
        <button type="submit" class="auth-submit" id="btn-login-submit">Sign In</button>
      </form>
      ${securityRow()}
      <div class="auth-switch">Don't have an account?
        <button data-tab="register">Create one free</button>
      </div>
    </div>`;
}

function renderRegister() {
  const prefill = appState._regPrefillEmail || '';
  return `
    <div class="auth-screen" id="auth-screen-register">
      <div class="auth-tabs">
        <button class="auth-tab" data-tab="login">Sign In</button>
        <button class="auth-tab active" data-tab="register">Create Account</button>
      </div>
      <h2 class="auth-screen-title">Create your account</h2>
      <p class="auth-screen-subtitle">Join thousands of happy Luz Technology customers</p>
      <div id="auth-alert-register"></div>
      ${googleBtn('Sign up with Google')}
      <div class="auth-divider">or register with email</div>
      <form id="form-register" novalidate>
        <div class="auth-fields">
          <div class="auth-fields--row">
            <div class="auth-field">
              <label class="auth-label" for="reg-first">First Name</label>
              <input class="auth-input" type="text" id="reg-first"
                placeholder="John" autocomplete="given-name" required>
              <span class="auth-field-error" id="err-reg-first"></span>
            </div>
            <div class="auth-field">
              <label class="auth-label" for="reg-last">Last Name</label>
              <input class="auth-input" type="text" id="reg-last"
                placeholder="Doe" autocomplete="family-name" required>
              <span class="auth-field-error" id="err-reg-last"></span>
            </div>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="reg-email">Email Address</label>
            <input class="auth-input" type="email" id="reg-email"
              placeholder="you@example.com" autocomplete="email" required value="${prefill}">
            <span class="auth-field-error" id="err-reg-email"></span>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="reg-password">Password</label>
            <div class="auth-input-wrap">
              <input class="auth-input auth-input--pw" type="password" id="reg-password"
                placeholder="Min. 6 characters" autocomplete="new-password" required minlength="6">
              <button type="button" class="auth-pw-toggle" data-target="reg-password">${EyeIcon}</button>
            </div>
            <div id="reg-pw-strength"></div>
            <span class="auth-field-error" id="err-reg-password"></span>
          </div>
        </div>
        <button type="submit" class="auth-submit" id="btn-register-submit">Create Account</button>
      </form>
      ${securityRow()}
      <div class="auth-switch">Already have an account?
        <button data-tab="login">Sign in</button>
      </div>
    </div>`;
}

function renderMfa() {
  return `
    <div class="auth-screen" id="auth-screen-mfa">
      <button class="auth-back" id="btn-mfa-back">${BackIcon} Back to Sign In</button>
      <div class="auth-mfa-header">
        <div class="auth-mfa-icon">🔐</div>
        <h2 class="auth-screen-title">Two-Factor Verification</h2>
        <p class="auth-screen-subtitle">A 6-digit code was sent to your email address. It expires in 10 minutes.</p>
      </div>
      <div id="auth-alert-mfa"></div>
      <form id="form-mfa" novalidate>
        <div class="auth-mfa-boxes">
          ${[0,1,2,3,4,5].map(i => `
            <input class="auth-otp-box" type="text" inputmode="numeric"
              maxlength="1" pattern="[0-9]" id="otp-${i}"
              autocomplete="${i === 0 ? 'one-time-code' : 'off'}"
              aria-label="Digit ${i + 1}">`).join('')}
        </div>
        <p class="auth-mfa-note">Enter the 6-digit verification code</p>
        <button type="submit" class="auth-submit" id="btn-mfa-submit" disabled>
          Verify &amp; Sign In
        </button>
      </form>
      <div class="auth-mfa-resend">
        Didn't receive it?
        <button type="button" id="btn-mfa-resend">Resend code</button>
      </div>
    </div>`;
}

function renderForgot() {
  return `
    <div class="auth-screen" id="auth-screen-forgot">
      <button class="auth-back" id="btn-forgot-back">${BackIcon} Back to Sign In</button>
      <div class="auth-compact-header">
        <div class="auth-compact-icon">🔑</div>
        <div>
          <h2 class="auth-screen-title">Reset password</h2>
          <p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.4;">
            Enter your email and we'll send a reset link if an account exists.
          </p>
        </div>
      </div>
      <div id="auth-alert-forgot"></div>
      <form id="form-forgot" novalidate>
        <div class="auth-fields">
          <div class="auth-field">
            <label class="auth-label" for="forgot-email">Email Address</label>
            <input class="auth-input" type="email" id="forgot-email"
              placeholder="you@example.com" autocomplete="email" required>
            <span class="auth-field-error" id="err-forgot-email"></span>
          </div>
        </div>
        <button type="submit" class="auth-submit" id="btn-forgot-submit">Send Reset Link</button>
      </form>
    </div>`;
}

function renderReset() {
  return `
    <div class="auth-screen" id="auth-screen-reset">
      <div class="auth-compact-header">
        <div class="auth-compact-icon">🔒</div>
        <div>
          <h2 class="auth-screen-title">New password</h2>
          <p style="margin:0;font-size:12.5px;color:#64748b;line-height:1.4;">
            Choose a strong password for your account.
          </p>
        </div>
      </div>
      <div id="auth-alert-reset"></div>
      <form id="form-reset" novalidate>
        <div class="auth-fields">
          <div class="auth-field">
            <label class="auth-label" for="reset-new">New Password</label>
            <div class="auth-input-wrap">
              <input class="auth-input auth-input--pw" type="password" id="reset-new"
                placeholder="Min. 6 characters" autocomplete="new-password" required minlength="6">
              <button type="button" class="auth-pw-toggle" data-target="reset-new">${EyeIcon}</button>
            </div>
            <div id="reset-pw-strength"></div>
            <span class="auth-field-error" id="err-reset-new"></span>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="reset-confirm">Confirm Password</label>
            <div class="auth-input-wrap">
              <input class="auth-input auth-input--pw" type="password" id="reset-confirm"
                placeholder="Repeat new password" autocomplete="new-password" required>
              <button type="button" class="auth-pw-toggle" data-target="reset-confirm">${EyeIcon}</button>
            </div>
            <span class="auth-field-error" id="err-reset-confirm"></span>
          </div>
        </div>
        <button type="submit" class="auth-submit" id="btn-reset-submit">Reset Password</button>
      </form>
    </div>`;
}

// ── Main render export ───────────────────────────────────────
export function render(mode = 'login') {
  const isCompact = ['mfa', 'forgot', 'reset'].includes(mode);
  const isTwoCol  = ['login', 'register'].includes(mode);

  const benefits = mode === 'register' ? REGISTER_BENEFITS : LOGIN_BENEFITS;
  const headline = mode === 'register' ? 'Join Luz Technology' : 'Welcome back';
  const subtext  = mode === 'register'
    ? 'Create an account and enjoy a smarter shopping experience.'
    : 'Sign in to access orders, wishlist, and exclusive deals.';

  const screens = { login: renderLogin, register: renderRegister, mfa: renderMfa, forgot: renderForgot, reset: renderReset };
  const screenHtml = (screens[mode] || renderLogin)();

  return `
    <div class="auth-overlay" id="auth-overlay">
      <div class="auth-modal${isCompact ? ' auth-modal--compact' : ''}">
        <button class="auth-close" id="auth-close" aria-label="Close">${CloseIcon}</button>
        ${isTwoCol ? sidePanel(benefits, headline, subtext) : ''}
        <div class="auth-main">
          ${screenHtml}
        </div>
      </div>
    </div>`;
}

// ── UI state helpers ─────────────────────────────────────────
function setAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!msg) { el.innerHTML = ''; return; }
  const icon = type === 'error' ? AlertIcon : CheckIcon;
  el.innerHTML = `<div class="auth-alert auth-alert--${type}"><span class="auth-alert-icon">${icon}</span>${msg}</div>`;
}

function setLoading(btnId, loading, label) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (label) btn.dataset.label = label;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="auth-spinner"></span> Please wait…`
    : (btn.dataset.label || label || 'Submit');
}

function fieldErr(errId, msg) {
  const el = document.getElementById(errId);
  if (el) el.textContent = msg || '';
  const inp = document.getElementById(errId.replace(/^err-/, ''));
  if (inp) inp.classList.toggle('is-error', !!msg);
}

function clearErrs(...ids) { ids.forEach(id => fieldErr(id, '')); }

function bindPwToggle(targetId) {
  const btn = document.querySelector(`.auth-pw-toggle[data-target="${targetId}"]`);
  const inp = document.getElementById(targetId);
  if (!btn || !inp) return;
  btn.addEventListener('click', () => {
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    btn.innerHTML = show ? EyeOffIcon : EyeIcon;
  });
}

function successScreen(parentEl, title, body, btnLabel, onAction) {
  parentEl.innerHTML = `
    <div class="auth-success-screen">
      <div class="auth-success-icon">✅</div>
      <h3>${title}</h3>
      <p>${body}</p>
      <button class="auth-submit" id="btn-success-cta">${btnLabel}</button>
    </div>`;
  document.getElementById('btn-success-cta')?.addEventListener('click', onAction);
}

// ── bindEvents export ────────────────────────────────────────
export function bindEvents(helpers) {
  const { renderAuthModal, renderAll } = helpers;

  // ── Close modal
  const closeModal = () => { setState({ authModalMode: null }); renderAuthModal(); };
  document.getElementById('auth-close')?.addEventListener('click', closeModal);
  document.getElementById('auth-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'auth-overlay') closeModal();
  });

  // ── Tab switches (login ↔ register + "switch" links)
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ authModalMode: btn.dataset.tab });
      renderAuthModal();
    });
  });

  // ── Password show/hide toggles
  bindPwToggle('login-password');
  bindPwToggle('reg-password');
  bindPwToggle('reset-new');
  bindPwToggle('reset-confirm');

  // ── Google OAuth
  document.getElementById('btn-google')?.addEventListener('click', () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  });

  // ════════════════════════════════════════════════════════════
  // LOGIN
  // ════════════════════════════════════════════════════════════
  document.getElementById('btn-forgot')?.addEventListener('click', () => {
    setState({ authModalMode: 'forgot' }); renderAuthModal();
  });

  document.getElementById('form-login')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const pass  = document.getElementById('login-password')?.value;
    clearErrs('err-login-email', 'err-login-password');
    setAlert('auth-alert-login', null, '');

    if (!email) { fieldErr('err-login-email', 'Email is required'); return; }
    if (!pass)  { fieldErr('err-login-password', 'Password is required'); return; }

    setLoading('btn-login-submit', true, 'Sign In');
    try {
      const res = await ApiService.auth.login(email, pass);
      if (res.data?.mfaRequired) {
        setState({ pendingMfaToken: res.data.mfaToken, authModalMode: 'mfa' });
        renderAuthModal();
      } else {
        setState({ authModalMode: null });
        renderAll();
        showToast('Welcome back! Signed in successfully.', 'success');
      }
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('lock')) {
        setAlert('auth-alert-login', 'error',
          'Account locked due to too many failed attempts. <button class="auth-link" id="btn-alert-forgot">Reset your password</button>');
        document.getElementById('btn-alert-forgot')?.addEventListener('click', () => {
          setState({ authModalMode: 'forgot' }); renderAuthModal();
        });
      } else {
        setAlert('auth-alert-login', 'error', 'Incorrect email or password. Please try again.');
      }
      setLoading('btn-login-submit', false, 'Sign In');
    }
  });

  // ════════════════════════════════════════════════════════════
  // REGISTER
  // ════════════════════════════════════════════════════════════
  document.getElementById('reg-password')?.addEventListener('input', e => {
    const el = document.getElementById('reg-pw-strength');
    if (el) el.innerHTML = strengthBars(e.target.value);
  });

  document.getElementById('form-register')?.addEventListener('submit', async e => {
    e.preventDefault();
    const first = document.getElementById('reg-first')?.value.trim();
    const last  = document.getElementById('reg-last')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const pass  = document.getElementById('reg-password')?.value;
    clearErrs('err-reg-first', 'err-reg-last', 'err-reg-email', 'err-reg-password');
    setAlert('auth-alert-register', null, '');

    let ok = true;
    if (!first)         { fieldErr('err-reg-first', 'First name is required'); ok = false; }
    if (!last)          { fieldErr('err-reg-last', 'Last name is required'); ok = false; }
    if (!email)         { fieldErr('err-reg-email', 'Email is required'); ok = false; }
    if (!pass || pass.length < 6) { fieldErr('err-reg-password', 'Password must be at least 6 characters'); ok = false; }
    if (!ok) return;

    setLoading('btn-register-submit', true, 'Create Account');
    try {
      await ApiService.auth.register(first, last, email, pass);
      const main = document.querySelector('.auth-main');
      if (main) {
        successScreen(main,
          'Account created!',
          'Your Luz Technology account is ready. Sign in to start shopping.',
          'Sign In Now',
          () => { setState({ authModalMode: 'login', _regPrefillEmail: email }); renderAuthModal(); }
        );
      }
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('email') || msg.includes('exist') || msg.includes('already')) {
        fieldErr('err-reg-email', 'An account with this email already exists');
      } else {
        setAlert('auth-alert-register', 'error', err.message || 'Registration failed. Please try again.');
      }
      setLoading('btn-register-submit', false, 'Create Account');
    }
  });

  // ════════════════════════════════════════════════════════════
  // MFA
  // ════════════════════════════════════════════════════════════
  document.getElementById('btn-mfa-back')?.addEventListener('click', () => {
    setState({ authModalMode: 'login', pendingMfaToken: null }); renderAuthModal();
  });

  const otpBoxes = [...document.querySelectorAll('.auth-otp-box')];
  if (otpBoxes.length) {
    const updateMfaBtn = () => {
      const code = otpBoxes.map(b => b.value).join('');
      const btn = document.getElementById('btn-mfa-submit');
      if (btn) btn.disabled = code.length !== 6;
    };

    otpBoxes.forEach((box, i) => {
      box.addEventListener('input', e => {
        const v = e.target.value.replace(/\D/g, '');
        e.target.value = v ? v[0] : '';
        e.target.classList.toggle('is-filled', !!v);
        if (v && i < 5) otpBoxes[i + 1].focus();
        updateMfaBtn();
      });
      box.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          otpBoxes[i - 1].value = '';
          otpBoxes[i - 1].classList.remove('is-filled');
          otpBoxes[i - 1].focus();
          updateMfaBtn();
        }
        if (e.key === 'ArrowLeft'  && i > 0) otpBoxes[i - 1].focus();
        if (e.key === 'ArrowRight' && i < 5) otpBoxes[i + 1].focus();
      });
      box.addEventListener('paste', e => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        [...text.slice(0, 6)].forEach((ch, j) => {
          if (otpBoxes[j]) { otpBoxes[j].value = ch; otpBoxes[j].classList.add('is-filled'); }
        });
        otpBoxes[Math.min(text.length, 5)]?.focus();
        updateMfaBtn();
      });
    });
    otpBoxes[0]?.focus();

    document.getElementById('form-mfa')?.addEventListener('submit', async e => {
      e.preventDefault();
      const code = otpBoxes.map(b => b.value).join('');
      if (code.length !== 6) return;
      setAlert('auth-alert-mfa', null, '');
      otpBoxes.forEach(b => b.classList.remove('is-error'));
      setLoading('btn-mfa-submit', true, 'Verify & Sign In');
      try {
        await ApiService.auth.verifyMfa(appState.pendingMfaToken, code);
        setState({ pendingMfaToken: null, authModalMode: null });
        renderAll();
        showToast('Identity verified. Welcome!', 'success');
      } catch (_) {
        setAlert('auth-alert-mfa', 'error', 'Invalid or expired verification code. Please try again.');
        otpBoxes.forEach(b => { b.value = ''; b.classList.remove('is-filled'); b.classList.add('is-error'); });
        otpBoxes[0]?.focus();
        setLoading('btn-mfa-submit', false, 'Verify & Sign In');
        updateMfaBtn();
      }
    });
  }

  document.getElementById('btn-mfa-resend')?.addEventListener('click', () => {
    showToast('Please sign in again to receive a new code.', 'info');
    setState({ authModalMode: 'login', pendingMfaToken: null }); renderAuthModal();
  });

  // ════════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ════════════════════════════════════════════════════════════
  document.getElementById('btn-forgot-back')?.addEventListener('click', () => {
    setState({ authModalMode: 'login' }); renderAuthModal();
  });

  document.getElementById('form-forgot')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('forgot-email')?.value.trim();
    clearErrs('err-forgot-email');
    if (!email) { fieldErr('err-forgot-email', 'Email is required'); return; }

    setLoading('btn-forgot-submit', true, 'Send Reset Link');
    try { await ApiService.auth.forgotPassword(email); } catch (_) {}
    const main = document.querySelector('.auth-main');
    if (main) {
      successScreen(main,
        'Check your inbox',
        'If an account exists with that email, you\'ll receive a reset link shortly. Don\'t forget to check your spam folder.',
        'Back to Sign In',
        () => { setState({ authModalMode: 'login' }); renderAuthModal(); }
      );
    }
  });

  // ════════════════════════════════════════════════════════════
  // RESET PASSWORD
  // ════════════════════════════════════════════════════════════
  document.getElementById('reset-new')?.addEventListener('input', e => {
    const el = document.getElementById('reset-pw-strength');
    if (el) el.innerHTML = strengthBars(e.target.value);
  });

  document.getElementById('form-reset')?.addEventListener('submit', async e => {
    e.preventDefault();
    const newPw   = document.getElementById('reset-new')?.value;
    const confirm = document.getElementById('reset-confirm')?.value;
    clearErrs('err-reset-new', 'err-reset-confirm');
    setAlert('auth-alert-reset', null, '');

    let ok = true;
    if (!newPw || newPw.length < 6) { fieldErr('err-reset-new', 'Password must be at least 6 characters'); ok = false; }
    if (newPw !== confirm)           { fieldErr('err-reset-confirm', 'Passwords do not match'); ok = false; }
    if (!ok) return;

    if (!appState.pendingResetToken) {
      setAlert('auth-alert-reset', 'error', 'Reset token missing. Please use the link from your email.');
      return;
    }

    setLoading('btn-reset-submit', true, 'Reset Password');
    try {
      await ApiService.auth.resetPassword(appState.pendingResetToken, newPw);
      const main = document.querySelector('.auth-main');
      if (main) {
        successScreen(main,
          'Password reset!',
          'Your password has been updated successfully. You can now sign in with your new password.',
          'Sign In',
          () => { setState({ authModalMode: 'login', pendingResetToken: null }); renderAuthModal(); }
        );
      }
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      let userMsg = 'Password reset failed. Please try again.';
      if (msg.includes('expir')) userMsg = 'This reset link has expired. Please request a new one.';
      else if (msg.includes('used')) userMsg = 'This reset link has already been used.';
      setAlert('auth-alert-reset', 'error', userMsg);
      setLoading('btn-reset-submit', false, 'Reset Password');
    }
  });
}
