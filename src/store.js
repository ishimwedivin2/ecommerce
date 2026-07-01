// Global application state — single source of truth
export const appState = {
  currentView: 'home',
  activeCategory: null,
  selectedProductId: null,
  selectedTicketId: null,
  searchQuery: '',
  activeAdminTab: 'analytics',
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
