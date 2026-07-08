import './Header.css';
import { ApiService } from '../api.js';
import { appState, setState } from '../store.js';
import { showToast } from './toast.js';
import { getLocale, setLocale, SUPPORTED_LOCALES, t } from '../i18n/index.js';

export async function render() {
  const user = ApiService.getCurrentUser();

  let cartCount = 0;
  let wishlistCount = 0;
  let notifCount = 0;

  if (user) {
    try {
      const roles = (user?.roles||[]).map(r=>(r?.name||r||'').toString());
      const isStaff = roles.some(r=>r==='ROLE_ADMIN'||r==='ROLE_EMPLOYEE');
      const [cartRes, wishRes, notifRes, lowStockRes] = await Promise.allSettled([
        ApiService.cart.get(),
        ApiService.wishlist.get(),
        ApiService.notifications.getUnreadCount(),
        isStaff ? ApiService.inventory.getLowStock() : Promise.resolve(null),
      ]);

      if (cartRes.status === 'fulfilled') {
        cartCount = cartRes.value?.data?.totalItems || 0;
      }
      if (wishRes.status === 'fulfilled') {
        wishlistCount = wishRes.value?.data?.length || 0;
      }
      if (notifRes.status === 'fulfilled') {
        notifCount = notifRes.value?.data || 0;
      }
      if (lowStockRes.status === 'fulfilled' && lowStockRes.value) {
        const ls = lowStockRes.value;
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
                ROLE_ADMIN:         { label:t('Administrator'), color:'#7c3aed', bg:'#ede9fe' },
                ROLE_EMPLOYEE:      { label:t('Employee'),      color:'#0369a1', bg:'#e0f2fe' },
                ROLE_SUPPORT_AGENT: { label:t('Support Agent'), color:'#0f766e', bg:'#ccfbf1' },
                ROLE_CUSTOMER:      { label:t('Customer'),      color:'#15803d', bg:'#dcfce7' },
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
      <!-- LEFT: contact + socials -->
      <div class="promo-left">
        <span class="promo-reach">Reach us through</span>
        <a class="promo-contact" href="tel:0788955906">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          📞 0788 955 906
        </a>
        <span class="promo-divider">|</span>
        <a class="promo-social" href="https://wa.me/250788955906" target="_blank" rel="noopener" title="WhatsApp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a class="promo-social" href="https://instagram.com/luztechnology" target="_blank" rel="noopener" title="Instagram">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          Instagram
        </a>
      </div>

      <!-- RIGHT: deal pill + close -->
      <div class="promo-right">
        <span class="promo-pill">🏷️ Summer Deal</span>
        <span class="promo-deal-text">Use code <strong class="promo-code">LUZ50</strong> — Free delivery across Rwanda 🚚</span>
        <button class="promo-banner-close" onclick="document.getElementById('promo-banner').style.display='none'">×</button>
      </div>
    </div>
    <div class="header-main">
      <div class="logo-container" data-navigate="home">
        <img src="/logo.jpg" alt="Luz Technology" class="logo-img">
        Luz Technology
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
        <label class="header-lang" style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-light);" title="${t('language')}">
          <select id="locale-select" aria-label="${t('language')}" style="height:32px;border:1px solid var(--border-dark);border-radius:8px;background:white;font-weight:700;font-size:12px;padding:0 6px;cursor:pointer;">
            ${SUPPORTED_LOCALES.map(l => `<option value="${l.code}" ${getLocale() === l.code ? 'selected' : ''}>${l.label}</option>`).join('')}
          </select>
        </label>

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
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2.2l2.1 10.1a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H7.4"></path><path stroke-linecap="round" d="M9.5 10h9"></path><path stroke-linecap="round" d="M10.2 12.8h7.8"></path><circle cx="9" cy="20" r="1.6"></circle><circle cx="17" cy="20" r="1.6"></circle></svg>
          ${cartCount > 0 ? `<div class="badge" id="cart-badge">${cartCount}</div>` : ''}
        </button>
      </div>
    </div>
  `;
}

export function bindEvents(helpers) {
  const { navigate, renderAuthModal, renderHeader, renderView, openCartDrawer, syncUrl } = helpers;

  document.getElementById('locale-select')?.addEventListener('change', (e) => {
    setLocale(e.target.value);
  });

  // Navigation links
  document.querySelectorAll('[data-navigate]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.stopPropagation();
      const dest = elem.getAttribute('data-navigate');
      if (dest === 'cart') {
        openCartDrawer?.();
        return;
      }
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
    syncUrl?.({ authModalMode: 'login' });
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
