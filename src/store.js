// Global application state — single source of truth
export const appState = {
  currentView: 'home',
  locale: localStorage.getItem('luz_locale') || 'en',
  activeCategory: null,
  selectedProductId: null,
  selectedTicketId: null,
  searchQuery: '',
  activeAdminTab: 'analytics',
  activeFinanceTab: 'overview',
  activeEmployeeTab: 'orders',
  activeSupportAgentTab: 'tickets',
  authModalMode: null, // null | 'login' | 'register' | 'forgot' | 'reset' | 'mfa'
  isUserDropdownOpen: false,
  pendingMfaToken: null,
  pendingResetToken: null,
  appliedCoupon: null,
  isNotifPanelOpen: false,
  isCartDrawerOpen: false
};

export function setState(partial) {
  Object.assign(appState, partial);
}
