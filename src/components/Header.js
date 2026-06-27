import './Header.css';
import { ApiService } from '../api.js';
import { appState, setState } from '../store.js';
import { showToast } from './toast.js';

export async function render() {
  const user = ApiService.getCurrentUser();

  let cartCount = 0;
  try {
    const cartRes = await ApiService.cart.get();
    cartCount = cartRes.data.totalItems || 0;
  } catch (e) {}

  let wishlistCount = 0;
  try {
    const wishRes = await ApiService.wishlist.get();
    wishlistCount = wishRes.data.length || 0;
  } catch (e) {}

  let notifCount = 0;
  if (user) {
    try {
      const notifRes = await ApiService.notifications.getUnreadCount();
      notifCount = notifRes.data || 0;
      // Add low-stock count to badge for staff
      const roles = (user?.roles||[]).map(r=>(r?.name||r||'').toString());
      if (roles.some(r=>r==='ROLE_ADMIN'||r==='ROLE_EMPLOYEE')) {
        const ls = await ApiService.inventory.getLowStock().catch(()=>null);
        const lsItems = ls ? (Array.isArray(ls)?ls:(ls?.data||ls?.content||[])) : [];
        notifCount += lsItems.length;
      }
    } catch (e) {}
  }

  const accountMenuHtml = user ? `
    <div class="header-action-btn" style="position: relative; cursor: pointer;" id="header-user-dropdown-trigger">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
      <span>Account ▾</span>
      <div id="header-user-dropdown" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 1px solid var(--border-dark); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); width: 190px; z-index: 1000; padding: 6px 0; margin-top: 10px;">
        <div style="padding: 10px 16px; border-bottom: 1px solid var(--border); font-size: 13px;">
          Hi, <strong>${user.firstName}</strong>
          <div style="margin-top:5px;">
            ${(user.roles || []).map(r => {
              const name = (r?.name || r || '').toString();
              const map = {
                ROLE_ADMIN:         { label:'Administrator', color:'#7c3aed', bg:'#ede9fe' },
                ROLE_EMPLOYEE:      { label:'Employee',      color:'#0369a1', bg:'#e0f2fe' },
                ROLE_SUPPORT_AGENT: { label:'Support Agent', color:'#0f766e', bg:'#ccfbf1' },
                ROLE_CUSTOMER:      { label:'Customer',      color:'#15803d', bg:'#dcfce7' },
              };
              const chip = map[name] || { label: name.replace('ROLE_',''), color:'#64748b', bg:'#f1f5f9' };
              return `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${chip.bg};color:${chip.color};margin-right:3px;">${chip.label}</span>`;
            }).join('')}
          </div>
        </div>
        <a class="header-action-btn" style="display: flex; width: 100%; text-align: left; border-radius: 0; padding: 10px 16px; gap: 8px; font-size: 13px;" data-navigate="profile">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          My Profile
        </a>
        <a class="header-action-btn" style="display: flex; width: 100%; text-align: left; border-radius: 0; padding: 10px 16px; gap: 8px; font-size: 13px;" data-navigate="support">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          Support Center
        </a>
        ${(() => {
          const roles = user.roles || [];
          if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_EMPLOYEE')) {
            return `<a class="header-action-btn" style="display:flex;width:100%;text-align:left;border-radius:0;padding:10px 16px;gap:8px;color:var(--primary);font-weight:700;font-size:13px;" data-navigate="admin">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path></svg>
              Staff Dashboard
            </a>`;
          }
          if (roles.includes('ROLE_SUPPORT_AGENT')) {
            return `<a class="header-action-btn" style="display:flex;width:100%;text-align:left;border-radius:0;padding:10px 16px;gap:8px;color:#0f766e;font-weight:700;font-size:13px;" data-navigate="support-agent">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Support Portal
            </a>`;
          }
          return '';
        })()}
        <a class="header-action-btn" style="display: flex; width: 100%; text-align: left; border-radius: 0; padding: 10px 16px; gap: 8px; color: var(--danger); font-size: 13px;" id="btn-header-logout">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Logout
        </a>
      </div>
    </div>
  ` : `
    <button class="header-action-btn" id="btn-header-login" style="border: 1px solid var(--border-dark);">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
      Sign In
    </button>
  `;

  return `
    <div class="promo-banner" id="promo-banner">
      🚀 <strong>Summer Sale:</strong> Free shipping on all orders over RWF 50,000 — Use code <strong>LUZ50</strong> at checkout
      <button class="promo-banner-close" onclick="document.getElementById('promo-banner').style.display='none'">×</button>
    </div>
    <div class="header-main">
      <div class="logo-container" data-navigate="home">
        <img src="/logo.jpg" alt="Luz Technology" class="logo-img">
        Luz Technology<span>.</span>
      </div>

      <nav class="header-nav">
        <a class="header-nav-link" data-navigate="home">Home</a>
        <a class="header-nav-link" data-navigate="shop">Shop</a>
      </nav>

      <div class="search-bar-container">
        <input type="text" class="search-input" id="global-search-input" placeholder="Search a product, brand, category...">
        <button class="search-btn" id="global-search-btn">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
      </div>

      <div class="header-actions">
        ${accountMenuHtml}

        <button class="header-action-btn badge-btn" data-navigate="wishlist" title="Wishlist">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          ${wishlistCount > 0 ? `<div class="badge" id="wishlist-badge">${wishlistCount}</div>` : ''}
        </button>

        ${user ? `
        <div style="position:relative;" id="notif-bell-wrapper">
          <button class="header-action-btn badge-btn" id="btn-notifications" title="Notifications">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            ${notifCount > 0 ? `<div class="badge" id="notif-badge">${notifCount}</div>` : '<div class="badge" id="notif-badge" style="display:none">0</div>'}
          </button>
          <div id="notifications-panel" class="notifications-panel" style="display:none;">
            <div class="notif-panel-header">
              <span style="font-weight:700;font-size:14px;">Notifications</span>
              <button id="btn-mark-all-read" style="font-size:12px;font-weight:600;color:var(--primary);background:none;border:none;cursor:pointer;">Mark all read</button>
            </div>
            <div id="notif-list"><div style="padding:24px;text-align:center;color:var(--text-light);font-size:13px;">Loading...</div></div>
          </div>
        </div>
        ` : ''}

        <button class="header-action-btn badge-btn" data-navigate="cart" title="Shopping Cart">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          ${cartCount > 0 ? `<div class="badge" id="cart-badge">${cartCount}</div>` : ''}
        </button>
      </div>
    </div>
  `;
}

export function bindEvents(helpers) {
  const { navigate, renderAuthModal, renderHeader, renderView } = helpers;

  // Navigation links
  document.querySelectorAll('[data-navigate]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.stopPropagation();
      const dest = elem.getAttribute('data-navigate');
      navigate(dest, dest === 'home' ? { activeCategory: null, searchQuery: '' } : {});
    });
  });

  // User dropdown — hover open/close
  const dropdownTrigger = document.getElementById('header-user-dropdown-trigger');
  const dropdownMenu    = document.getElementById('header-user-dropdown');
  if (dropdownTrigger && dropdownMenu) {
    let accountCloseTimer = null;

    const openAccount = () => {
      clearTimeout(accountCloseTimer);
      dropdownMenu.classList.add('open');
      setState({ isUserDropdownOpen: true });
    };
    const closeAccount = () => {
      accountCloseTimer = setTimeout(() => {
        dropdownMenu.classList.remove('open');
        setState({ isUserDropdownOpen: false });
      }, 150);
    };

    dropdownTrigger.addEventListener('mouseenter', openAccount);
    dropdownTrigger.addEventListener('mouseleave', closeAccount);
    dropdownMenu.addEventListener('mouseenter', () => clearTimeout(accountCloseTimer));
    dropdownMenu.addEventListener('mouseleave', closeAccount);
    // keep click as fallback for keyboard/touch users
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.contains('open') ? closeAccount() : openAccount();
    });
  }

  document.addEventListener('click', (e) => {
    const trigger = document.getElementById('header-user-dropdown-trigger');
    const menu    = document.getElementById('header-user-dropdown');
    if (menu && !trigger?.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      setState({ isUserDropdownOpen: false });
    }
  });

  // Login button
  document.getElementById('btn-header-login')?.addEventListener('click', () => {
    setState({ authModalMode: 'login' });
    renderAuthModal();
  });

  // Logout
  document.getElementById('btn-header-logout')?.addEventListener('click', () => {
    window.dispatchEvent(new Event('luz-logout'));
    ApiService.auth.logout();
    showToast('Logged out successfully');
    navigate('home', { activeCategory: null, isUserDropdownOpen: false });
  });

  // Notification bell — hover open/close
  const notifBtn     = document.getElementById('btn-notifications');
  const notifWrapper = document.getElementById('notif-bell-wrapper');
  const notifPanel   = document.getElementById('notifications-panel');
  if (notifBtn && notifPanel && notifWrapper) {
    let notifCloseTimer  = null;
    let notifLoaded      = false;

    const openNotif = async () => {
      clearTimeout(notifCloseTimer);
      if (notifPanel.classList.contains('open')) return;
      notifPanel.classList.add('open');
      setState({ isNotifPanelOpen: true });

      if (notifLoaded) return;
      notifLoaded = true;
        const user = ApiService.getCurrentUser();
        const roles = (user?.roles||[]).map(r=>(r?.name||r||'').toString());
        const isStaff = roles.some(r=>r==='ROLE_ADMIN'||r==='ROLE_EMPLOYEE');

        // Load regular notifications + low-stock alerts for staff
        const [notifRes, lowStockRes] = await Promise.allSettled([
          ApiService.notifications.getAll(),
          isStaff ? ApiService.inventory.getLowStock() : Promise.resolve(null),
        ]);

        const items     = notifRes.status==='fulfilled' ? (notifRes.value?.data || []) : [];
        const lowStock  = (lowStockRes.status==='fulfilled' && lowStockRes.value)
          ? (Array.isArray(lowStockRes.value) ? lowStockRes.value : (lowStockRes.value?.data||lowStockRes.value?.content||[]))
          : [];

        // Update badge to include low-stock count for staff
        const badge = document.getElementById('notif-badge');
        const totalAlerts = items.filter(n=>!n.read).length + lowStock.length;
        if (badge) {
          badge.textContent = totalAlerts;
          badge.style.display = totalAlerts > 0 ? 'flex' : 'none';
        }

        const listEl = document.getElementById('notif-list');
        if (listEl) {
          const lowStockHtml = lowStock.length ? `
            <div style="padding:10px 14px 4px;font-size:11px;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:.05em;border-top:1px solid var(--border);">
              ⚠ Low Stock Alerts (${lowStock.length})
            </div>
            ${lowStock.map(i=>`
              <div class="notif-item unread" style="border-left:3px solid #F59E0B;padding-left:11px;">
                <div class="notif-item-title">${i.productName||i.name||'—'}</div>
                <div class="notif-item-msg">Only ${i.quantity} units left — reorder threshold: ${i.lowStockThreshold||10}</div>
                <div class="notif-item-time">SKU: ${i.sku||'—'}</div>
              </div>`).join('')}` : '';

          listEl.innerHTML = items.length === 0 && !lowStockHtml
            ? `<div style="padding:24px;text-align:center;color:var(--text-light);font-size:13px;">You're all caught up!</div>`
            : (items.length > 0 ? items.map(n => `
              <div class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                <div class="notif-item-title">${n.title}</div>
                <div class="notif-item-msg">${n.message}</div>
                <div class="notif-item-time">${n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</div>
              </div>
            `).join('') : '') + lowStockHtml;

          listEl.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', async () => {
              const nid = item.getAttribute('data-notif-id');
              await ApiService.notifications.markRead(nid);
              item.classList.remove('unread');
              const badge = document.getElementById('notif-badge');
              const cur = parseInt(badge?.textContent || '0') - 1;
              if (badge) { badge.textContent = Math.max(0, cur); badge.style.display = cur <= 0 ? 'none' : 'flex'; }
            });
          });
        }
    };

    const closeNotif = () => {
      notifCloseTimer = setTimeout(() => {
        notifPanel.classList.remove('open');
        setState({ isNotifPanelOpen: false });
      }, 150);
    };

    notifWrapper.addEventListener('mouseenter', openNotif);
    notifWrapper.addEventListener('mouseleave', closeNotif);
    notifPanel.addEventListener('mouseenter', () => clearTimeout(notifCloseTimer));
    notifPanel.addEventListener('mouseleave', closeNotif);
    // click as fallback for touch/keyboard
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifPanel.classList.contains('open') ? closeNotif() : openNotif();
    });

    document.getElementById('btn-mark-all-read')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await ApiService.notifications.markAllRead();
      const badge = document.getElementById('notif-badge');
      if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
      document.querySelectorAll('.notif-item').forEach(i => i.classList.remove('unread'));
      showToast('All notifications marked as read');
    });

    document.addEventListener('click', (e) => {
      if (!notifWrapper.contains(e.target)) {
        notifPanel.classList.remove('open');
        setState({ isNotifPanelOpen: false });
      }
    });
  }

  // Search
  const searchInput = document.getElementById('global-search-input');
  const searchBtn = document.getElementById('global-search-btn');
  const doSearch = () => {
    const query = searchInput?.value.trim();
    if (!query) return;
    setState({ searchQuery: query });
    navigate('shop');
    if (searchInput) searchInput.value = '';
  };

  if (searchInput) {
    searchInput.value = '';
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }
  searchBtn?.addEventListener('click', doSearch);
}
