/**
 * SessionGuard — proactive JWT expiry warning.
 * Decodes the JWT exp claim, starts a countdown, shows a warning toast
 * 5 minutes before expiry with "Extend Session" / "Logout" actions.
 */

import { ApiService } from '../api.js';
import { showToast } from './toast.js';

let _warningTimer  = null;
let _expireTimer   = null;
let _bannerEl      = null;
let _countdownInt  = null;

const WARN_BEFORE_MS = 5 * 60 * 1000; // show warning 5 min before expiry
const BANNER_ID      = 'session-timeout-banner';

function getJwtExpiry() {
  const jwt = localStorage.getItem('luz_jwt');
  if (!jwt) return null;
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch { return null; }
}

function removeBanner() {
  clearInterval(_countdownInt);
  _bannerEl = document.getElementById(BANNER_ID);
  if (_bannerEl) _bannerEl.remove();
  _bannerEl = null;
}

function showWarningBanner(msLeft) {
  removeBanner();

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.style.cssText = `
    position:fixed;bottom:80px;right:20px;z-index:99999;
    background:#1e293b;color:white;border-radius:12px;
    padding:16px 20px;box-shadow:0 8px 32px rgba(0,0,0,.35);
    display:flex;flex-direction:column;gap:10px;
    min-width:280px;max-width:320px;
    border-left:4px solid #f59e0b;
    animation:slideInRight .3s ease;
  `;

  let remaining = Math.floor(msLeft / 1000);

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2,'0')}s` : `${sec}s`;
  }

  banner.innerHTML = `
    <style>
      @keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
    </style>
    <div style="display:flex;align-items:center;gap:8px;">
      <svg width="18" height="18" fill="none" stroke="#f59e0b" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      <span style="font-weight:700;font-size:13px;">Session expiring soon</span>
    </div>
    <div style="font-size:12px;color:#94a3b8;">
      Your session expires in <strong id="sg-countdown" style="color:#f59e0b;">${fmtTime(remaining)}</strong>
    </div>
    <div style="display:flex;gap:8px;">
      <button id="sg-extend" style="flex:1;padding:7px 10px;border-radius:7px;border:none;background:#FF6B00;color:white;font-size:12px;font-weight:600;cursor:pointer;">
        Extend Session
      </button>
      <button id="sg-logout" style="flex:1;padding:7px 10px;border-radius:7px;border:1px solid #475569;background:transparent;color:#94a3b8;font-size:12px;cursor:pointer;">
        Logout
      </button>
    </div>
  `;

  document.body.appendChild(banner);
  _bannerEl = banner;

  _countdownInt = setInterval(() => {
    remaining--;
    const el = document.getElementById('sg-countdown');
    if (el) el.textContent = fmtTime(Math.max(0, remaining));
    if (remaining <= 0) {
      clearInterval(_countdownInt);
      removeBanner();
      handleExpired();
    }
  }, 1000);

  document.getElementById('sg-extend')?.addEventListener('click', async () => {
    try {
      const refreshToken = localStorage.getItem('luz_refresh_token');
      if (!refreshToken) throw new Error('No refresh token');
      const res = await fetch('http://localhost:8080/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      }).then(r => r.json());
      if (res.data?.token) {
        localStorage.setItem('luz_jwt', res.data.token);
        if (res.data.refreshToken) localStorage.setItem('luz_refresh_token', res.data.refreshToken);
        removeBanner();
        showToast('Session extended successfully', 'success');
        start(); // restart the guard with new token
      } else {
        throw new Error('Refresh failed');
      }
    } catch {
      showToast('Could not extend session. Please log in again.', 'error');
      handleExpired();
    }
  });

  document.getElementById('sg-logout')?.addEventListener('click', () => {
    removeBanner();
    ApiService.auth?.logout?.();
    localStorage.removeItem('luz_jwt');
    localStorage.removeItem('luz_refresh_token');
    localStorage.removeItem('luz_user');
    window.location.reload();
  });
}

function handleExpired() {
  removeBanner();
  ApiService.auth?.logout?.();
  localStorage.removeItem('luz_jwt');
  localStorage.removeItem('luz_refresh_token');
  localStorage.removeItem('luz_user');
  showToast('Your session has expired. Please log in again.', 'error');
  setTimeout(() => window.location.reload(), 1500);
}

export function start() {
  stop(); // clear any previous timers

  const expiry = getJwtExpiry();
  if (!expiry) return; // not logged in

  const now      = Date.now();
  const msLeft   = expiry - now;

  if (msLeft <= 0) {
    handleExpired();
    return;
  }

  const warnIn = msLeft - WARN_BEFORE_MS;

  if (warnIn <= 0) {
    // Already in warning window — show banner immediately
    showWarningBanner(Math.max(0, msLeft));
  } else {
    _warningTimer = setTimeout(() => {
      showWarningBanner(WARN_BEFORE_MS);
    }, warnIn);
  }

  // Hard expire timer
  _expireTimer = setTimeout(() => {
    handleExpired();
  }, msLeft);
}

export function stop() {
  clearTimeout(_warningTimer);
  clearTimeout(_expireTimer);
  clearInterval(_countdownInt);
  removeBanner();
  _warningTimer = null;
  _expireTimer  = null;
}
