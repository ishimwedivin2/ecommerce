import './style.css';
import { setState } from './store.js';
import { init } from './router.js';
import { ApiService } from './api.js';

const params = new URLSearchParams(window.location.search);

// Password reset deep-link: ?view=reset-password&token=xxx
if (params.get('view') === 'reset-password' && params.get('token')) {
  setState({ pendingResetToken: params.get('token'), authModalMode: 'reset' });
} else {
  // Auto-redirect staff to their specific dashboard on page load
  const user = ApiService.getCurrentUser();
  const roles = (user?.roles || []).map(r => (r?.name || r || '').toString());
  if (roles.includes('ROLE_ADMIN')) setState({ currentView: 'admin' });
  else if (roles.includes('ROLE_EMPLOYEE')) setState({ currentView: 'employee' });
  else if (roles.includes('ROLE_SUPPORT_AGENT')) setState({ currentView: 'support-agent' });
}

init();
