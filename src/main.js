import './style.css';
import { setState } from './store.js';
import { ApiService } from './api.js';
import { init, renderAuthModal } from './router.js';

const params = new URLSearchParams(window.location.search);

// Password reset deep-link: ?view=reset-password&token=xxx
if (params.get('view') === 'reset-password' && params.get('token')) {
  setState({ pendingResetToken: params.get('token'), authModalMode: 'reset' });
}

// OAuth2 callback: backend redirects to /?oauth_token=JWT&oauth_refresh=REFRESH&...
if (params.get('oauth_token')) {
  const oauthToken   = params.get('oauth_token');
  const oauthRefresh = params.get('oauth_refresh') || '';
  const userId       = params.get('user_id')  || '';
  const email        = params.get('email')    || '';
  const firstName    = params.get('first_name') || '';
  const lastName     = params.get('last_name')  || '';
  const roles        = (params.get('roles') || 'ROLE_CUSTOMER').split(',');

  ApiService.setSession({ token: oauthToken, refreshToken: oauthRefresh,
    user: { id: userId, email, firstName, lastName, roles } });

  // Clean URL
  window.history.replaceState({}, '', window.location.pathname);
}

init();
