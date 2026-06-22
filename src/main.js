import './style.css';
import { setState } from './store.js';
import { init } from './router.js';
import { ApiService } from './api.js';

const params = new URLSearchParams(window.location.search);

// Password reset deep-link: ?view=reset-password&token=xxx
if (params.get('view') === 'reset-password' && params.get('token')) {
  setState({ pendingResetToken: params.get('token'), authModalMode: 'reset' });
} else {
  // Auto-redirect staff to admin dashboard on page load if already signed in
  const user = ApiService.getCurrentUser();
  const roles = (user?.roles || []).map(r => (r?.name || r || '').toString());
  const isStaff = roles.some(r => ['ROLE_ADMIN','ROLE_EMPLOYEE','ROLE_SUPPORT_AGENT'].includes(r));
  if (isStaff) {
    setState({ currentView: 'admin' });
  }
}

init();
