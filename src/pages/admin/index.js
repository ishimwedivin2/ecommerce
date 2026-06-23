import './style.css';
import { ApiService } from '../../api.js';
import { appState } from '../../store.js';
import { connectWS, subscribeWS, unsubscribeWS } from '../../chat-ws.js';

// ── Icons ─────────────────────────────────────────────────
const I = {
  grid: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  box: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  cart: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
  users: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  dollar: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  tag: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  truck: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
  rotate: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.35"/></svg>`,
  msg: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  img: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  percent: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  bar: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  shield: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  log: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  settings: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  pos: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  pkg: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  bell: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  x: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  plus: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  eye: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  search: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  download: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  menu: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  chevL: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>`,
  chevR: `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>`,
  check: `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  refresh: `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  store: `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
};

// ── Response helpers ──────────────────────────────────────
// All backend responses are wrapped in ApiResponse { success, message, data, timestamp }.
// `data` is either a plain array (List) or a Spring Page object { content, totalElements }.
function extractList(res) {
  const d = res?.data ?? res;
  return Array.isArray(d) ? d : (d?.content || []);
}
function extractTotal(res, arr) {
  const d = res?.data ?? res;
  return d?.totalElements ?? arr.length ?? 0;
}

// ── Role helpers ──────────────────────────────────────────
function getUser() { return ApiService.getCurrentUser() || {}; }
function isAdmin() { const u = getUser(); return (u.roles||[]).some(r => r==='ROLE_ADMIN'); }
function isEmployee() { const u = getUser(); return (u.roles||[]).some(r => r==='ROLE_EMPLOYEE'||r==='ROLE_ADMIN'); }

// ── Sidebar nav config ────────────────────────────────────
function navItems() {
  const admin = isAdmin();
  const all = [
    { section: 'Overview' },
    { id:'analytics', label:'Dashboard', icon:I.grid },
    { section: 'Commerce' },
    { id:'orders',   label:'Orders',    icon:I.cart,    badge:'orders' },
    { id:'products', label:'Products',  icon:I.box },
    { id:'inventory',label:'Inventory', icon:I.pkg },
    { id:'returns',  label:'Returns',   icon:I.rotate,  badge:'returns' },
    { id:'shipments',label:'Shipments', icon:I.truck },
    { section: 'Sales' },
    { id:'pos',      label:'Point of Sale', icon:I.pos },
    { id:'coupons',  label:'Coupons',   icon:I.percent },
    { id:'banners',  label:'Banners',   icon:I.img },
    { section: 'People' },
    { id:'crm',      label:'Customers', icon:I.users },
    { id:'support',  label:'Support',   icon:I.msg,     badge:'tickets' },
    ...(admin ? [
      { section: 'Finance' },
      { id:'finance',  label:'Finance',   icon:I.dollar },
      { id:'reports',  label:'Reports',   icon:I.bar },
      { section: 'Administration' },
      { id:'users',    label:'Users',     icon:I.users },
      { id:'security', label:'Security',  icon:I.shield },
      { id:'audit',    label:'Audit Log', icon:I.log },
      { id:'system',   label:'System',    icon:I.settings },
    ] : [
      { section: 'Reports' },
      { id:'reports',  label:'Reports',   icon:I.bar },
    ]),
  ];
  return all;
}

// ── State ─────────────────────────────────────────────────
let activeTab = 'analytics';
let sidebarCollapsed = false;
let badges = { orders: 0, returns: 0, tickets: 0 };
let drawerOpen = false;
let _couponCache    = [];
let _bannerCache    = [];
let _userCache      = [];
let _invCache       = [];
let _customerCache  = [];
let _auditCache     = [];
let _productCache   = [];
let _categoryCache  = [];

// ── Main render ───────────────────────────────────────────
export async function render(state) {
  const u = getUser();
  const initials = `${(u.firstName||'A')[0]}${(u.lastName||'D')[0]}`.toUpperCase();
  const roleLabel = isAdmin() ? 'Admin' : 'Employee';
  const roleCls   = isAdmin() ? 'admin' : 'employee';

  const items = navItems();
  let sidebarHtml = '';
  for (const item of items) {
    if (item.section) {
      sidebarHtml += `<div class="dash-sidebar-section"><div class="dash-sidebar-label">${item.section}</div>`;
    } else {
      const active = item.id === activeTab ? 'active' : '';
      const bdgVal = item.badge ? badges[item.badge] : 0;
      const bdgHtml = bdgVal > 0 ? `<span class="dash-nav-badge">${bdgVal}</span>` : '';
      sidebarHtml += `
        <button class="dash-nav-item ${active}" data-tab="${item.id}">
          <span class="dash-nav-icon">${item.icon}</span>
          <span class="dash-nav-label">${item.label}</span>
          ${bdgHtml}
        </button>`;
    }
  }
  // close last section div — quick fix: wrap all sections
  sidebarHtml = sidebarHtml.replace(/<div class="dash-sidebar-section"><div class="dash-sidebar-label">/g,
    '</div><div class="dash-sidebar-section"><div class="dash-sidebar-label">');
  sidebarHtml = sidebarHtml.replace(/^<\/div>/, '');
  sidebarHtml += '</div>';

  // Return HTML string — router sets container.innerHTML
  return `
<div class="dash-root" id="dash-root">
  <!-- Sidebar -->
  <nav class="dash-sidebar ${sidebarCollapsed?'collapsed':''}" id="dash-sidebar">
    <div class="dash-sidebar-header">
      <div class="dash-sidebar-logo">L</div>
      <div class="dash-sidebar-brand">Luz Technology<span>Admin Console</span></div>
      <button class="dash-collapse-btn" id="sidebar-toggle">${I.chevL}</button>
    </div>
    ${sidebarHtml}
  </nav>

  <!-- Main -->
  <div class="dash-content">
    <!-- Top bar -->
    <header class="dash-topbar">
      <span class="dash-topbar-title" id="topbar-title">Dashboard</span>
      <div class="dash-topbar-search">
        <span class="dash-search-ico">${I.search}</span>
        <input class="dash-search-inp" placeholder="Search anything…" id="dash-search" autocomplete="off">
      </div>
      <div class="dash-topbar-right">
        <button class="dash-icon-btn" title="Notifications" id="btn-notif">
          ${I.bell}<span class="dash-notif-dot" id="notif-dot" style="display:none"></span>
        </button>
        <button class="dash-icon-btn" title="Refresh" id="btn-refresh">${I.refresh}</button>
        <div class="dash-user-chip" id="user-chip">
          <div class="dash-user-av">${initials}</div>
          <span class="dash-user-name">${u.firstName||'Admin'}</span>
          <span class="dash-role-pill ${roleCls}">${roleLabel}</span>
        </div>
        <button class="btn-qc" id="btn-quick-create">${I.plus} Quick Add</button>
      </div>
    </header>

    <!-- Page content -->
    <main class="dash-page dash-fade" id="dash-page">
      <div class="d-empty"><div class="d-empty-ico">⏳</div><div class="d-empty-ttl">Loading…</div></div>
    </main>
  </div>

  <!-- Drawer overlay -->
  <div class="d-overlay" id="d-overlay"></div>
  <div class="d-drawer" id="d-drawer">
    <div class="d-hd">
      <span class="d-title" id="d-drawer-title">Details</span>
      <button class="d-close" id="d-close">${I.x}</button>
    </div>
    <div class="d-body" id="d-drawer-body"></div>
    <div class="d-footer" id="d-drawer-footer"></div>
  </div>
</div>`;
}

// ── bindEvents — called by router after innerHTML is set ──
export async function bindEvents(state, helpers) {
  // Measure actual header height so .dash-root sits exactly below it
  const headerEl = document.getElementById('app-header-container');
  if (headerEl) {
    const h = headerEl.getBoundingClientRect().height;
    if (h > 0) document.documentElement.style.setProperty('--admin-header-h', h + 'px');
  }
  bindShell();
  await loadTab(activeTab);
  loadBadges();
}

// ── Shell bindings ────────────────────────────────────────
function bindShell() {
  document.getElementById('sidebar-toggle').onclick = () => {
    sidebarCollapsed = !sidebarCollapsed;
    document.getElementById('dash-sidebar').classList.toggle('collapsed', sidebarCollapsed);
    document.getElementById('sidebar-toggle').innerHTML = sidebarCollapsed ? I.chevR : I.chevL;
  };

  document.getElementById('dash-sidebar').addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    const tab = btn.dataset.tab;
    if (tab === activeTab) return;
    activeTab = tab;
    document.querySelectorAll('.dash-nav-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.getElementById('topbar-title').textContent = btn.querySelector('.dash-nav-label').textContent;
    loadTab(tab);
  });

  document.getElementById('d-overlay').onclick = closeDrawer;
  document.getElementById('d-close').onclick = closeDrawer;

  document.getElementById('btn-refresh').onclick = () => loadTab(activeTab);

  document.getElementById('btn-quick-create').onclick = () => {
    const map = { products:'product', orders:'order', coupons:'coupon', banners:'banner' };
    if (map[activeTab]) openDrawer(map[activeTab], null);
    else openDrawer('product', null);
  };
}

// ── Drawer helpers ────────────────────────────────────────
function openDrawer(type, data) {
  const titles = { product:'Product', order:'Order Detail', coupon:'Coupon', banner:'Banner', user:'User', customer:'Customer', adjust:'Adjust Stock', ticket:'Support Ticket', shipment:'Shipment', 'shipment-status':'Shipment Status', 'return-action':'Return Review' };
  document.getElementById('d-drawer-title').textContent = (data?'Edit ':'New ') + (titles[type]||type);
  document.getElementById('d-drawer-body').innerHTML = drawerBody(type, data);
  document.getElementById('d-drawer-footer').innerHTML = drawerFooter(type, data);
  document.getElementById('d-overlay').classList.add('open');
  document.getElementById('d-drawer').classList.add('open');
  drawerOpen = true;
  bindDrawerEvents(type, data);
  if (type === 'product') {
    const selectedCatId = data?.categoryId || data?.category?.id || null;
    loadCategories(selectedCatId);
  }
}
function closeDrawer() {
  document.getElementById('d-overlay').classList.remove('open');
  document.getElementById('d-drawer').classList.remove('open');
  drawerOpen = false;
}

// ── Tab loader ─────────────────────────────────────────────
async function loadTab(tab) {
  const page = document.getElementById('dash-page');
  page.innerHTML = skelPage();
  try {
    const html = await TAB[tab]?.();
    page.innerHTML = `<div class="dash-fade">${html||''}</div>`;
    bindTab(tab);
  } catch(e) {
    page.innerHTML = `<div class="d-alert d-alert-err">Failed to load ${tab}: ${e.message}</div>`;
  }
}

function skelPage() {
  return `<div style="display:flex;flex-direction:column;gap:14px;padding:4px 0">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${'<div class="skel" style="height:90px;border-radius:11px"></div>'.repeat(4)}</div>
    <div class="skel" style="height:180px;border-radius:11px"></div>
    <div class="skel" style="height:260px;border-radius:11px"></div>
  </div>`;
}

// ── Badge loader ───────────────────────────────────────────
async function loadBadges() {
  try {
    const [orders, returns, tickets] = await Promise.allSettled([
      ApiService.getOrders({ status:'PENDING', size:1 }),
      ApiService.getReturns({ status:'PENDING', size:1 }),
      ApiService.getSupportTickets({ status:'OPEN', size:1 }),
    ]);
    badges.orders  = extractList(orders.value).filter(o => o.status === 'PENDING').length;
    badges.returns = extractList(returns.value).filter(r => r.status === 'PENDING').length;
    badges.tickets = extractList(tickets.value).filter(t => t.status === 'OPEN').length;
    document.querySelectorAll('.dash-nav-item[data-tab="orders"] .dash-nav-badge').forEach(el => { if(badges.orders) el.textContent = badges.orders; });
    if (badges.orders || badges.returns || badges.tickets) {
      const dot = document.getElementById('notif-dot');
      if (dot) dot.style.display = '';
    }
  } catch(_) {}
}

// ── Formatters ────────────────────────────────────────────
const fmt = {
  money: v => 'RWF ' + Math.round(Number(v||0)).toLocaleString('en-US'),
  num:   v => Number(v||0).toLocaleString(),
  date:  v => v ? new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—',
  ago:   v => { if(!v) return '—'; const s=(Date.now()-new Date(v))/1000; if(s<60) return 'just now'; if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; },
};

function escAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

function statusBdg(status) {
  const map = {
    ACTIVE:'green',APPROVED:'green',PAID:'green',DELIVERED:'green',FULFILLED:'green',RESOLVED:'green',CLOSED:'green',COMPLETED:'green',
    PENDING:'yellow',PROCESSING:'yellow',OPEN:'yellow',IN_TRANSIT:'yellow',IN_PROGRESS:'yellow',UNDER_REVIEW:'yellow',
    CANCELLED:'red',REJECTED:'red',FAILED:'red',OUT_OF_STOCK:'red',BLOCKED:'red',
    REFUNDED:'purple',RETURN_REQUESTED:'purple',
    INACTIVE:'gray',DRAFT:'gray',
  };
  const cls = map[status] || 'gray';
  return `<span class="bdg bdg-${cls}">${(status||'').replace(/_/g,' ')}</span>`;
}

// ══════════════════════════════════════════════════════════
// TAB RENDERERS
// ══════════════════════════════════════════════════════════
const TAB = {};

// ── Analytics ────────────────────────────────────────────
let _analyticsRange = { preset: '30d' };

async function loadAnalyticsData(startDate, endDate) {
  const sd = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const ed = endDate   || new Date().toISOString().slice(0, 10);
  let stats = {};
  let revenueByMonth = [];
  let ordersByStatus = [];
  let topProducts = [];
  let customerCount = 0;
  let invAnalytics = {};
  try {
    const [ds, rm, obs, tp, ca, inv] = await Promise.allSettled([
      ApiService.getAdminStats(),
      ApiService.getRevenueByMonth({ startDate: sd, endDate: ed }),
      ApiService.getOrdersByStatus({ startDate: sd, endDate: ed }),
      ApiService.getTopProducts({ startDate: sd, endDate: ed }),
      ApiService.analytics.getCustomers(),
      ApiService.analytics.getInventory(),
    ]);
    if (ds.status === 'fulfilled' && ds.value) stats = ds.value.data || ds.value;
    if (rm.status === 'fulfilled' && rm.value) {
      const raw = rm.value.data || rm.value;
      if (Array.isArray(raw)) revenueByMonth = raw.map(d => ({ month: (d.month||'').slice(5), revenue: Number(d.revenue)||0 }));
    }
    if (obs.status === 'fulfilled' && obs.value) {
      const raw = obs.value.data || obs.value;
      if (raw && typeof raw === 'object') ordersByStatus = Object.entries(raw).map(([label, value]) => ({ label, value: Number(value)||0 }));
    }
    if (tp.status === 'fulfilled' && tp.value) {
      const raw = tp.value.data || tp.value;
      if (Array.isArray(raw)) topProducts = raw;
    }
    if (ca.status === 'fulfilled' && ca.value) {
      const raw = ca.value.data || ca.value;
      customerCount = raw?.totalCustomers || 0;
    }
    if (inv.status === 'fulfilled' && inv.value) {
      invAnalytics = inv.value.data || inv.value;
    }
  } catch(_){}

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const barData = revenueByMonth.length ? revenueByMonth : months.slice(0,7).map(m => ({ month: m, revenue: 0 }));
  const maxRev = Math.max(...barData.map(d => d.revenue||0), 1);

  const donutColors = ['#FF6B00','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EF4444'];
  const catData = ordersByStatus.length ? ordersByStatus : [
    {label:'DELIVERED',value:0},{label:'PROCESSING',value:0},{label:'PENDING',value:0},{label:'CANCELLED',value:0}
  ];
  const totalCat = catData.reduce((a,b)=>a+(b.value||0),0)||1;
  let donutPaths = ''; let legendHtml = ''; let off = 0;
  const r = 50, cx = 60, cy = 60, circ = 2*Math.PI*r;
  catData.forEach((d,i) => {
    const pct = (d.value||0)/totalCat;
    const len = pct * circ;
    donutPaths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${donutColors[i%6]}" stroke-width="20" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-off+circ/4}" transform="rotate(-90,${cx},${cy})"/>`;
    legendHtml += `<div class="dash-legend-item"><div class="dash-legend-dot" style="background:${donutColors[i%6]}"></div>${d.label.replace(/_/g,' ')} <b style="margin-left:auto;font-weight:700">${d.value||0}</b></div>`;
    off += len;
  });

  const barsHtml = barData.map(d => {
    const pct = Math.round(((d.revenue||0)/maxRev)*100);
    return `<div class="dash-bar-col"><div class="dash-bar" style="height:${Math.max(pct,3)}%" title="${fmt.money(d.revenue)}"></div><div class="dash-bar-lbl">${d.month||''}</div></div>`;
  }).join('');

  const topProdsHtml = topProducts.length
    ? topProducts.map(p => `
        <div class="d-widget-row">
          <span>${p.productName||'—'}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span style="font-size:11px;color:#94A3B8">${p.unitsSold||0} units</span>
            <span style="font-weight:700">${fmt.money(p.revenue||0)}</span>
          </div>
        </div>`).join('')
    : `<div class="d-widget-row" style="color:var(--text-muted)">No sales data for this period</div>`;

  const refundRate = Number(stats.refundRate || 0).toFixed(1);
  const lowStockCount = invAnalytics.lowStockItems ?? '—';

  const container = document.getElementById('analytics-content');
  if (!container) return;
  container.innerHTML = `
  <div class="dash-stats">
    <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Total Revenue</div><div class="dash-stat-val">${fmt.money(stats.totalRevenue||0)}</div><div class="dash-stat-trend flat">Selected period</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-blue">${I.cart}</div><div class="dash-stat-lbl">Total Orders</div><div class="dash-stat-val">${fmt.num(stats.totalOrders||0)}</div><div class="dash-stat-trend flat">${fmt.num(stats.paidOrActiveOrders||0)} paid/active</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-purple">${I.users}</div><div class="dash-stat-lbl">Total Customers</div><div class="dash-stat-val">${fmt.num(customerCount||stats.activeCustomers||0)}</div><div class="dash-stat-trend flat">${fmt.num(stats.activeCustomers||0)} active this period</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-orange">${I.dollar}</div><div class="dash-stat-lbl">Avg Order Value</div><div class="dash-stat-val">${fmt.money(stats.averageOrderValue||0)}</div><div class="dash-stat-trend flat">Per paid order</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-red">${I.rotate}</div><div class="dash-stat-lbl">Refund Rate</div><div class="dash-stat-val">${refundRate}%</div><div class="dash-stat-trend flat">of total orders</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-yellow">${I.box}</div><div class="dash-stat-lbl">Low Stock Items</div><div class="dash-stat-val">${lowStockCount}</div><div class="dash-stat-trend flat">Need restock</div></div>
  </div>

  <div class="dash-charts-row">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Revenue Overview</div>
      <div class="dash-chart-sub">Monthly revenue for the selected period</div>
      <div class="dash-bars">${barsHtml}</div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Orders by Status</div>
      <div class="dash-chart-sub">Distribution for selected period</div>
      <div class="dash-donut-wrap">
        <svg width="120" height="120" viewBox="0 0 120 120">${donutPaths}</svg>
        <div class="dash-donut-legend">${legendHtml}</div>
      </div>
    </div>
  </div>

  <div class="d-widgets">
    <div class="d-widget">
      <div class="d-widget-ttl">${I.box} Top Products</div>
      ${topProdsHtml}
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">${I.cart} Pending Actions</div>
      <div class="d-widget-row"><span>Pending Orders</span><span class="bdg bdg-yellow">${badges.orders||0}</span></div>
      <div class="d-widget-row"><span>Return Requests</span><span class="bdg bdg-purple">${badges.returns||0}</span></div>
      <div class="d-widget-row"><span>Open Tickets</span><span class="bdg bdg-blue">${badges.tickets||0}</span></div>
      <div class="d-widget-row"><span>Low Stock Items</span><span class="bdg bdg-red">${lowStockCount}</span></div>
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">${I.bell} Quick Links</div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=orders]').click()"><span style="color:#FF6B00">View pending orders</span><span>${I.chevR}</span></div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=returns]').click()"><span style="color:#FF6B00">Review returns</span><span>${I.chevR}</span></div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=support]').click()"><span style="color:#FF6B00">Support tickets</span><span>${I.chevR}</span></div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=inventory]').click()"><span style="color:#FF6B00">Check inventory</span><span>${I.chevR}</span></div>
    </div>
  </div>`;
}

TAB.analytics = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const d30   = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const d7    = new Date(Date.now() - 7  * 86400000).toISOString().slice(0, 10);
  const d90   = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const html = `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Dashboard Overview</div><div class="dash-page-sub">Welcome back, ${getUser().firstName||'Admin'}. Analytics for the selected period.</div></div>
    <div class="dash-page-acts" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <div style="display:flex;gap:4px">
        <button class="btn-d btn-d-sec an-preset ${_analyticsRange.preset==='7d'?'btn-d-active':''}" data-preset="7d" data-start="${d7}" data-end="${today}">7 days</button>
        <button class="btn-d btn-d-sec an-preset ${_analyticsRange.preset==='30d'?'btn-d-active':''}" data-preset="30d" data-start="${d30}" data-end="${today}">30 days</button>
        <button class="btn-d btn-d-sec an-preset ${_analyticsRange.preset==='90d'?'btn-d-active':''}" data-preset="90d" data-start="${d90}" data-end="${today}">90 days</button>
      </div>
      <div style="display:flex;gap:4px;align-items:center">
        <input type="date" class="dash-inp" id="an-start" value="${_analyticsRange.start||d30}" style="padding:6px 8px;font-size:12px;width:130px">
        <span style="font-size:12px;color:#64748B">to</span>
        <input type="date" class="dash-inp" id="an-end"   value="${_analyticsRange.end||today}" style="padding:6px 8px;font-size:12px;width:130px">
        <button class="btn-d btn-d-primary" id="an-apply" style="padding:6px 12px;font-size:12px">${I.refresh} Apply</button>
      </div>
    </div>
  </div>
  <div id="analytics-content">
    <div style="text-align:center;padding:60px;color:#94A3B8">Loading analytics…</div>
  </div>`;

  setTimeout(async () => {
    // Bind date range controls
    document.querySelectorAll('.an-preset').forEach(btn => {
      btn.addEventListener('click', async () => {
        _analyticsRange = { preset: btn.dataset.preset, start: btn.dataset.start, end: btn.dataset.end };
        document.querySelectorAll('.an-preset').forEach(b => b.classList.remove('btn-d-active'));
        btn.classList.add('btn-d-active');
        document.getElementById('an-start').value = btn.dataset.start;
        document.getElementById('an-end').value   = btn.dataset.end;
        const c = document.getElementById('analytics-content');
        if (c) c.innerHTML = '<div style="text-align:center;padding:60px;color:#94A3B8">Loading…</div>';
        await loadAnalyticsData(btn.dataset.start, btn.dataset.end);
      });
    });
    document.getElementById('an-apply')?.addEventListener('click', async () => {
      const start = document.getElementById('an-start')?.value;
      const end   = document.getElementById('an-end')?.value;
      if (!start || !end) return;
      _analyticsRange = { preset: 'custom', start, end };
      document.querySelectorAll('.an-preset').forEach(b => b.classList.remove('btn-d-active'));
      const c = document.getElementById('analytics-content');
      if (c) c.innerHTML = '<div style="text-align:center;padding:60px;color:#94A3B8">Loading…</div>';
      await loadAnalyticsData(start, end);
    });
    // Initial load
    await loadAnalyticsData(_analyticsRange.start || d30, _analyticsRange.end || today);
  }, 0);

  return html;
};

// ── Orders ────────────────────────────────────────────────
TAB.orders = async () => {
  let orders = []; let total = 0;
  try {
    const res = await ApiService.getOrders({ page:0, size:20 });
    orders = extractList(res);
    total  = extractTotal(res, orders);
  } catch(_){}

  const rows = orders.length ? orders.map(o => `
    <tr>
      <td><span class="td-m">#${o.id||o.orderId||'—'}</span></td>
      <td class="td-b">${o.customerName||o.userName||'Customer'}</td>
      <td>${o.email||'—'}</td>
      <td>${fmt.money(o.totalAmount||o.total||0)}</td>
      <td>${statusBdg(o.status||o.orderStatus)}</td>
      <td class="td-sm">${fmt.date(o.createdAt||o.orderDate)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="view-order" data-id="${o.id||o.orderId}" title="View">${I.eye}</button>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-order" data-id="${o.id||o.orderId}" title="Update Status">${I.edit}</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">📦</div><div class="d-empty-ttl">No orders yet</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Orders</div><div class="dash-page-sub">${fmt.num(total)} total orders</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-orders">${I.download} Export</button>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">All Orders</span>
      <span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search orders…" id="order-search" style="width:180px">
        <select class="dash-sel" id="order-status-filter">
          <option value="">All Statuses</option>
          <option>PENDING</option><option>PROCESSING</option><option>FULFILLED</option>
          <option>DELIVERED</option><option>CANCELLED</option><option>REFUNDED</option>
        </select>
        <button class="btn-d btn-d-sec btn-d-sm" id="btn-filter-orders">${I.search} Filter</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Order ID</th><th>Customer</th><th>Email</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody id="orders-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Products ──────────────────────────────────────────────
const buildProductRows = (list) => list.length ? list.map(p => `
  <tr>
    <td class="td-b">${p.name||p.productName||'—'}</td>
    <td>${p.categoryName||p.category?.name||'—'}</td>
    <td>${fmt.money(p.price||0)}</td>
    <td>${statusBdg(p.status||'ACTIVE')}</td>
    <td><label class="d-toggle" style="margin:0"><input type="checkbox" class="prod-featured-toggle" data-id="${p.id}" ${p.featured?'checked':''}><span class="d-tog-slider"></span></label></td>
    <td>
      <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-product" data-id="${p.id}" title="Edit">${I.edit}</button>
      <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-product" data-id="${p.id}" title="Delete">${I.trash}</button>
    </td>
  </tr>`).join('') :
  `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">📦</div><div class="d-empty-ttl">No products found</div><div class="d-empty-txt">Try adjusting your filters.</div></div></td></tr>`;

TAB.products = async () => {
  let products = []; let total = 0;
  try {
    const [prodRes, catRes] = await Promise.all([
      ApiService.products.search({ page:0, size:200 }),
      ApiService.products.getCategories().catch(()=>({data:[]}))
    ]);
    products = extractList(prodRes);
    total    = extractTotal(prodRes, products);
    _categoryCache = extractList(catRes);
  } catch(_){}
  _productCache = products;

  const catOptions = _categoryCache.map(c => `<option value="${c.id}">${escAttr(c.name)}</option>`).join('');

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Products</div><div class="dash-page-sub">${fmt.num(total)} products total</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-products">${I.download} Export CSV</button>
      <button class="btn-d btn-d-primary" id="btn-add-product">${I.plus} Add Product</button>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">All Products</span>
      <span class="dash-tcard-count" id="prod-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search by name…" id="product-search" style="width:180px">
        <select class="dash-sel" id="product-cat-filter">
          <option value="">All Categories</option>${catOptions}
        </select>
        <select class="dash-sel" id="product-status-filter">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead>
      <tbody id="products-tbody">${buildProductRows(products)}</tbody>
    </table>
  </div>`;
};

// ── Inventory ─────────────────────────────────────────────
TAB.inventory = async () => {
  let items = [];
  try {
    const res = await ApiService.getInventory({ page:0, size:30 });
    items = extractList(res);
  } catch(_){}

  _invCache = items;
  const reorderOf = i => i.reorderPoint || i.lowStockThreshold || 10;

  const buildInvRows = (list) => list.length ? list.map(item => {
    const stock = item.quantity || 0;
    const reorder = reorderOf(item);
    const max   = Math.max(stock * 1.5, reorder * 3, 50);
    const pct   = Math.min(Math.round(stock / max * 100), 100);
    const cls   = stock === 0 ? 'out' : stock <= reorder ? 'low' : 'ok';
    const st    = stock === 0 ? 'OUT_OF_STOCK' : stock <= reorder ? 'PENDING' : 'ACTIVE';
    return `<tr>
      <td class="td-b">${item.productName || item.name || '—'}</td>
      <td>${item.sku || '—'}</td>
      <td>${item.location || item.warehouse || 'Main'}</td>
      <td>
        <span style="font-weight:700;color:${cls==='out'?'#EF4444':cls==='low'?'#F59E0B':'#10B981'}">${stock}</span>
        <div class="d-stock-bar" style="width:80px;display:inline-block;margin-left:8px"><div class="d-stock-fill ${cls}" style="width:${pct}%"></div></div>
      </td>
      <td>${reorder}</td>
      <td>${statusBdg(st)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="adjust-stock" data-id="${item.id}" data-item-name="${escAttr(item.productName||item.name||'')}">Adjust</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🏭</div><div class="d-empty-ttl">No inventory data</div></div></td></tr>`;

  const locations = [...new Set(items.map(i => i.location || i.warehouse || 'Main').filter(Boolean))];

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Inventory</div><div class="dash-page-sub">${items.length} items tracked</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-inv">${I.download} Export CSV</button>
      <button class="btn-d btn-d-primary" id="btn-add-inv-item">${I.plus} Add Item</button>
    </div>
  </div>
  <div class="d-widgets" style="margin-bottom:16px">
    <div class="d-widget"><div class="d-widget-ttl">Stock Health</div>
      <div class="d-widget-row"><span>In Stock</span><span class="bdg bdg-green">${items.filter(i=>i.quantity>0&&i.quantity>(reorderOf(i))).length}</span></div>
      <div class="d-widget-row"><span>Low Stock</span><span class="bdg bdg-yellow">${items.filter(i=>i.quantity>0&&i.quantity<=(reorderOf(i))).length}</span></div>
      <div class="d-widget-row"><span>Out of Stock</span><span class="bdg bdg-red">${items.filter(i=>!i.quantity||i.quantity<=0).length}</span></div>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Stock Levels</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search SKU or product…" style="width:200px" id="inv-search">
        <select class="dash-sel" id="inv-location-filter">
          <option value="">All Locations</option>
          ${locations.map(l=>`<option value="${escAttr(l)}">${l}</option>`).join('')}
        </select>
        <select class="dash-sel" id="inv-status-filter">
          <option value="">All Status</option>
          <option value="out">Out of Stock</option>
          <option value="low">Low Stock</option>
          <option value="ok">In Stock</option>
        </select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Product</th><th>SKU</th><th>Location</th><th>Quantity</th><th>Reorder At</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="inv-tbody">${buildInvRows(items)}</tbody>
    </table>
  </div>`;
};

// ── Returns ───────────────────────────────────────────────
TAB.returns = async () => {
  let items = []; let total = 0;
  try {
    const res = await ApiService.getReturns({ page:0, size:20 });
    items = extractList(res);
    total = extractTotal(res, items);
  } catch(_){}

  const rows = items.length ? items.map(r => `
    <tr>
      <td class="td-m">#${(r.id||'—').toString().slice(-8)}</td>
      <td class="td-m">#${(r.orderId||'—').toString().slice(-8)}</td>
      <td class="td-b">${r.customerName||'Customer'}</td>
      <td>${r.reason||'Not specified'}</td>
      <td>${fmt.money(r.refundedAmount||r.refundAmount||r.amount||0)}</td>
      <td>${statusBdg(r.status||'PENDING')}</td>
      <td class="td-sm">${fmt.date(r.createdAt)}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        ${r.status==='PENDING'||!r.status ? `
          <button class="btn-d btn-d-success btn-d-sm" data-action="approve-return" data-id="${r.id}" data-notes="">Approve</button>
          <button class="btn-d btn-d-danger btn-d-sm"  data-action="reject-return"  data-id="${r.id}" data-notes="">Reject</button>
        ` : ''}
        <button class="btn-d btn-d-sec btn-d-sm" data-action="view-return" data-id="${r.id}">${I.eye} View</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">↩️</div><div class="d-empty-ttl">No return requests</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Returns & Refunds</div><div class="dash-page-sub">${total} return requests</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec">${I.download} Export</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Return Requests</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <select class="dash-sel" id="return-status-filter">
          <option value="">All Statuses</option>
          <option>PENDING</option><option>APPROVED</option><option>REJECTED</option><option>REFUNDED</option><option>COMPLETED</option>
        </select>
        <button class="btn-d btn-d-sec btn-d-sm" id="btn-filter-returns">${I.search} Filter</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Return ID</th><th>Order ID</th><th>Customer</th><th>Reason</th><th>Refund</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody id="returns-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Shipments ─────────────────────────────────────────────
TAB.shipments = async () => {
  let items = []; let total = 0;
  try {
    const res = await ApiService.getShipments({ page:0, size:20 });
    items = extractList(res);
    total = extractTotal(res, items);
  } catch(_){}

  const rows = items.length ? items.map(s => {
    const isActive = !['DELIVERED','CANCELLED'].includes(s.status);
    const isAdmin_ = isAdmin();
    return `
    <tr>
      <td class="td-m">${s.trackingNumber||s.tracking||'—'}</td>
      <td class="td-m">#${(s.orderId||'—').toString().slice(-8)}</td>
      <td class="td-b">${s.recipientName||s.customerName||'—'}</td>
      <td>${s.carrier||'—'}</td>
      <td>${statusBdg(s.status||'PENDING')}</td>
      <td class="td-sm">${fmt.date(s.estimatedDeliveryDate||s.estimatedDelivery||s.eta)}</td>
      <td style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="btn-d btn-d-sec btn-d-sm" data-action="view-shipment" data-id="${s.id}">${I.eye} Detail</button>
        ${isActive ? `<button class="btn-d btn-d-primary btn-d-sm" data-action="update-shipment-status" data-id="${s.id}" data-status="${s.status||'PENDING'}">Update Status</button>` : ''}
        ${isAdmin_ && isActive ? `<button class="btn-d btn-d-danger btn-d-sm" data-action="cancel-shipment" data-id="${s.id}">Cancel</button>` : ''}
      </td>
    </tr>`;
  }).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🚚</div><div class="d-empty-ttl">No shipments found</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Shipments</div><div class="dash-page-sub">${total} shipments</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-primary" id="btn-create-shipment">${I.plus} Create Shipment</button>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">All Shipments</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <select class="dash-sel" id="shipment-status-filter">
          <option value="">All Statuses</option>
          <option>PENDING</option><option>IN_TRANSIT</option><option>OUT_FOR_DELIVERY</option><option>DELIVERED</option><option>CANCELLED</option>
        </select>
        <button class="btn-d btn-d-sec btn-d-sm" id="btn-filter-shipments">${I.search} Filter</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Tracking #</th><th>Order</th><th>Recipient</th><th>Carrier</th><th>Status</th><th>ETA</th><th>Actions</th></tr></thead>
      <tbody id="shipments-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Coupons ───────────────────────────────────────────────
TAB.coupons = async () => {
  let coupons = []; let total = 0;
  try {
    const res = await ApiService.getCoupons({ page:0, size:20 });
    coupons = extractList(res);
    total   = extractTotal(res, coupons);
    _couponCache = coupons;
  } catch(_){}

  const rows = coupons.length ? coupons.map(c => `
    <tr>
      <td class="td-m td-b">${c.code||'—'}</td>
      <td>${c.discountType==='PERCENTAGE'?(c.discountValue||0)+'%':fmt.money(c.discountValue||0)}</td>
      <td>${c.minimumPurchase?fmt.money(c.minimumPurchase):'None'}</td>
      <td>${c.usageCount||0} / ${c.usageLimit||'∞'}</td>
      <td>${statusBdg(c.active!==false?'ACTIVE':'INACTIVE')}</td>
      <td class="td-sm">${fmt.date(c.expiryDate||c.endDate)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-coupon" data-id="${c.id}">${I.edit}</button>
        <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-coupon" data-id="${c.id}">${I.trash}</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🏷️</div><div class="d-empty-ttl">No coupons yet</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Coupons & Discounts</div><div class="dash-page-sub">${total} active coupons</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-primary" id="btn-add-coupon">${I.plus} New Coupon</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Coupons</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts"><input class="dash-inp" placeholder="Search code…" style="width:160px"></div>
    </div>
    <table class="dt">
      <thead><tr><th>Code</th><th>Discount</th><th>Min. Purchase</th><th>Usage</th><th>Status</th><th>Expires</th><th>Actions</th></tr></thead>
      <tbody id="coupons-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Banners ───────────────────────────────────────────────
TAB.banners = async () => {
  let banners = [];
  try {
    const res = await ApiService.getBanners();
    banners = extractList(res);
    _bannerCache = banners;
  } catch(_){}

  const rows = banners.length ? banners.map(b => `
    <tr>
      <td class="td-b">${b.title||'Banner'}</td>
      <td>${b.subtitle||'—'}</td>
      <td><span class="bdg ${b.active!==false?'bdg-green':'bdg-gray'}">${b.active!==false?'Active':'Inactive'}</span></td>
      <td class="td-sm">${b.displayOrder||0}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-banner" data-id="${b.id}">${I.edit}</button>
        <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-banner" data-id="${b.id}">${I.trash}</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="5"><div class="d-empty"><div class="d-empty-ico">🖼️</div><div class="d-empty-ttl">No banners yet</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Banners</div><div class="dash-page-sub">Homepage hero banner management</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-primary" id="btn-add-banner">${I.plus} Add Banner</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Hero Banners</span></div>
    <table class="dt">
      <thead><tr><th>Title</th><th>Subtitle</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead>
      <tbody id="banners-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── CRM / Customers ───────────────────────────────────────
TAB.crm = async () => {
  let customers = []; let total = 0;
  try {
    const res = await ApiService.getCustomers({ page:0, size:200 });
    customers = extractList(res);
    total     = extractTotal(res, customers);
  } catch(_){}
  _customerCache = customers;

  const rows = customers.length ? customers.map(c => `
    <tr>
      <td class="td-m">${(c.id||'').toString().slice(0,8)}…</td>
      <td class="td-b">${c.firstName||''} ${c.lastName||''}</td>
      <td>${c.email||'—'}</td>
      <td>${c.orderCount||c.totalOrders||0}</td>
      <td>${fmt.money(c.totalSpent||c.lifetimeValue||0)}</td>
      <td>${statusBdg(c.locked?'BLOCKED':c.enabled===false?'DISABLED':'ACTIVE')}</td>
      <td class="td-sm">${fmt.date(c.createdAt||c.joinDate)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="view-customer" data-id="${c.id}">${I.eye} View</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">👥</div><div class="d-empty-ttl">No customers found</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Customers</div><div class="dash-page-sub">${fmt.num(total)} registered customers</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec" id="btn-export-customers">${I.download} Export Excel</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Customer List</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search by name or email…" style="width:200px" id="crm-search">
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Orders</th><th>LTV</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody id="crm-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Support ───────────────────────────────────────────────
TAB.support = async () => {
  let tickets = [], chatSessions = [];
  try {
    const [tRes, cRes] = await Promise.allSettled([
      ApiService.getSupportTickets({ page:0, size:30 }),
      ApiService.chat.getSessions()
    ]);
    if (tRes.status === 'fulfilled') tickets = extractList(tRes.value);
    if (cRes.status === 'fulfilled') chatSessions = cRes.value?.data || [];
  } catch(_){}

  const ticketListHtml = tickets.length ? tickets.map(t => `
    <div class="sup-item" data-ticket-id="${t.id}">
      <div class="sup-item-title">${escAttr(t.subject||t.title||'Support Request')}</div>
      <div class="sup-item-meta">
        ${statusBdg(t.status||'OPEN')}
        <span>${fmt.ago(t.updatedAt||t.createdAt)}</span>
      </div>
    </div>`).join('') :
    `<div class="d-empty"><div class="d-empty-ico">🎫</div><div class="d-empty-ttl">No tickets</div></div>`;

  const chatListHtml = chatSessions.length ? chatSessions.map(s => {
    const statusColor = s.status === 'OPEN' ? '#EFF6FF' : s.status === 'ASSIGNED' ? '#F0FDF4' : '#F8FAFC';
    const statusTxt  = s.status === 'OPEN' ? '#3B82F6' : s.status === 'ASSIGNED' ? '#10B981' : '#94A3B8';
    return `
    <div class="sup-item" data-chat-id="${s.id}">
      <div class="sup-item-title">${escAttr(s.subject||'Chat Session')}</div>
      <div class="sup-item-meta">
        <span style="background:${statusColor};color:${statusTxt};padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;">${s.status}</span>
        <span>${fmt.ago(s.updatedAt||s.createdAt)}</span>
      </div>
    </div>`;
  }).join('') :
    `<div class="d-empty"><div class="d-empty-ico">💬</div><div class="d-empty-ttl">No live chats</div></div>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Support Center</div><div class="dash-page-sub">${tickets.length} tickets · ${chatSessions.filter(s=>s.status!=='CLOSED').length} active chats</div></div>
  </div>
  <div class="sup-layout">
    <div class="sup-list">
      <div class="sup-list-tabs">
        <button class="sup-list-tab active" data-sup-tab="tickets">Tickets (${tickets.length})</button>
        <button class="sup-list-tab" data-sup-tab="chats">Live Chat (${chatSessions.filter(s=>s.status!=='CLOSED').length})</button>
      </div>
      <div id="sup-tab-tickets">${ticketListHtml}</div>
      <div id="sup-tab-chats" style="display:none;">${chatListHtml}</div>
    </div>
    <div class="sup-chat" id="sup-chat-panel">
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8">
        <div style="text-align:center"><div style="font-size:36px;margin-bottom:8px">💬</div><div style="font-weight:600">Select a ticket or chat to view</div></div>
      </div>
    </div>
  </div>`;
};

// ── Finance ───────────────────────────────────────────────
TAB.finance = async () => {
  if (!isAdmin() && !isEmployee()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let stats = {};
  try {
    const res = await ApiService.getFinanceStats();
    stats = res.data || res || {};
  } catch(_){}

  const revenue  = stats.totalRevenue||stats.revenue||0;
  const expenses = stats.totalExpenses||stats.expenses||0;
  const profit   = revenue - expenses;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Finance</div><div class="dash-page-sub">Revenue, expenses & profit overview</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec">${I.download} Export P&L</button></div>
  </div>
  <div class="dash-stats">
    <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Total Revenue</div><div class="dash-stat-val">${fmt.money(revenue)}</div><div class="dash-stat-trend up">▲ 12.4%</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-red">${I.dollar}</div><div class="dash-stat-lbl">Total Expenses</div><div class="dash-stat-val">${fmt.money(expenses)}</div><div class="dash-stat-trend down">▼ 3.1%</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ${profit>=0?'ico-green':'ico-red'}">${I.dollar}</div><div class="dash-stat-lbl">Net Profit</div><div class="dash-stat-val">${fmt.money(profit)}</div><div class="dash-stat-trend ${profit>=0?'up':'down'}">${profit>=0?'▲':'▼'} ${Math.abs(profit/(revenue||1)*100).toFixed(1)}% margin</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-purple">${I.rotate}</div><div class="dash-stat-lbl">Refunds Issued</div><div class="dash-stat-val">${fmt.money(stats.totalRefunds||0)}</div><div class="dash-stat-trend flat">→ 2.1%</div></div>
  </div>
  <div class="dash-cards-grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">P&L Summary</div>
      <div class="fin-metric"><span class="fin-metric-lbl">Gross Revenue</span><span class="fin-metric-val pos">${fmt.money(revenue)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Cost of Goods</span><span class="fin-metric-val neg">-${fmt.money(expenses*0.6)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Gross Profit</span><span class="fin-metric-val pos">${fmt.money(revenue-expenses*0.6)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Operating Expenses</span><span class="fin-metric-val neg">-${fmt.money(expenses*0.4)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Refunds & Returns</span><span class="fin-metric-val neg">-${fmt.money(stats.totalRefunds||0)}</span></div>
      <div class="fin-metric" style="border-top:2px solid #E8ECF0;margin-top:8px;padding-top:12px"><span class="fin-metric-lbl" style="font-weight:700;color:#0F172A">Net Profit</span><span class="fin-metric-val ${profit>=0?'pos':'neg'}" style="font-size:16px">${fmt.money(profit)}</span></div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Tax Summary</div>
      <div class="fin-metric"><span class="fin-metric-lbl">Tax Collected</span><span class="fin-metric-val">${fmt.money(stats.taxCollected||revenue*0.08)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Tax Rate</span><span class="fin-metric-val">${stats.taxRate||8}%</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Pending Tax Remittance</span><span class="fin-metric-val neg">${fmt.money(stats.pendingTax||0)}</span></div>
    </div>
  </div>`;
};

// ── Reports ───────────────────────────────────────────────
TAB.reports = async () => {
  const reportTypes = [
    { id:'sales',       title:'Sales Report',         desc:'Revenue, orders, AOV by date range',     icon:'📊', formats:['CSV','Excel','PDF'] },
    { id:'inventory',   title:'Inventory Report',      desc:'Stock levels, movements, reorder alerts', icon:'📦', formats:['CSV','Excel'] },
    { id:'customers',   title:'Customer Report',       desc:'Customer list with lifetime value',       icon:'👥', formats:['CSV','Excel'] },
    { id:'orders',      title:'Orders Report',         desc:'Full order history with details',         icon:'🛒', formats:['CSV','Excel','PDF'] },
    { id:'returns',     title:'Returns Report',        desc:'Return & refund analysis',                icon:'↩️', formats:['CSV','Excel'] },
    { id:'finance',     title:'Financial Report',      desc:'P&L, expenses, tax summary',             icon:'💰', formats:['Excel','PDF'] },
  ];

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Reports</div><div class="dash-page-sub">Download reports in multiple formats</div></div>
  </div>
  <div class="dash-field" style="margin-bottom:20px;max-width:400px">
    <label class="dash-label">Date Range</label>
    <div style="display:flex;gap:8px;align-items:center">
      <input type="date" class="dash-inp" id="report-from" style="flex:1">
      <span style="color:#94A3B8">to</span>
      <input type="date" class="dash-inp" id="report-to" style="flex:1">
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">
    ${reportTypes.map(r => `
    <div class="dash-chart-card" style="display:flex;flex-direction:column;gap:10px">
      <div style="font-size:28px">${r.icon}</div>
      <div class="dash-chart-hd">${r.title}</div>
      <div class="dash-chart-sub" style="margin-bottom:4px">${r.desc}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${r.formats.map(f => `<button class="btn-d btn-d-sec btn-d-sm" data-action="download-report" data-type="${r.id}" data-format="${f}">${I.download} ${f}</button>`).join('')}
      </div>
    </div>`).join('')}
  </div>`;
};

// ── Users (Admin only) ────────────────────────────────────
TAB.users = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied. Admin only.</div>`;
  let users = []; let total = 0;
  try {
    const res = await ApiService.getUsers({ page:0, size:20 });
    users = extractList(res);
    total = extractTotal(res, users);
    _userCache = users;
  } catch(_){}

  const roleLabel = r => (r?.name || r || '').replace('ROLE_', '');
  const userStatus = u => u.locked ? 'BLOCKED' : (u.enabled === false ? 'DISABLED' : 'ACTIVE');

  const rows = users.length ? users.map(u => {
    const st = userStatus(u);
    const rolesHtml = (u.roles||[]).map(r => `<span class="bdg bdg-blue" style="margin-right:3px">${roleLabel(r)}</span>`).join('') || '—';
    return `
    <tr>
      <td class="td-sm" style="font-size:10px;color:#94A3B8;max-width:90px;overflow:hidden;text-overflow:ellipsis" title="${u.id||''}">${(u.id||'').slice(0,8)}…</td>
      <td class="td-b">${u.firstName||''} ${u.lastName||''}</td>
      <td>${u.email||'—'}</td>
      <td>${rolesHtml}</td>
      <td>${statusBdg(st)}</td>
      <td class="td-sm">${fmt.date(u.createdAt)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-user" data-id="${u.id}">${I.edit}</button>
        ${st==='BLOCKED'?
          `<button class="btn-d btn-d-success btn-d-sm" data-action="unblock-user" data-id="${u.id}">Unblock</button>`:
          `<button class="btn-d btn-d-danger btn-d-sm" data-action="block-user" data-id="${u.id}">Block</button>`}
      </td>
    </tr>`;
  }).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">👤</div><div class="d-empty-ttl">No users found</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">User Management</div><div class="dash-page-sub">${fmt.num(total)} registered users</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-users">${I.download} Export CSV</button>
      <button class="btn-d btn-d-primary" id="btn-add-user">${I.plus} Add User</button>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">All Users</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search name or email…" style="width:200px" id="user-search">
        <select class="dash-sel" id="user-role-filter">
          <option value="">All Roles</option>
          <option>ADMIN</option><option>EMPLOYEE</option><option>SUPPORT_AGENT</option><option>CUSTOMER</option>
        </select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Roles</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody id="users-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Security ──────────────────────────────────────────────
TAB.security = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let s = {};
  try {
    const res = await ApiService.getSecuritySettings();
    s = res.data || res || {};
  } catch(_){}

  return `
  <div class="dash-page-hd"><div><div class="dash-page-title">Security Settings</div><div class="dash-page-sub">Authentication and access control</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Password Policy</div>
      <div class="f-field"><label class="f-lbl">Min Length <small style="color:#94A3B8">(6–128)</small></label><input class="f-inp" type="number" id="sec-pwd-min" value="${s.passwordMinLength??8}" min="6" max="128"></div>
      <div class="f-field"><label class="f-lbl">Require Uppercase</label><label class="d-toggle"><input type="checkbox" id="sec-pwd-upper" ${s.passwordRequireUppercase?'checked':''}><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Require Lowercase</label><label class="d-toggle"><input type="checkbox" id="sec-pwd-lower" ${s.passwordRequireLowercase?'checked':''}><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Require Digit</label><label class="d-toggle"><input type="checkbox" id="sec-pwd-digit" ${s.passwordRequireDigit?'checked':''}><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Require Special Character</label><label class="d-toggle"><input type="checkbox" id="sec-pwd-special" ${s.passwordRequireSpecialCharacter?'checked':''}><span class="d-tog-slider"></span></label></div>
      <button class="btn-d btn-d-primary" style="margin-top:12px" id="btn-save-security">Save Settings</button>
      <div id="sec-save-msg" style="margin-top:8px;font-size:12px;display:none"></div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Session & Lockout</div>
      <div class="f-field"><label class="f-lbl">MFA Required</label><label class="d-toggle"><input type="checkbox" id="sec-mfa" ${s.mfaRequired?'checked':''}><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Session Timeout <small style="color:#94A3B8">(5–43200 min)</small></label><input class="f-inp" type="number" id="sec-session" value="${s.sessionTimeoutMinutes??60}" min="5" max="43200"></div>
      <div class="f-field"><label class="f-lbl">Max Failed Attempts <small style="color:#94A3B8">(1–20)</small></label><input class="f-inp" type="number" id="sec-max-fail" value="${s.maxFailedLoginAttempts??5}" min="1" max="20"></div>
      <div class="f-field"><label class="f-lbl">Lockout Duration <small style="color:#94A3B8">(1–1440 min)</small></label><input class="f-inp" type="number" id="sec-lockout" value="${s.lockoutDurationMinutes??15}" min="1" max="1440"></div>
      <div class="dash-chart-hd" style="margin-top:18px;margin-bottom:10px">Unlock User</div>
      <div style="display:flex;gap:8px">
        <input class="f-inp" id="sec-unlock-uid" placeholder="User ID to unlock…" style="flex:1">
        <button class="btn-d btn-d-sec" id="btn-unlock-user">Unlock</button>
      </div>
      <div id="sec-unlock-msg" style="margin-top:8px;font-size:12px;display:none"></div>
    </div>
  </div>`;
};

// ── Audit Log ─────────────────────────────────────────────
const buildAuditRows = (list) => list.length ? list.map(l => `
    <tr>
      <td class="td-sm">${fmt.ago(l.timestamp||l.createdAt)}</td>
      <td class="td-b">${l.actorEmail||l.userEmail||'System'}</td>
      <td><span class="bdg bdg-blue">${l.action||l.actionType||'ACTION'}</span></td>
      <td>${l.entityType||l.resource||'—'}</td>
      <td class="td-sm" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.details||l.description||'—'}</td>
      <td class="td-m">${l.ipAddress||'—'}</td>
    </tr>`).join('') :
    `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">📋</div><div class="d-empty-ttl">No matching records</div></div></td></tr>`;

TAB.audit = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let logs = []; let total = 0;
  try {
    const res = await ApiService.getAuditLogs({ page:0, size:100 });
    logs  = extractList(res);
    total = extractTotal(res, logs);
  } catch(_){}
  _auditCache = logs;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Audit Log</div><div class="dash-page-sub">${fmt.num(total)} events</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec" id="btn-export-audit">${I.download} Export CSV</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Recent Activity</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" id="audit-search" placeholder="Search by email or action…" style="width:220px">
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th><th>IP</th></tr></thead>
      <tbody id="audit-tbody">${buildAuditRows(logs)}</tbody>
    </table>
  </div>`;
};

// ── System ────────────────────────────────────────────────
TAB.system = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let configs = []; let backups = [];
  try {
    const [cfgRes, bkpRes] = await Promise.all([
      ApiService.getSystemConfigurations(),
      ApiService.getBackups()
    ]);
    configs = cfgRes.data || cfgRes || [];
    backups = bkpRes.data || bkpRes || [];
  } catch(_){}

  const lastBackup = backups[0];
  const backupRows = backups.slice(0,5).map(b => `
    <div class="d-widget-row" style="align-items:flex-start">
      <div style="font-size:12px">
        <div style="font-weight:600">${fmt.date(b.createdAt)}</div>
        <div style="color:#94A3B8">${b.status||'COMPLETED'}</div>
      </div>
      <button class="btn-d btn-d-sec btn-d-sm" data-action="restore-backup" data-id="${b.id}" style="margin-left:auto">Restore</button>
    </div>`).join('') || '<div style="color:#94A3B8;font-size:12px;padding:8px 0">No backups yet</div>';

  const configRows = Array.isArray(configs) && configs.length ? configs.map(c => `
    <div class="d-widget-row" style="align-items:flex-start;gap:6px">
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;font-weight:600;color:#475569">${c.configKey||c.key||'—'}</div>
        <div style="font-size:12px;color:#64748B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.sensitive ? '••••••••' : (c.configValue||c.value||'—')}</div>
      </div>
      <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-config" data-key="${c.configKey||c.key}" data-value="${c.sensitive?'':c.configValue||''}" data-category="${c.category||''}" data-desc="${c.description||''}">${I.edit}</button>
    </div>`).join('') : '<div style="color:#94A3B8;font-size:12px;padding:8px 0">No configurations found</div>';

  return `
  <div class="dash-page-hd"><div><div class="dash-page-title">System</div><div class="dash-page-sub">Backups, configuration & health</div></div></div>
  <div class="d-widgets">
    <div class="d-widget">
      <div class="d-widget-ttl">System Health</div>
      <div class="d-widget-row"><span>API Server</span><span class="bdg ${ApiService.isOnline()?'bdg-green':'bdg-red'}">${ApiService.isOnline()?'Online':'Offline'}</span></div>
      <div class="d-widget-row"><span>Auth Service</span><span class="bdg bdg-green">Active</span></div>
      <div class="d-widget-row"><span>Last Backup</span><span style="font-size:12px">${lastBackup ? fmt.ago(lastBackup.createdAt) : 'Never'}</span></div>
      <div class="d-widget-row"><span>Configurations</span><span>${configs.length} keys</span></div>
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">Backups</div>
      <button class="btn-d btn-d-primary" style="width:100%;margin-bottom:12px" id="btn-trigger-backup">
        <span id="backup-btn-txt">Trigger Backup Now</span>
      </button>
      <div id="backup-status-msg" style="font-size:12px;margin-bottom:10px;display:none"></div>
      <div style="font-size:11px;font-weight:700;color:#64748B;margin-bottom:6px">BACKUP HISTORY</div>
      <div id="backup-history">${backupRows}</div>
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">Configuration Keys</div>
      <div id="config-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">${configRows}</div>
      <div style="font-size:11px;font-weight:700;color:#64748B;margin-bottom:6px">EDIT CONFIGURATION</div>
      <div class="f-field"><label class="f-lbl">Key</label><input class="f-inp" id="sys-cfg-key" placeholder="e.g. STORE_NAME"></div>
      <div class="f-field"><label class="f-lbl">Value</label><input class="f-inp" id="sys-cfg-val" placeholder="Value…"></div>
      <div class="f-field"><label class="f-lbl">Category</label><input class="f-inp" id="sys-cfg-cat" placeholder="e.g. general"></div>
      <div class="f-field"><label class="f-lbl">Description</label><input class="f-inp" id="sys-cfg-desc" placeholder="Optional description…"></div>
      <button class="btn-d btn-d-primary" style="margin-top:8px" id="btn-save-config">Save Configuration</button>
      <div id="sys-cfg-msg" style="margin-top:8px;font-size:12px;display:none"></div>
    </div>
  </div>`;
};

// ── POS ───────────────────────────────────────────────────
TAB.pos = async () => {
  let products = [];
  let history  = [];
  let summary  = {};
  try {
    const [pr, hi, sm] = await Promise.allSettled([
      ApiService.getProducts({ page:0, size:100, status:'ACTIVE' }),
      ApiService.getPOSHistory({ page:0, size:10 }),
      ApiService.getPOSSummary(),
    ]);
    if (pr.status === 'fulfilled') products = extractList(pr.value);
    if (hi.status === 'fulfilled') {
      const raw = hi.value?.data || hi.value;
      history = raw?.content || (Array.isArray(raw) ? raw : []);
    }
    if (sm.status === 'fulfilled') summary = sm.value?.data || sm.value || {};
  } catch(_){}

  const prodHtml = products.length ? products.map(p => `
    <div class="pos-prod" data-pos-id="${p.id}" data-pos-name="${escAttr(p.name||p.productName||'')}" data-pos-price="${p.price||0}">
      <img class="pos-prod-img" src="${p.imageUrl||p.thumbnailUrl||'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22><rect width=%2256%22 height=%2256%22 fill=%22%23f1f5f9%22/><text x=%2228%22 y=%2234%22 text-anchor=%22middle%22 font-size=%2220%22>📦</text></svg>'}" alt="">
      <div class="pos-prod-name">${p.name||p.productName||'Product'}</div>
      <div class="pos-prod-price">${fmt.money(p.price||0)}</div>
    </div>`).join('') :
    `<div style="grid-column:1/-1;text-align:center;color:#94A3B8;padding:32px">No active products</div>`;

  const histRows = history.length ? history.map(t => `
    <tr>
      <td class="td-m">${t.orderNumber||'—'}</td>
      <td>${t.cashierEmail||'—'}</td>
      <td>${t.customerEmail||'Walk-in'}</td>
      <td>${(t.paymentMethod||'—').replace(/_/g,' ')}</td>
      <td style="font-weight:700">${fmt.money(t.totalAmount||0)}</td>
      <td>${fmt.num(t.itemCount||0)}</td>
      <td class="td-sm">${fmt.date(t.soldAt)}</td>
      <td><button class="btn-d btn-d-sm" data-action="pos-receipt" data-id="${t.orderId}">${I.eye} Receipt</button></td>
    </tr>`).join('') :
    `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">🧾</div><div class="d-empty-ttl">No transactions yet</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Point of Sale</div><div class="dash-page-sub">In-store retail checkout</div></div>
    <div class="dash-page-acts">
      <div style="display:flex;gap:10px">
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:8px 14px;font-size:13px">
          <span style="color:#15803D;font-weight:700">${fmt.num(summary.totalTransactions||0)}</span>
          <span style="color:#64748B;margin-left:4px">sales today</span>
        </div>
        <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:8px 14px;font-size:13px">
          <span style="color:#C2410C;font-weight:700">${fmt.money(summary.totalRevenue||0)}</span>
          <span style="color:#64748B;margin-left:4px">revenue (30d)</span>
        </div>
      </div>
    </div>
  </div>

  <div class="pos-layout">
    <div class="pos-catalog">
      <div class="pos-cat-hd">
        <input class="dash-inp" placeholder="Search products…" id="pos-search" style="width:100%">
      </div>
      <div class="pos-grid" id="pos-grid">${prodHtml}</div>
    </div>
    <div class="pos-cart">
      <div class="pos-cart-hd">🛒 Current Sale</div>
      <div class="pos-cart-items" id="pos-cart-items">
        <div class="d-empty" style="padding:32px 16px">
          <div class="d-empty-ico" style="font-size:28px">🛒</div>
          <div class="d-empty-ttl" style="font-size:13px">Cart is empty</div>
        </div>
      </div>
      <div class="pos-footer">
        <div class="f-field" style="margin-bottom:8px">
          <label class="f-lbl" style="font-size:11px">Customer Email <small style="color:#94A3B8">(optional — for registered customers)</small></label>
          <div style="display:flex;gap:6px">
            <input class="f-inp" id="pos-customer-email" placeholder="customer@email.com" style="flex:1">
            <button class="btn-d btn-d-sec" id="pos-lookup-customer" style="white-space:nowrap;padding:6px 10px;font-size:12px">${I.search} Find</button>
          </div>
          <div id="pos-customer-info" style="font-size:12px;margin-top:4px;color:#10B981"></div>
        </div>
        <div class="pos-totals" id="pos-totals">
          <div class="pos-total-row"><span>Subtotal</span><span class="amount" id="pos-sub">RWF 0</span></div>
          <div class="pos-total-row"><span>Tax</span><span class="amount" id="pos-tax">RWF 0</span></div>
          <div class="pos-total-row grand"><span>Total</span><span id="pos-total">RWF 0</span></div>
        </div>
        <div class="f-field" style="margin-bottom:8px">
          <label class="f-lbl" style="font-size:11px">Payment Method <span style="color:#EF4444">*</span></label>
          <select class="f-sel" id="pos-payment-method" style="width:100%">
            <option value="">— Select method —</option>
            <option value="CASH">Cash</option>
            <option value="MTN_MOBILE_MONEY">MTN Mobile Money</option>
            <option value="AIRTEL_MONEY">Airtel Money</option>
            <option value="CARD">Bank Card</option>
          </select>
        </div>
        <div class="f-field" style="margin-bottom:10px">
          <label class="f-lbl" style="font-size:11px">Payment Reference <small style="color:#94A3B8">(optional)</small></label>
          <input class="f-inp" id="pos-payment-ref" placeholder="Transaction / receipt number…">
        </div>
        <div id="pos-checkout-err" style="font-size:12px;color:#EF4444;margin-bottom:6px;display:none"></div>
        <div style="display:flex;gap:7px">
          <button class="btn-d btn-d-sec" style="flex:1" id="pos-clear">Clear</button>
          <button class="btn-d btn-d-primary" style="flex:2" id="pos-checkout">Charge RWF 0</button>
        </div>
      </div>
    </div>
  </div>

  <div class="dash-chart-card" style="margin-top:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div>
        <div class="dash-chart-hd" style="margin-bottom:2px">Recent POS Transactions</div>
        <div class="dash-chart-sub">Last 10 in-store sales</div>
      </div>
      <button class="btn-d btn-d-sec" id="pos-reload-history" style="font-size:12px">${I.refresh} Refresh</button>
    </div>
    <div class="d-table-wrap">
      <table class="d-table">
        <thead><tr><th>Order #</th><th>Cashier</th><th>Customer</th><th>Payment</th><th>Total</th><th>Items</th><th>Date</th><th>Action</th></tr></thead>
        <tbody id="pos-history-tbody">${histRows}</tbody>
      </table>
    </div>
  </div>`;
};

// ══════════════════════════════════════════════════════════
// DRAWER CONTENT
// ══════════════════════════════════════════════════════════
function drawerBody(type, data) {
  if (type === 'product') return `
    <div class="f-row"><div class="f-field"><label class="f-lbl">Product Name *</label><input class="f-inp" id="d-prod-name" value="${data?.name||''}"></div><div class="f-field"><label class="f-lbl">SKU</label><input class="f-inp" id="d-prod-sku" value="${data?.sku||''}"></div></div>
    <div class="f-field"><label class="f-lbl">Description</label><textarea class="f-ta" id="d-prod-desc">${data?.description||''}</textarea></div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Price *</label><input class="f-inp" type="number" id="d-prod-price" value="${data?.price||''}"></div><div class="f-field"><label class="f-lbl">Compare Price</label><input class="f-inp" type="number" id="d-prod-compare" value="${data?.comparePrice||''}"></div></div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Stock Quantity</label><input class="f-inp" type="number" id="d-prod-stock" value="${data?.stock||0}"></div>
      <div class="f-field">
        <label class="f-lbl">Category</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <select class="f-sel" id="d-prod-cat" style="flex:1"><option value="">Select…</option></select>
          <button type="button" id="d-prod-cat-add" title="Add new category" style="padding:6px 10px;background:#FF6B00;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;line-height:1;">+</button>
        </div>
        <div id="d-prod-cat-new" style="display:none;margin-top:6px;">
          <input class="f-inp" id="d-prod-cat-name" placeholder="New category name…" style="margin-bottom:4px;">
          <button type="button" id="d-prod-cat-save" style="padding:5px 12px;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Save Category</button>
          <button type="button" id="d-prod-cat-cancel" style="padding:5px 10px;background:#f1f5f9;color:#64748b;border:none;border-radius:6px;cursor:pointer;font-size:12px;margin-left:4px;">Cancel</button>
        </div>
      </div>
    </div>
    <div class="f-field">
      <label class="f-lbl">Product Image</label>
      <div id="d-prod-img-wrap" style="border:2px dashed #e2e8f0;border-radius:10px;padding:16px;text-align:center;cursor:pointer;background:#fafafa;transition:border-color .2s;" onclick="document.getElementById('d-prod-img-file').click()">
        ${data?.imageUrl ? `<img id="d-prod-img-preview" src="${data.imageUrl.startsWith('/uploads/') ? 'http://localhost:8080' + data.imageUrl : data.imageUrl}" style="max-height:120px;max-width:100%;border-radius:6px;display:block;margin:0 auto 8px;">` : `<div id="d-prod-img-preview" style="font-size:32px;margin-bottom:6px;">📷</div>`}
        <div style="font-size:12px;color:#94a3b8;">Click to choose an image from your computer</div>
      </div>
      <input type="file" id="d-prod-img-file" accept="image/*" style="display:none">
      <input type="hidden" id="d-prod-img-url" value="${data?.imageUrl||''}">
    </div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Status</label><select class="f-sel" id="d-prod-status"><option value="ACTIVE" ${data?.status==='ACTIVE'?'selected':''}>Active</option><option value="INACTIVE" ${data?.status==='INACTIVE'?'selected':''}>Inactive</option></select></div><div class="f-field"><label class="f-lbl">Featured</label><label class="d-toggle" style="margin-top:8px"><input type="checkbox" id="d-prod-featured" ${data?.featured?'checked':''}><span class="d-tog-slider"></span></label></div></div>`;

  if (type === 'coupon') return `
    <div class="f-row"><div class="f-field"><label class="f-lbl">Coupon Code *</label><input class="f-inp" id="d-coup-code" value="${data?.code||''}" style="text-transform:uppercase"></div><div class="f-field"><label class="f-lbl">Discount Type</label><select class="f-sel" id="d-coup-type"><option value="PERCENTAGE" ${data?.discountType==='PERCENTAGE'?'selected':''}>Percentage</option><option value="FIXED" ${data?.discountType==='FIXED'?'selected':''}>Fixed Amount</option></select></div></div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Discount Value *</label><input class="f-inp" type="number" id="d-coup-val" value="${data?.discountValue||''}"></div><div class="f-field"><label class="f-lbl">Min. Purchase</label><input class="f-inp" type="number" id="d-coup-min" value="${data?.minimumPurchase||''}"></div></div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Usage Limit</label><input class="f-inp" type="number" id="d-coup-limit" value="${data?.usageLimit||''}"></div><div class="f-field"><label class="f-lbl">Expiry Date</label><input class="f-inp" type="date" id="d-coup-exp" value="${data?.expiryDate||''}"></div></div>`;

  if (type === 'banner') return `
    <div class="f-field"><label class="f-lbl">Title *</label><input class="f-inp" id="d-ban-title" value="${data?.title||''}"></div>
    <div class="f-field"><label class="f-lbl">Subtitle</label><input class="f-inp" id="d-ban-sub" value="${data?.subtitle||''}"></div>
    <div class="f-field"><label class="f-lbl">CTA Button Text</label><input class="f-inp" id="d-ban-cta" value="${data?.ctaText||data?.buttonText||''}"></div>
    <div class="f-field"><label class="f-lbl">CTA Link</label><input class="f-inp" id="d-ban-link" value="${data?.ctaLink||data?.link||''}"></div>
    <div class="f-field"><label class="f-lbl">Image URL</label><input class="f-inp" id="d-ban-img" value="${data?.imageUrl||''}"></div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Display Order</label><input class="f-inp" type="number" id="d-ban-order" value="${data?.displayOrder||0}"></div><div class="f-field"><label class="f-lbl">Active</label><label class="d-toggle" style="margin-top:8px"><input type="checkbox" id="d-ban-active" ${data?.active!==false?'checked':''}><span class="d-tog-slider"></span></label></div></div>`;

  if (type === 'user') return `
    <div class="f-row"><div class="f-field"><label class="f-lbl">First Name</label><input class="f-inp" id="d-usr-fn" value="${data?.firstName||''}"></div><div class="f-field"><label class="f-lbl">Last Name</label><input class="f-inp" id="d-usr-ln" value="${data?.lastName||''}"></div></div>
    <div class="f-field"><label class="f-lbl">Email *</label><input class="f-inp" type="email" id="d-usr-email" value="${data?.email||''}"></div>
    ${!data ? `<div class="f-field"><label class="f-lbl">Password *</label><input class="f-inp" type="password" id="d-usr-pw"></div>` : ''}
    <div class="f-field"><label class="f-lbl">Role</label><select class="f-sel" id="d-usr-role"><option value="ROLE_CUSTOMER">Customer</option><option value="ROLE_EMPLOYEE">Employee</option><option value="ROLE_ADMIN">Admin</option></select></div>`;

  if (type === 'adjust') return `
    <div class="d-alert d-alert-info">Adjusting stock for: <b>${data?.name||'Product'}</b></div>
    <div class="f-field"><label class="f-lbl">Adjustment Type</label><select class="f-sel" id="adj-type"><option value="ADD">Add Stock</option><option value="REMOVE">Remove Stock</option><option value="SET">Set Exact Amount</option></select></div>
    <div class="f-field"><label class="f-lbl">Quantity *</label><input class="f-inp" type="number" id="adj-qty" min="0" placeholder="Enter quantity…"></div>
    <div class="f-field"><label class="f-lbl">Reason</label><textarea class="f-ta" id="adj-reason" placeholder="Restock, correction, damage…" style="min-height:60px"></textarea></div>`;

  if (type === 'order') return `
    <div class="d-alert d-alert-info">Loading order details…</div>`;

  if (type === 'shipment') return `
    <div class="f-field"><label class="f-lbl">Order ID <span style="color:#EF4444">*</span></label><input class="f-inp" id="d-shp-order" value="${data?.orderId||''}" placeholder="UUID of order…"></div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Carrier <span style="color:#EF4444">*</span></label><input class="f-inp" id="d-shp-carrier" value="${data?.carrier||''}" placeholder="e.g. DHL, Luz Logistics"></div>
      <div class="f-field"><label class="f-lbl">Tracking Number</label><input class="f-inp" id="d-shp-tracking" value="${data?.trackingNumber||''}" placeholder="Optional"></div>
    </div>
    <div class="f-field"><label class="f-lbl">Estimated Delivery Date</label><input class="f-inp" type="datetime-local" id="d-shp-eta" value="${data?.estimatedDeliveryDate||''}"></div>`;

  if (type === 'shipment-status') return `
    <div class="d-alert d-alert-info" style="margin-bottom:14px">Updating shipment status</div>
    <div class="f-field"><label class="f-lbl">New Status <span style="color:#EF4444">*</span></label>
      <select class="f-sel" id="d-shp-status">
        ${['PENDING','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED'].map(st=>`<option value="${st}" ${(data?.status||'')=== st?'selected':''}>${st.replace(/_/g,' ')}</option>`).join('')}
      </select>
    </div>
    <div class="f-field"><label class="f-lbl">Actual Delivery Date <small style="color:#94A3B8">(if delivered)</small></label><input class="f-inp" type="datetime-local" id="d-shp-delivered"></div>`;

  if (type === 'return-action') return `
    <div class="d-alert d-alert-info" style="margin-bottom:14px">${data?.action === 'approve' ? 'Approving return request' : 'Rejecting return request'}</div>
    <div class="f-field"><label class="f-lbl">Admin Notes <small style="color:#94A3B8">(optional)</small></label><textarea class="f-ta" id="d-ret-notes" placeholder="Reason or instructions for the customer…" style="min-height:80px">${data?.adminNotes||''}</textarea></div>`;

  return `<div class="d-empty"><div class="d-empty-ico">📝</div><div class="d-empty-ttl">Form coming soon</div></div>`;
}

function drawerFooter(type, data) {
  return `
    <button class="btn-d btn-d-sec" id="d-btn-cancel" style="flex:1">Cancel</button>
    <button class="btn-d btn-d-primary" id="d-btn-save" style="flex:2">${data ? 'Update' : 'Create'}</button>`;
}

function bindDrawerEvents(type, data) {
  document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
  document.getElementById('d-btn-save')?.addEventListener('click', () => saveDrawer(type, data));

  if (type === 'product') {
    // Image file picker → preview
    const fileInput = document.getElementById('d-prod-img-file');
    const wrap      = document.getElementById('d-prod-img-wrap');
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const preview = document.getElementById('d-prod-img-preview');
      if (preview.tagName === 'IMG') {
        preview.src = url;
      } else {
        const img = document.createElement('img');
        img.id = 'd-prod-img-preview';
        img.src = url;
        img.style.cssText = 'max-height:120px;max-width:100%;border-radius:6px;display:block;margin:0 auto 8px;';
        preview.replaceWith(img);
      }
      document.getElementById('d-prod-img-url').value = '';
    });
    wrap?.addEventListener('dragover', e => { e.preventDefault(); wrap.style.borderColor = '#FF6B00'; });
    wrap?.addEventListener('dragleave', () => { wrap.style.borderColor = '#e2e8f0'; });
    wrap?.addEventListener('drop', e => {
      e.preventDefault(); wrap.style.borderColor = '#e2e8f0';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const dt = new DataTransfer(); dt.items.add(file); fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });

    // Add new category inline
    const addBtn    = document.getElementById('d-prod-cat-add');
    const newPanel  = document.getElementById('d-prod-cat-new');
    const saveBtn   = document.getElementById('d-prod-cat-save');
    const cancelBtn = document.getElementById('d-prod-cat-cancel');
    addBtn?.addEventListener('click', () => { newPanel.style.display = 'block'; document.getElementById('d-prod-cat-name')?.focus(); });
    cancelBtn?.addEventListener('click', () => { newPanel.style.display = 'none'; });
    saveBtn?.addEventListener('click', async () => {
      const name = document.getElementById('d-prod-cat-name')?.value.trim();
      if (!name) return;
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      try {
        const res = await fetch('http://localhost:8080/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') },
          body: JSON.stringify({ name })
        }).then(r => r.json());
        if (res.data?.id) {
          const sel = document.getElementById('d-prod-cat');
          const opt = document.createElement('option');
          opt.value = res.data.id; opt.textContent = res.data.name; opt.selected = true;
          sel.appendChild(opt);
          _categoryCache.push(res.data);
        }
        newPanel.style.display = 'none';
        document.getElementById('d-prod-cat-name').value = '';
      } catch(e) { alert('Failed to create category'); }
      saveBtn.disabled = false; saveBtn.textContent = 'Save Category';
    });
  }
}

async function saveDrawer(type, data) {
  const btn = document.getElementById('d-btn-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    if (type === 'product') {
      const fileInput  = document.getElementById('d-prod-img-file');
      const file       = fileInput?.files?.[0];
      const categoryId = document.getElementById('d-prod-cat')?.value || null;
      const status     = document.getElementById('d-prod-status')?.value || 'ACTIVE';
      const name       = document.getElementById('d-prod-name')?.value || '';
      const sku        = document.getElementById('d-prod-sku')?.value || '';
      const desc       = document.getElementById('d-prod-desc')?.value || '';
      const price      = parseFloat(document.getElementById('d-prod-price')?.value) || 0;
      const compare    = parseFloat(document.getElementById('d-prod-compare')?.value) || null;
      const stock      = parseInt(document.getElementById('d-prod-stock')?.value) || 0;
      const featured   = document.getElementById('d-prod-featured')?.checked;

      if (file) {
        // Upload via multipart
        const fd = new FormData();
        fd.append('file', file);
        fd.append('name', name);
        fd.append('sku', sku);
        fd.append('description', desc);
        fd.append('price', price);
        fd.append('status', status);
        if (categoryId) fd.append('categoryId', categoryId);

        const res = await fetch('http://localhost:8080/api/products/upload', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') },
          body: fd
        }).then(r => r.json());

        if (data && res.data?.id) {
          // For update: also update the existing product's other fields
          await ApiService.updateProduct(data.id, { name, sku, description: desc, price, comparePrice: compare, stock, status, featured, categoryId });
          // Then upload image to existing product
          const fd2 = new FormData(); fd2.append('file', file); fd2.append('isPrimary', 'true');
          await fetch(`http://localhost:8080/api/products/${data.id}/images`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') },
            body: fd2
          });
        }
      } else {
        const payload = {
          name, sku, description: desc, price, comparePrice: compare, stock,
          imageUrl: document.getElementById('d-prod-img-url')?.value,
          status, featured, categoryId
        };
        data ? await ApiService.updateProduct(data.id, payload) : await ApiService.createProduct(payload);
      }
    } else if (type === 'coupon') {
      const payload = {
        code:            (document.getElementById('d-coup-code')?.value||'').toUpperCase(),
        discountType:    document.getElementById('d-coup-type')?.value,
        discountValue:   parseFloat(document.getElementById('d-coup-val')?.value)||0,
        minimumPurchase: parseFloat(document.getElementById('d-coup-min')?.value)||null,
        usageLimit:      parseInt(document.getElementById('d-coup-limit')?.value)||null,
        expiryDate:      document.getElementById('d-coup-exp')?.value||null,
      };
      if (data?.id) {
        await ApiService.updateCoupon(data.id, payload);
      } else {
        await ApiService.createCoupon(payload);
      }
    } else if (type === 'banner') {
      const payload = {
        title:        document.getElementById('d-ban-title')?.value,
        subtitle:     document.getElementById('d-ban-sub')?.value,
        ctaText:      document.getElementById('d-ban-cta')?.value,
        ctaLink:      document.getElementById('d-ban-link')?.value,
        imageUrl:     document.getElementById('d-ban-img')?.value,
        displayOrder: parseInt(document.getElementById('d-ban-order')?.value)||0,
        active:       document.getElementById('d-ban-active')?.checked,
      };
      data ? await ApiService.updateBanner(data.id, payload) : await ApiService.createBanner(payload);
    } else if (type === 'adjust') {
      const adjType = document.getElementById('adj-type')?.value || 'ADD';
      const rawQty  = parseInt(document.getElementById('adj-qty')?.value) || 0;
      const reason  = document.getElementById('adj-reason')?.value || 'Manual adjustment';
      const qty     = adjType === 'REMOVE' ? -Math.abs(rawQty) : Math.abs(rawQty);
      await ApiService.adjustInventory(data.id, { adjustmentType: adjType, quantity: qty, reason });
    } else if (type === 'user') {
      const fn       = document.getElementById('d-usr-fn')?.value?.trim();
      const ln       = document.getElementById('d-usr-ln')?.value?.trim();
      const email    = document.getElementById('d-usr-email')?.value?.trim();
      const pw       = document.getElementById('d-usr-pw')?.value;
      const roleName = document.getElementById('d-usr-role')?.value;
      if (data?.id) {
        // Update profile fields
        await ApiService.updateUser(data.id, { firstName: fn, lastName: ln });
        // Update role if changed
        if (roleName) await ApiService.admin.replaceRoles(data.id, [roleName]);
      } else {
        if (!fn || !ln || !email || !pw) throw new Error('First name, last name, email and password are required');
        await ApiService.createUser({ firstName: fn, lastName: ln, email, password: pw, roleName: roleName || 'ROLE_CUSTOMER' });
      }
    } else if (type === 'shipment') {
      const eta = document.getElementById('d-shp-eta')?.value;
      const payload = {
        orderId:               document.getElementById('d-shp-order')?.value?.trim(),
        carrier:               document.getElementById('d-shp-carrier')?.value?.trim(),
        trackingNumber:        document.getElementById('d-shp-tracking')?.value?.trim() || null,
        estimatedDeliveryDate: eta || null,
      };
      if (!payload.orderId) throw new Error('Order ID is required');
      if (!payload.carrier) throw new Error('Carrier is required');
      await ApiService.createShipment(payload);
    } else if (type === 'shipment-status') {
      const status = document.getElementById('d-shp-status')?.value;
      const delivered = document.getElementById('d-shp-delivered')?.value;
      if (!status) throw new Error('Status is required');
      await ApiService.updateShipmentStatus(data.id, { status, actualDeliveryDate: delivered || null });
    } else if (type === 'return-action') {
      const adminNotes = document.getElementById('d-ret-notes')?.value || '';
      if (data.action === 'approve') {
        await ApiService.approveReturn(data.id, adminNotes);
        showToast('Return approved', 'success');
      } else {
        await ApiService.rejectReturn(data.id, adminNotes);
        showToast('Return rejected', 'success');
      }
      closeDrawer();
      setTimeout(() => loadTab('returns'), 300);
      return;
    }
    closeDrawer();
    showToast('Saved successfully', 'success');
    setTimeout(() => loadTab(activeTab), 300);
  } catch(e) {
    showToast(e.message||'Save failed', 'error');
    btn.disabled = false; btn.textContent = data ? 'Update' : 'Create';
  }
}

// ── Tab-level event bindings ───────────────────────────────
function bindTab(tab) {
  const page = document.getElementById('dash-page');

  // Delegated actions
  page.addEventListener('click', async e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id, name, type: rtype, format, key, value, category, desc, status } = el.dataset;

    if (action === 'edit-product') { const res = await ApiService.getProduct(id).catch(()=>null); const p = res?.data || res || { id }; openDrawer('product', p); }
    else if (action === 'delete-product') { if(confirm('Delete this product?')) { await ApiService.deleteProduct(id).catch(()=>{}); loadTab('products'); } }
    else if (action === 'edit-coupon') {
      try {
        const raw = await ApiService.getCoupon(id).then(r => r.data || r);
        // Map entity field names to the frontend form field names
        const c = { ...raw, discountType: raw.type, discountValue: raw.amount, minimumPurchase: raw.minimumOrderAmount };
        openDrawer('coupon', c);
      } catch(_) {
        const c = _couponCache.find(x => x.id === id) || { id };
        openDrawer('coupon', c);
      }
    }
    else if (action === 'delete-coupon') { if(confirm('Delete coupon?')) { await ApiService.deleteCoupon(id).catch(()=>{}); loadTab('coupons'); } }
    else if (action === 'edit-banner') {
      try { const b = await ApiService.getBanner(id).then(r => r.data || r); openDrawer('banner', b); }
      catch(_) { const b = _bannerCache.find(x => x.id === id) || { id }; openDrawer('banner', b); }
    }
    else if (action === 'delete-banner') { if(confirm('Delete banner?')) { await ApiService.deleteBanner(id).catch(()=>{}); loadTab('banners'); } }
    else if (action === 'adjust-stock') { openDrawer('adjust', { id, name: el.dataset.itemName || name }); }
    else if (action === 'approve-return') { openDrawer('return-action', { id, action:'approve' }); }
    else if (action === 'reject-return')  { openDrawer('return-action', { id, action:'reject' }); }
    else if (action === 'view-return')    { viewReturnDetail(id); }
    else if (action === 'block-user') {
      if (!confirm('Block this user? They will be unable to log in.')) return;
      try { await ApiService.blockUser(id); showToast('User blocked'); loadTab('users'); }
      catch(e) { showToast(e.message, 'error'); }
    }
    else if (action === 'unblock-user') {
      try { await ApiService.unblockUser(id); showToast('User unblocked'); loadTab('users'); }
      catch(e) { showToast(e.message, 'error'); }
    }
    else if (action === 'download-report') { downloadReport(rtype, format); }
    else if (action === 'view-order')    { viewOrderDetail(id); }
    else if (action === 'view-customer') { viewCustomer(id); }
    else if (action === 'edit-user') {
      try { const u = await ApiService.getUser(id).then(r => r.data || r); openDrawer('user', u); }
      catch(_) { const u = _userCache.find(x => x.id === id) || { id }; openDrawer('user', u); }
    }
    else if (action === 'view-shipment') { viewShipmentDetail(id); }
    else if (action === 'update-shipment-status') { openDrawer('shipment-status', { id, status }); }
    else if (action === 'cancel-shipment') {
      if (confirm('Cancel this shipment? This cannot be undone.')) {
        el.disabled = true;
        try {
          await ApiService.cancelShipment(id);
          showToast('Shipment cancelled', 'success');
          loadTab('shipments');
        } catch(err) { showToast(err.message||'Cancel failed', 'error'); el.disabled = false; }
      }
    }
    else if (action === 'restore-backup') {
      if (confirm('Restore from this backup? Current data will be replaced.')) {
        el.disabled = true; el.textContent = 'Restoring…';
        try {
          await ApiService.restoreBackup(id);
          showToast('Restore started successfully', 'success');
        } catch(err) { showToast(err.message||'Restore failed', 'error'); el.disabled = false; el.textContent = 'Restore'; }
      }
    }
    else if (action === 'edit-config') {
      const keyEl = document.getElementById('sys-cfg-key');
      const valEl = document.getElementById('sys-cfg-val');
      const catEl = document.getElementById('sys-cfg-cat');
      const dscEl = document.getElementById('sys-cfg-desc');
      if (keyEl) keyEl.value = key || '';
      if (valEl) valEl.value = value || '';
      if (catEl) catEl.value = category || '';
      if (dscEl) dscEl.value = desc || '';
    }
  });

  // Tab-specific bindings
  if (tab === 'products') {
    document.getElementById('btn-add-product')?.addEventListener('click', () => openDrawer('product', null));

    // Live filter
    const filterProducts = () => {
      const q   = (document.getElementById('product-search')?.value || '').toLowerCase();
      const cat = document.getElementById('product-cat-filter')?.value || '';
      const st  = document.getElementById('product-status-filter')?.value || '';
      const filtered = _productCache.filter(p => {
        const matchQ  = !q  || (p.name||'').toLowerCase().includes(q);
        const matchC  = !cat || (p.categoryId||p.category?.id||'') === cat;
        const matchSt = !st  || (p.status||'') === st;
        return matchQ && matchC && matchSt;
      });
      const tbody = document.getElementById('products-tbody');
      const count = document.getElementById('prod-count');
      if (tbody) tbody.innerHTML = buildProductRows(filtered);
      if (count) count.textContent = filtered.length;
    };
    document.getElementById('product-search')?.addEventListener('input', filterProducts);
    document.getElementById('product-cat-filter')?.addEventListener('change', filterProducts);
    document.getElementById('product-status-filter')?.addEventListener('change', filterProducts);

    // Export CSV
    document.getElementById('btn-export-products')?.addEventListener('click', () => {
      if (!_productCache.length) { showToast('No products to export', 'error'); return; }
      const header = 'Name,Category,Price,Status,Featured,SKU';
      const rows = _productCache.map(p => [
        p.name||'', p.categoryName||p.category?.name||'',
        p.price||0, p.status||'', p.featured?'Yes':'No', p.sku||''
      ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
      const csv = header + '\n' + rows.join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'products_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showToast('Products exported', 'success');
    });

    // Featured toggle
    document.getElementById('products-tbody')?.addEventListener('change', async e => {
      const cb = e.target.closest('.prod-featured-toggle');
      if (!cb) return;
      const id = cb.dataset.id;
      const featured = cb.checked;
      try {
        await ApiService.setProductFeatured(id, featured);
        const p = _productCache.find(x => x.id === id);
        if (p) p.featured = featured;
        showToast(featured ? 'Marked as featured' : 'Removed from featured', 'success');
      } catch(e) {
        showToast(e.message || 'Failed', 'error');
        cb.checked = !featured; // revert
      }
    });
  }
  if (tab === 'inventory') {
    // Export CSV
    document.getElementById('btn-export-inv')?.addEventListener('click', () => {
      const rows = [...document.querySelectorAll('#inv-tbody tr')].map(tr => {
        const cells = [...tr.querySelectorAll('td')].map(td => '"' + td.textContent.trim().replace(/"/g,'""') + '"');
        return cells.join(',');
      }).filter(r => r);
      if (!rows.length) { showToast('No data to export', 'error'); return; }
      const csv = 'Product,SKU,Location,Quantity,Reorder At,Status,\n' + rows.join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'inventory_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showToast('Inventory exported', 'success');
    });

    // Add inventory item
    document.getElementById('btn-add-inv-item')?.addEventListener('click', () => openDrawer('inv-item', null));

    // Live search + filter
    const filterInv = () => {
      const q    = (document.getElementById('inv-search')?.value || '').toLowerCase();
      const loc  = (document.getElementById('inv-location-filter')?.value || '').toLowerCase();
      const stf  = document.getElementById('inv-status-filter')?.value || '';
      const tbody = document.getElementById('inv-tbody');
      if (!tbody) return;
      const reorderOf = i => i.reorderPoint || i.lowStockThreshold || 10;
      const filtered = _invCache.filter(item => {
        const matchQ   = !q   || (item.productName||'').toLowerCase().includes(q) || (item.sku||'').toLowerCase().includes(q);
        const matchLoc = !loc || (item.location||item.warehouse||'').toLowerCase().includes(loc);
        const stock    = item.quantity || 0;
        const matchSt  = !stf ||
          (stf === 'out' && stock <= 0) ||
          (stf === 'low' && stock > 0 && stock <= reorderOf(item)) ||
          (stf === 'ok'  && stock > reorderOf(item));
        return matchQ && matchLoc && matchSt;
      });
      const reorderOf2 = i => i.reorderPoint || i.lowStockThreshold || 10;
      tbody.innerHTML = filtered.length ? filtered.map(item => {
        const stock = item.quantity || 0;
        const reorder = reorderOf2(item);
        const max   = Math.max(stock * 1.5, reorder * 3, 50);
        const pct   = Math.min(Math.round(stock / max * 100), 100);
        const cls   = stock === 0 ? 'out' : stock <= reorder ? 'low' : 'ok';
        const st    = stock === 0 ? 'OUT_OF_STOCK' : stock <= reorder ? 'PENDING' : 'ACTIVE';
        return `<tr>
          <td class="td-b">${item.productName||'—'}</td>
          <td>${item.sku||'—'}</td>
          <td>${item.location||item.warehouse||'Main'}</td>
          <td><span style="font-weight:700;color:${cls==='out'?'#EF4444':cls==='low'?'#F59E0B':'#10B981'}">${stock}</span>
            <div class="d-stock-bar" style="width:80px;display:inline-block;margin-left:8px"><div class="d-stock-fill ${cls}" style="width:${pct}%"></div></div></td>
          <td>${reorder}</td>
          <td>${statusBdg(st)}</td>
          <td><button class="btn-d btn-d-sec btn-d-sm" data-action="adjust-stock" data-id="${item.id}" data-item-name="${escAttr(item.productName||'')}">Adjust</button></td>
        </tr>`;
      }).join('') : `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🔍</div><div class="d-empty-ttl">No matching items</div></div></td></tr>`;
    };
    document.getElementById('inv-search')?.addEventListener('input', filterInv);
    document.getElementById('inv-location-filter')?.addEventListener('change', filterInv);
    document.getElementById('inv-status-filter')?.addEventListener('change', filterInv);
  }

  if (tab === 'crm') {
    document.getElementById('btn-export-customers')?.addEventListener('click', () => {
      if (!_customerCache.length) { showToast('No customers to export', 'error'); return; }
      const header = 'ID,First Name,Last Name,Email,Phone,Status,Joined';
      const rows = _customerCache.map(c => [
        c.id||'', c.firstName||'', c.lastName||'', c.email||'',
        c.phone||c.phoneNumber||'',
        c.locked?'BLOCKED':c.enabled===false?'DISABLED':'ACTIVE',
        c.createdAt||''
      ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
      const csv = header + '\n' + rows.join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'customers_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showToast('Customers exported', 'success');
    });
    document.getElementById('crm-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const tbody = document.getElementById('crm-tbody');
      if (!tbody) return;
      const filtered = !q ? _customerCache : _customerCache.filter(c => {
        const name  = `${c.firstName||''} ${c.lastName||''}`.toLowerCase();
        const email = (c.email||'').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
      tbody.innerHTML = filtered.length ? filtered.map(c => `
        <tr>
          <td class="td-m">${(c.id||'').toString().slice(0,8)}…</td>
          <td class="td-b">${c.firstName||''} ${c.lastName||''}</td>
          <td>${c.email||'—'}</td>
          <td>${c.orderCount||c.totalOrders||0}</td>
          <td>${fmt.money(c.totalSpent||c.lifetimeValue||0)}</td>
          <td>${statusBdg(c.locked?'BLOCKED':c.enabled===false?'DISABLED':'ACTIVE')}</td>
          <td class="td-sm">${fmt.date(c.createdAt||c.joinDate)}</td>
          <td><button class="btn-d btn-d-sec btn-d-sm" data-action="view-customer" data-id="${c.id}">${I.eye} View</button></td>
        </tr>`).join('') :
        `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">🔍</div><div class="d-empty-ttl">No matching customers</div></div></td></tr>`;
    });
  }

  if (tab === 'audit') {
    document.getElementById('audit-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const tbody = document.getElementById('audit-tbody');
      if (!tbody) return;
      const filtered = !q ? _auditCache : _auditCache.filter(l => {
        const email  = (l.actorEmail||l.userEmail||'').toLowerCase();
        const action = (l.action||l.actionType||'').toLowerCase();
        const res    = (l.entityType||l.resource||'').toLowerCase();
        return email.includes(q) || action.includes(q) || res.includes(q);
      });
      tbody.innerHTML = buildAuditRows(filtered);
    });
    document.getElementById('btn-export-audit')?.addEventListener('click', () => {
      if (!_auditCache.length) { showToast('No data to export', 'error'); return; }
      const header = 'Time,User,Action,Resource,Details,IP';
      const rows = _auditCache.map(l => [
        l.timestamp||l.createdAt||'', l.actorEmail||l.userEmail||'System',
        l.action||l.actionType||'', l.entityType||l.resource||'',
        (l.details||l.description||'').replace(/,/g,' '), l.ipAddress||''
      ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
      const csv = header + '\n' + rows.join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'audit_log_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showToast('Audit log exported', 'success');
    });
  }

  if (tab === 'coupons')  document.getElementById('btn-add-coupon')?.addEventListener('click',  () => openDrawer('coupon', null));
  if (tab === 'banners')  document.getElementById('btn-add-banner')?.addEventListener('click',  () => openDrawer('banner', null));
  if (tab === 'users') {
    document.getElementById('btn-add-user')?.addEventListener('click', () => openDrawer('user', null));

    // Export CSV
    document.getElementById('btn-export-users')?.addEventListener('click', () => {
      if (!_userCache.length) { showToast('No users loaded to export', 'error'); return; }
      const roleLabel = r => (r?.name || r || '').replace('ROLE_', '');
      const userStatus = u => u.locked ? 'BLOCKED' : (u.enabled === false ? 'DISABLED' : 'ACTIVE');
      const header = ['ID','First Name','Last Name','Email','Roles','Status','Phone','Joined'];
      const csvRows = [header, ..._userCache.map(u => [
        u.id,
        u.firstName||'',
        u.lastName||'',
        u.email||'',
        (u.roles||[]).map(roleLabel).join('; '),
        userStatus(u),
        u.phoneNumber||'',
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
      ])];
      const csv = csvRows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'users_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showToast('Users exported as CSV', 'success');
    });

    // Live search + role filter
    const filterUsers = () => {
      const q = (document.getElementById('user-search')?.value || '').toLowerCase();
      const role = (document.getElementById('user-role-filter')?.value || '').toUpperCase();
      const tbody = document.getElementById('users-tbody');
      if (!tbody) return;
      const roleLabel = r => (r?.name || r || '').replace('ROLE_', '');
      const userStatus = u => u.locked ? 'BLOCKED' : (u.enabled === false ? 'DISABLED' : 'ACTIVE');
      const filtered = _userCache.filter(u => {
        const name = ((u.firstName||'') + ' ' + (u.lastName||'')).toLowerCase();
        const matchQ = !q || name.includes(q) || (u.email||'').toLowerCase().includes(q);
        const matchR = !role || (u.roles||[]).some(r => (r?.name||r||'').includes(role));
        return matchQ && matchR;
      });
      if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">👤</div><div class="d-empty-ttl">No matching users</div></div></td></tr>`;
        return;
      }
      tbody.innerHTML = filtered.map(u => {
        const st = userStatus(u);
        const rolesHtml = (u.roles||[]).map(r => `<span class="bdg bdg-blue" style="margin-right:3px">${roleLabel(r)}</span>`).join('') || '—';
        return `<tr>
          <td class="td-sm" style="font-size:10px;color:#94A3B8;max-width:90px;overflow:hidden;text-overflow:ellipsis" title="${u.id||''}">${(u.id||'').slice(0,8)}…</td>
          <td class="td-b">${u.firstName||''} ${u.lastName||''}</td>
          <td>${u.email||'—'}</td>
          <td>${rolesHtml}</td>
          <td>${statusBdg(st)}</td>
          <td class="td-sm">${fmt.date(u.createdAt)}</td>
          <td>
            <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-user" data-id="${u.id}">${I.edit}</button>
            ${st==='BLOCKED' ?
              `<button class="btn-d btn-d-success btn-d-sm" data-action="unblock-user" data-id="${u.id}">Unblock</button>` :
              `<button class="btn-d btn-d-danger btn-d-sm" data-action="block-user" data-id="${u.id}">Block</button>`}
          </td>
        </tr>`;
      }).join('');
    };
    document.getElementById('user-search')?.addEventListener('input', filterUsers);
    document.getElementById('user-role-filter')?.addEventListener('change', filterUsers);
  }
  if (tab === 'support')  bindSupportTab();
  if (tab === 'pos')      bindPOS();
  if (tab === 'security') bindSecurityTab();
  if (tab === 'system')   bindSystemTab();
  if (tab === 'returns') {
    document.getElementById('btn-filter-returns')?.addEventListener('click', async () => {
      const status = document.getElementById('return-status-filter')?.value || '';
      const tbody = document.getElementById('returns-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">⏳</div><div class="d-empty-ttl">Loading…</div></div></td></tr>`;
      try {
        const res = await ApiService.getReturns({ page:0, size:20, status });
        const items = extractList(res);
        tbody.innerHTML = items.length ? items.map(r => `
          <tr>
            <td class="td-m">#${(r.id||'—').toString().slice(-8)}</td>
            <td class="td-m">#${(r.orderId||'—').toString().slice(-8)}</td>
            <td class="td-b">${r.customerName||'Customer'}</td>
            <td>${r.reason||'—'}</td>
            <td>${fmt.money(r.refundedAmount||r.refundAmount||0)}</td>
            <td>${statusBdg(r.status||'PENDING')}</td>
            <td class="td-sm">${fmt.date(r.createdAt)}</td>
            <td style="display:flex;gap:5px;flex-wrap:wrap">
              ${r.status==='PENDING'||!r.status ? `
                <button class="btn-d btn-d-success btn-d-sm" data-action="approve-return" data-id="${r.id}">Approve</button>
                <button class="btn-d btn-d-danger btn-d-sm" data-action="reject-return" data-id="${r.id}">Reject</button>
              ` : ''}
              <button class="btn-d btn-d-sec btn-d-sm" data-action="view-return" data-id="${r.id}">${I.eye} View</button>
            </td>
          </tr>`).join('') :
          `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">↩️</div><div class="d-empty-ttl">No results</div></div></td></tr>`;
      } catch(err) { tbody.innerHTML = `<tr><td colspan="8"><div class="d-alert d-alert-err">${err.message}</div></td></tr>`; }
    });
  }
  if (tab === 'shipments') {
    document.getElementById('btn-create-shipment')?.addEventListener('click', () => openDrawer('shipment', null));
    document.getElementById('btn-filter-shipments')?.addEventListener('click', async () => {
      const status = document.getElementById('shipment-status-filter')?.value || '';
      const tbody = document.getElementById('shipments-tbody');
      if (!tbody) return;
      tbody.innerHTML = `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">⏳</div><div class="d-empty-ttl">Loading…</div></div></td></tr>`;
      try {
        const res = await ApiService.getShipments({ page:0, size:20, status });
        const items = extractList(res);
        tbody.innerHTML = items.length ? items.map(s => {
          const isActive = !['DELIVERED','CANCELLED'].includes(s.status);
          return `<tr>
            <td class="td-m">${s.trackingNumber||'—'}</td>
            <td class="td-m">#${(s.orderId||'—').toString().slice(-8)}</td>
            <td class="td-b">${s.recipientName||s.customerName||'—'}</td>
            <td>${s.carrier||'—'}</td>
            <td>${statusBdg(s.status||'PENDING')}</td>
            <td class="td-sm">${fmt.date(s.estimatedDeliveryDate||s.estimatedDelivery)}</td>
            <td style="display:flex;gap:5px;flex-wrap:wrap">
              <button class="btn-d btn-d-sec btn-d-sm" data-action="view-shipment" data-id="${s.id}">${I.eye} Detail</button>
              ${isActive ? `<button class="btn-d btn-d-primary btn-d-sm" data-action="update-shipment-status" data-id="${s.id}" data-status="${s.status||'PENDING'}">Update</button>` : ''}
              ${isAdmin() && isActive ? `<button class="btn-d btn-d-danger btn-d-sm" data-action="cancel-shipment" data-id="${s.id}">Cancel</button>` : ''}
            </td>
          </tr>`;
        }).join('') :
          `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🚚</div><div class="d-empty-ttl">No shipments found</div></div></td></tr>`;
      } catch(err) { tbody.innerHTML = `<tr><td colspan="7"><div class="d-alert d-alert-err">${err.message}</div></td></tr>`; }
    });
  }
}

async function loadCategories(selectedId) {
  try {
    const cats = await ApiService.getCategories();
    const list = cats.content || cats || [];
    if (list.length) _categoryCache = list;

    const sel = document.getElementById('d-prod-cat');
    const filterSel = document.getElementById('product-cat-filter');

    [sel, filterSel].filter(Boolean).forEach(el => {
      const existing = new Set([...el.options].map(o => o.value));
      list.forEach(c => {
        if (!existing.has(String(c.id))) {
          const o = document.createElement('option');
          o.value = c.id; o.textContent = c.name;
          el.appendChild(o);
        }
      });
    });

    if (sel && selectedId) sel.value = selectedId;
  } catch(_){}
}

async function viewOrderDetail(id) {
  let order = {};
  try { order = await ApiService.getOrder(id); } catch(_){}
  document.getElementById('d-drawer-title').textContent = `Order #${id}`;
  document.getElementById('d-drawer-body').innerHTML = `
    <div class="d-alert d-alert-info">Customer: <b>${order.customerName||order.userName||'—'}</b> · ${order.email||''}</div>
    <div class="d-tabs" style="margin-bottom:14px">
      <button class="d-tab active">Items</button>
      <button class="d-tab">Timeline</button>
    </div>
    <div>
      ${(order.items||order.orderItems||[{name:'Item',quantity:1,price:0}]).map(i=>`
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9">
          <span>${i.productName||i.name}</span>
          <span>× ${i.quantity} <b style="margin-left:8px">${fmt.money((i.price||0)*(i.quantity||1))}</b></span>
        </div>`).join('')}
      <div style="display:flex;justify-content:space-between;padding:12px 0 0;font-weight:700;font-size:14px"><span>Total</span><span>${fmt.money(order.totalAmount||order.total||0)}</span></div>
    </div>
    <div class="f-field" style="margin-top:16px"><label class="f-lbl">Update Status</label>
      <select class="f-sel" id="order-status-upd">
        ${['PENDING','PROCESSING','FULFILLED','DELIVERED','CANCELLED','REFUNDED'].map(s=>`<option ${order.status===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>`;
  document.getElementById('d-drawer-footer').innerHTML = `<button class="btn-d btn-d-sec" id="d-btn-cancel">Cancel</button><button class="btn-d btn-d-primary" id="order-status-save">Update Status</button>`;
  document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
  document.getElementById('order-status-save')?.addEventListener('click', async () => {
    const status = document.getElementById('order-status-upd').value;
    await ApiService.updateOrderStatus(id, { status }).catch(()=>{});
    showToast('Order updated'); closeDrawer(); loadTab('orders');
  });
  document.getElementById('d-overlay').classList.add('open');
  document.getElementById('d-drawer').classList.add('open');
}

async function viewCustomer(id) {
  let cust = {};
  try { cust = await ApiService.getCustomer(id); } catch(_){}
  document.getElementById('d-drawer-title').textContent = `${cust.firstName||''} ${cust.lastName||''}`.trim() || 'Customer';
  document.getElementById('d-drawer-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div class="d-widget"><div style="font-size:11px;color:#64748B;font-weight:600;margin-bottom:4px">TOTAL SPENT</div><div style="font-size:20px;font-weight:800;color:#FF6B00">${fmt.money(cust.totalSpent||0)}</div></div>
      <div class="d-widget"><div style="font-size:11px;color:#64748B;font-weight:600;margin-bottom:4px">ORDERS</div><div style="font-size:20px;font-weight:800">${cust.orderCount||cust.totalOrders||0}</div></div>
    </div>
    <div class="d-widget" style="margin-bottom:14px">
      <div class="d-widget-ttl">Contact Info</div>
      <div class="fin-metric"><span class="fin-metric-lbl">Email</span><span>${cust.email||'—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Phone</span><span>${cust.phone||'—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Joined</span><span>${fmt.date(cust.createdAt)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Status</span><span>${statusBdg(cust.status||'ACTIVE')}</span></div>
    </div>`;
  document.getElementById('d-drawer-footer').innerHTML = `<button class="btn-d btn-d-sec" id="d-btn-cancel">Close</button>`;
  document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
  document.getElementById('d-overlay').classList.add('open');
  document.getElementById('d-drawer').classList.add('open');
}

// ── Return detail ─────────────────────────────────────────
async function viewReturnDetail(id) {
  let ret = {};
  try { const res = await ApiService.returns.getAll(); ret = (res.content||res||[]).find(r=>r.id===id)||{}; } catch(_){}
  document.getElementById('d-drawer-title').textContent = `Return #${(id||'').toString().slice(-8)}`;
  const canRefund = ret.status === 'APPROVED' && !ret.refundedAmount;
  const canComplete = ret.status === 'APPROVED' && ret.refundedAmount;
  document.getElementById('d-drawer-body').innerHTML = `
    <div class="d-alert d-alert-info" style="margin-bottom:14px">
      <b>Order:</b> #${(ret.orderId||'—').toString().slice(-8)} &nbsp;|&nbsp;
      <b>Status:</b> ${ret.status||'PENDING'}
    </div>
    <div class="d-widget" style="margin-bottom:14px">
      <div class="d-widget-ttl">Details</div>
      <div class="fin-metric"><span class="fin-metric-lbl">Reason</span><span>${ret.reason||'—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Refunded</span><span>${fmt.money(ret.refundedAmount||0)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Admin Notes</span><span>${ret.adminNotes||'—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Created</span><span>${fmt.date(ret.createdAt)}</span></div>
    </div>
    ${canRefund ? `
      <div class="dash-chart-hd" style="margin-bottom:8px">Process Refund</div>
      <div class="f-field"><label class="f-lbl">Refund Amount</label><input class="f-inp" type="number" id="ret-refund-amt" placeholder="0.00" step="0.01"></div>
      <div class="f-field"><label class="f-lbl">Admin Notes</label><textarea class="f-ta" id="ret-refund-notes" style="min-height:60px"></textarea></div>
      <button class="btn-d btn-d-primary" id="btn-process-refund" style="width:100%;margin-bottom:10px">Process Refund</button>
    ` : ''}
    ${canComplete ? `
      <div class="dash-chart-hd" style="margin-bottom:8px">Complete Return</div>
      <div class="f-field"><label class="f-lbl">Final Refund Amount</label><input class="f-inp" type="number" id="ret-complete-amt" value="${ret.refundedAmount||0}" step="0.01"></div>
      <div class="f-field"><label class="f-lbl">Refund Reference</label><input class="f-inp" id="ret-complete-ref" placeholder="Transaction reference…"></div>
      <div class="f-field"><label class="f-lbl">Admin Notes</label><textarea class="f-ta" id="ret-complete-notes" style="min-height:60px"></textarea></div>
      <button class="btn-d btn-d-success" id="btn-complete-return" style="width:100%;margin-bottom:10px">Mark Complete</button>
    ` : ''}
    <button class="btn-d btn-d-sec" id="btn-sync-refund" style="width:100%;margin-bottom:6px;font-size:12px">Sync Refund Status</button>
    <div id="ret-action-msg" style="font-size:12px;margin-top:6px;display:none"></div>`;

  const msgEl = () => document.getElementById('ret-action-msg');
  const showMsg = (txt, ok=true) => { const el=msgEl(); if(el){ el.textContent=txt; el.style.color=ok?'#065F46':'#991B1B'; el.style.display=''; } };

  document.getElementById('btn-process-refund')?.addEventListener('click', async () => {
    const amt = parseFloat(document.getElementById('ret-refund-amt')?.value)||0;
    const notes = document.getElementById('ret-refund-notes')?.value||'';
    if (!amt) { showMsg('Enter a refund amount', false); return; }
    try {
      await ApiService.returns.refund(id, amt, notes);
      showMsg('Refund submitted'); setTimeout(()=>{ closeDrawer(); loadTab('returns'); },1200);
    } catch(e) { showMsg(e.message||'Failed', false); }
  });

  document.getElementById('btn-complete-return')?.addEventListener('click', async () => {
    const refundedAmount = parseFloat(document.getElementById('ret-complete-amt')?.value)||0;
    const refundReference = document.getElementById('ret-complete-ref')?.value||'';
    const adminNotes = document.getElementById('ret-complete-notes')?.value||'';
    try {
      await ApiService.returns.complete(id, { refundedAmount, refundReference, adminNotes });
      showMsg('Return completed'); setTimeout(()=>{ closeDrawer(); loadTab('returns'); },1200);
    } catch(e) { showMsg(e.message||'Failed', false); }
  });

  document.getElementById('btn-sync-refund')?.addEventListener('click', async () => {
    try { await ApiService.syncRefundStatus(id); showMsg('Refund status synced'); } catch(e) { showMsg(e.message||'Sync failed', false); }
  });

  document.getElementById('d-drawer-footer').innerHTML = `<button class="btn-d btn-d-sec" id="d-btn-cancel" style="width:100%">Close</button>`;
  document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
  document.getElementById('d-overlay').classList.add('open');
  document.getElementById('d-drawer').classList.add('open');
}

// ── Shipment detail ───────────────────────────────────────
async function viewShipmentDetail(id) {
  let s = {};
  try { const res = await ApiService.getShipment(id); s = res.data || res || {}; } catch(_){}
  document.getElementById('d-drawer-title').textContent = `Shipment ${s.trackingNumber||id}`;
  document.getElementById('d-drawer-body').innerHTML = `
    <div class="d-widget" style="margin-bottom:14px">
      <div class="d-widget-ttl">Shipment Info</div>
      <div class="fin-metric"><span class="fin-metric-lbl">Tracking #</span><span>${s.trackingNumber||'—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Order</span><span>#${(s.orderId||'—').toString().slice(-8)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Carrier</span><span>${s.carrier||'—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Status</span><span>${statusBdg(s.status||'—')}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">ETA</span><span>${fmt.date(s.estimatedDeliveryDate||s.estimatedDelivery)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Delivered</span><span>${s.actualDeliveryDate ? fmt.date(s.actualDeliveryDate) : '—'}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Recipient</span><span>${s.recipientName||s.customerName||'—'}</span></div>
    </div>`;
  document.getElementById('d-drawer-footer').innerHTML = `<button class="btn-d btn-d-sec" id="d-btn-cancel" style="flex:1">Close</button>`;
  document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
  document.getElementById('d-overlay').classList.add('open');
  document.getElementById('d-drawer').classList.add('open');
}

// ── Security tab bindings ─────────────────────────────────
function bindSecurityTab() {
  document.getElementById('btn-save-security')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-security');
    const msgEl = document.getElementById('sec-save-msg');
    const showMsg = (txt, ok=true) => { if(msgEl){ msgEl.textContent=txt; msgEl.style.color=ok?'#065F46':'#991B1B'; msgEl.style.display=''; } };

    const minLen = parseInt(document.getElementById('sec-pwd-min')?.value)||8;
    if (minLen < 6 || minLen > 128) { showMsg('Min length must be 6–128', false); return; }
    const session = parseInt(document.getElementById('sec-session')?.value)||60;
    if (session < 5 || session > 43200) { showMsg('Session timeout must be 5–43200', false); return; }
    const maxFail = parseInt(document.getElementById('sec-max-fail')?.value)||5;
    if (maxFail < 1 || maxFail > 20) { showMsg('Max failed attempts must be 1–20', false); return; }
    const lockout = parseInt(document.getElementById('sec-lockout')?.value)||15;
    if (lockout < 1 || lockout > 1440) { showMsg('Lockout must be 1–1440', false); return; }

    const payload = {
      mfaRequired:                    document.getElementById('sec-mfa')?.checked ?? false,
      passwordMinLength:              minLen,
      passwordRequireUppercase:       document.getElementById('sec-pwd-upper')?.checked ?? true,
      passwordRequireLowercase:       document.getElementById('sec-pwd-lower')?.checked ?? true,
      passwordRequireDigit:           document.getElementById('sec-pwd-digit')?.checked ?? true,
      passwordRequireSpecialCharacter:document.getElementById('sec-pwd-special')?.checked ?? false,
      maxFailedLoginAttempts:         maxFail,
      lockoutDurationMinutes:         lockout,
      sessionTimeoutMinutes:          session,
    };

    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await ApiService.saveSecuritySettings(payload);
      showMsg('Settings saved successfully');
    } catch(e) { showMsg(e.message||'Save failed', false); }
    finally { btn.disabled = false; btn.textContent = 'Save Settings'; }
  });

  document.getElementById('btn-unlock-user')?.addEventListener('click', async () => {
    const uid = document.getElementById('sec-unlock-uid')?.value?.trim();
    const msgEl = document.getElementById('sec-unlock-msg');
    const showMsg = (txt, ok=true) => { if(msgEl){ msgEl.textContent=txt; msgEl.style.color=ok?'#065F46':'#991B1B'; msgEl.style.display=''; } };
    if (!uid) { showMsg('Enter a User ID', false); return; }
    const btn = document.getElementById('btn-unlock-user');
    btn.disabled = true; btn.textContent = 'Unlocking…';
    try {
      await ApiService.unlockUser(uid);
      showMsg(`User ${uid} unlocked`);
      document.getElementById('sec-unlock-uid').value = '';
    } catch(e) { showMsg(e.message||'Unlock failed', false); }
    finally { btn.disabled = false; btn.textContent = 'Unlock'; }
  });
}

// ── System tab bindings ───────────────────────────────────
function bindSystemTab() {
  document.getElementById('btn-trigger-backup')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-trigger-backup');
    const txt = document.getElementById('backup-btn-txt');
    const msgEl = document.getElementById('backup-status-msg');
    btn.disabled = true; if(txt) txt.textContent = 'Starting backup…';
    if(msgEl){ msgEl.style.display=''; msgEl.style.color='#1E40AF'; msgEl.textContent='Contacting backup service…'; }
    try {
      const res = await ApiService.triggerBackup();
      const bkp = res.data || res || {};
      if(msgEl){ msgEl.style.color='#065F46'; msgEl.textContent=`Backup created at ${new Date().toLocaleTimeString()}`; }
      const hist = document.getElementById('backup-history');
      if(hist) hist.insertAdjacentHTML('afterbegin', `
        <div class="d-widget-row">
          <div style="font-size:12px"><div style="font-weight:600">Just now</div><div style="color:#94A3B8">${bkp.status||'COMPLETED'}</div></div>
          <button class="btn-d btn-d-sec btn-d-sm" data-action="restore-backup" data-id="${bkp.id||''}" style="margin-left:auto">Restore</button>
        </div>`);
    } catch(e) {
      if(msgEl){ msgEl.style.color='#991B1B'; msgEl.textContent=e.message||'Backup failed'; }
    } finally { btn.disabled=false; if(txt) txt.textContent='Trigger Backup Now'; }
  });

  document.getElementById('btn-save-config')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-config');
    const msgEl = document.getElementById('sys-cfg-msg');
    const showMsg = (txt, ok=true) => { if(msgEl){ msgEl.textContent=txt; msgEl.style.color=ok?'#065F46':'#991B1B'; msgEl.style.display=''; } };

    const key   = document.getElementById('sys-cfg-key')?.value?.trim();
    const value = document.getElementById('sys-cfg-val')?.value?.trim();
    const cat   = document.getElementById('sys-cfg-cat')?.value?.trim()||null;
    const desc  = document.getElementById('sys-cfg-desc')?.value?.trim()||null;

    if (!key)   { showMsg('Key is required', false); return; }
    if (!value) { showMsg('Value is required', false); return; }

    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await ApiService.saveSystemConfiguration(key, { configValue: value, category: cat, description: desc, sensitive: false });
      showMsg(`Configuration "${key}" saved`);
      document.getElementById('sys-cfg-key').value  = '';
      document.getElementById('sys-cfg-val').value  = '';
      document.getElementById('sys-cfg-cat').value  = '';
      document.getElementById('sys-cfg-desc').value = '';
      setTimeout(() => loadTab('system'), 1500);
    } catch(e) { showMsg(e.message||'Save failed', false); }
    finally { btn.disabled=false; btn.textContent='Save Configuration'; }
  });
}

// ── Support tab ───────────────────────────────────────────
let _supActiveChatId = null;

function bindSupportTab() {
  // Tab switching (Tickets / Live Chat)
  document.querySelectorAll('.sup-list-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sup-list-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const which = btn.dataset.supTab;
      document.getElementById('sup-tab-tickets').style.display = which === 'tickets' ? '' : 'none';
      document.getElementById('sup-tab-chats').style.display   = which === 'chats'   ? '' : 'none';
    });
  });

  // Ticket click → load messages (REST, no real-time needed for tickets)
  document.querySelectorAll('.sup-item[data-ticket-id]').forEach(el => {
    el.addEventListener('click', async () => {
      // Disconnect any active chat WS
      if (_supActiveChatId) {
        unsubscribeWS(`/topic/live-chat/${_supActiveChatId}`);
        _supActiveChatId = null;
      }
      document.querySelectorAll('.sup-item').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      const ticketId = el.dataset.ticketId;
      const panel = document.getElementById('sup-chat-panel');
      panel.innerHTML = `<div style="padding:20px;color:#94A3B8">Loading…</div>`;
      try {
        const [tRes, msgRes] = await Promise.all([
          ApiService.getSupportTicket(ticketId),
          ApiService.support.getTicketMessages(ticketId)
        ]);
        const ticket = tRes.data || tRes;
        const msgs = msgRes.data || [];
        const customerName = ticket.customer
          ? `${ticket.customer.firstName||''} ${ticket.customer.lastName||''}`.trim()
          : 'Customer';
        panel.innerHTML = `
          <div class="sup-chat-hd">
            <div class="dash-user-av">${customerName[0]||'C'}</div>
            <div><div style="font-size:13px;font-weight:700">${ticket.title||ticket.subject||'Ticket'}</div><div style="font-size:11px;color:#94A3B8">${customerName}</div></div>
            ${statusBdg(ticket.status||'OPEN')}
            <div style="margin-left:auto;display:flex;gap:6px">
              <button class="btn-d btn-d-success btn-d-sm" id="btn-resolve-ticket" data-id="${ticketId}">Resolve</button>
            </div>
          </div>
          <div class="sup-messages" id="sup-msgs">
            ${msgs.length ? msgs.map(m => {
              const isAgent = m.sender?.roles?.some(r => (r.name||r||'').includes('AGENT') || (r.name||r||'').includes('ADMIN')) ?? false;
              return `<div><div class="sup-bubble ${isAgent?'agent':'customer'}">${m.message||m.content||''}</div><div style="font-size:10px;color:#94A3B8;text-align:${isAgent?'right':'left'};margin-top:3px">${fmt.ago(m.createdAt)}</div></div>`;
            }).join('') : '<div style="text-align:center;color:#94A3B8;padding:24px">No messages yet</div>'}
          </div>
          <div class="sup-inp-row">
            <textarea id="sup-reply" placeholder="Type your reply…"></textarea>
            <button class="btn-d btn-d-primary" id="sup-send">Send</button>
          </div>`;
        document.getElementById('sup-send')?.addEventListener('click', async () => {
          const msg = document.getElementById('sup-reply')?.value?.trim();
          if (!msg) return;
          await ApiService.replyToTicket(ticketId, { message: msg }).catch(() => {});
          document.getElementById('sup-reply').value = '';
          const box = document.getElementById('sup-msgs');
          if (box) { box.innerHTML += `<div><div class="sup-bubble agent">${msg}</div><div style="font-size:10px;color:#94A3B8;text-align:right;margin-top:3px">just now</div></div>`; box.scrollTop = box.scrollHeight; }
        });
        document.getElementById('btn-resolve-ticket')?.addEventListener('click', async () => {
          await ApiService.resolveTicket(ticketId).catch(() => {});
          showToast('Ticket resolved'); loadTab('support');
        });
        document.getElementById('sup-msgs').scrollTop = 99999;
      } catch(_) { panel.innerHTML = `<div class="d-alert d-alert-err" style="margin:16px">Failed to load ticket</div>`; }
    });
  });

  // Live chat session click → real-time STOMP chat
  document.querySelectorAll('.sup-item[data-chat-id]').forEach(el => {
    el.addEventListener('click', async () => {
      document.querySelectorAll('.sup-item').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      const sessionId = el.dataset.chatId;
      const panel = document.getElementById('sup-chat-panel');
      panel.innerHTML = `<div style="padding:20px;color:#94A3B8">Loading chat…</div>`;

      try {
        const msgRes = await ApiService.chat.getMessages(sessionId);
        const msgs = msgRes.data || [];
        const me = ApiService.getCurrentUser();

        panel.innerHTML = `
          <div class="sup-chat-hd">
            <div class="dash-user-av">💬</div>
            <div>
              <div style="font-size:13px;font-weight:700" id="sup-chat-subject">Live Chat</div>
              <div style="font-size:11px;color:#94A3B8" id="sup-chat-status-label">Loading…</div>
            </div>
            <div style="margin-left:auto;display:flex;gap:6px">
              <button class="btn-d btn-d-sm" id="btn-assign-self" style="background:#EFF6FF;color:#3B82F6;border-color:#BFDBFE">Join as Agent</button>
              <button class="btn-d btn-d-sm" id="btn-close-chat" style="background:#FFF1F2;color:#EF4444;border-color:#FECACA">Close Chat</button>
            </div>
          </div>
          <div class="sup-messages" id="sup-msgs-live">
            ${msgs.map(m => {
              const isMe = m.senderId === me?.id;
              const lbl = !isMe ? `<div style="font-size:10px;opacity:.6;margin-bottom:2px">${(m.senderEmail||'').split('@')[0]}</div>` : '';
              return `<div style="display:flex;flex-direction:column;align-items:${isMe?'flex-end':'flex-start'};margin-bottom:8px">${lbl}<div class="sup-bubble ${isMe?'agent':'customer'}">${m.message||''}</div></div>`;
            }).join('') || '<div style="text-align:center;color:#94A3B8;padding:24px">No messages yet</div>'}
          </div>
          <div class="sup-inp-row">
            <textarea id="sup-live-reply" placeholder="Type a message…" ${msgs.length === 0 ? '' : ''}></textarea>
            <button class="btn-d btn-d-primary" id="sup-live-send">Send</button>
          </div>`;

        // Load session info for header
        ApiService.chat.getSessions().then(r => {
          const sessions = r.data || [];
          const session = sessions.find(s => s.id === sessionId);
          if (session) {
            const subEl = document.getElementById('sup-chat-subject');
            const stEl  = document.getElementById('sup-chat-status-label');
            if (subEl) subEl.textContent = session.subject || 'Live Chat';
            if (stEl)  stEl.textContent  = session.status + (session.agent ? ` · Agent: ${session.agent.firstName||session.agent.email}` : ' · Unassigned');
          }
        }).catch(() => {});

        document.getElementById('sup-msgs-live').scrollTop = 99999;

        // Send button
        document.getElementById('sup-live-send')?.addEventListener('click', async () => {
          const ta = document.getElementById('sup-live-reply');
          const msg = ta?.value?.trim();
          if (!msg) return;
          ta.value = '';
          await ApiService.chat.sendMessage(sessionId, msg).catch(() => {});
        });

        // Join / assign self as agent
        document.getElementById('btn-assign-self')?.addEventListener('click', async () => {
          if (!me?.id) return;
          await ApiService.chat.assignSession(sessionId, me.id).catch(e => showToast(e.message, 'error'));
          const stEl = document.getElementById('sup-chat-status-label');
          if (stEl) stEl.textContent = 'ASSIGNED · You are the agent';
          showToast('You joined this chat as agent');
        });

        // Close session
        document.getElementById('btn-close-chat')?.addEventListener('click', async () => {
          if (!confirm('Close this chat session?')) return;
          await ApiService.chat.closeSession(sessionId).catch(() => {});
          if (_supActiveChatId) { unsubscribeWS(`/topic/live-chat/${_supActiveChatId}`); _supActiveChatId = null; }
          showToast('Chat closed');
          loadTab('support');
        });

        // Subscribe via STOMP for real-time messages
        if (_supActiveChatId && _supActiveChatId !== sessionId) {
          unsubscribeWS(`/topic/live-chat/${_supActiveChatId}`);
        }
        _supActiveChatId = sessionId;

        connectWS(() => {
          subscribeWS(`/topic/live-chat/${sessionId}`, (msgData) => {
            const isMe = msgData.senderId === me?.id;
            const box = document.getElementById('sup-msgs-live');
            if (!box) return;
            const lbl = !isMe ? `<div style="font-size:10px;opacity:.6;margin-bottom:2px">${(msgData.senderEmail||'').split('@')[0]}</div>` : '';
            box.innerHTML += `<div style="display:flex;flex-direction:column;align-items:${isMe?'flex-end':'flex-start'};margin-bottom:8px">${lbl}<div class="sup-bubble ${isMe?'agent':'customer'}">${msgData.message||''}</div></div>`;
            box.scrollTop = box.scrollHeight;
          });
          // Watch for session updates (e.g. close)
          subscribeWS('/topic/live-chat/sessions', (session) => {
            if (session.id === sessionId && session.status === 'CLOSED') {
              showToast('Chat session was closed');
              loadTab('support');
            }
          });
        });

      } catch(_) { panel.innerHTML = `<div class="d-alert d-alert-err" style="margin:16px">Failed to load chat</div>`; }
    });
  });

  // Real-time: new sessions notification for agents
  connectWS(() => {
    subscribeWS('/topic/live-chat/sessions', (session) => {
      if (session.status === 'OPEN') {
        showToast(`New live chat: "${session.subject || 'Session'}"`, 'info');
      }
    });
  });
}

// ── POS ───────────────────────────────────────────────────
let posCart = [];
let posFoundCustomerId = null;

function bindPOS() {
  document.getElementById('pos-grid')?.addEventListener('click', e => {
    const prod = e.target.closest('[data-pos-id]');
    if (!prod) return;
    const { posId: id, posName: name, posPrice: price } = prod.dataset;
    const existing = posCart.find(x => x.id === id);
    if (existing) existing.qty++;
    else posCart.push({ id, name, price: parseFloat(price)||0, qty: 1 });
    renderCart();
  });

  document.getElementById('pos-cart-items')?.addEventListener('click', e => {
    const plus  = e.target.closest('[data-pos-plus]');
    const minus = e.target.closest('[data-pos-minus]');
    if (plus)  { const item = posCart.find(x=>x.id===plus.dataset.posPlus);   if(item) { item.qty++; renderCart(); } }
    if (minus) { const item = posCart.find(x=>x.id===minus.dataset.posMinus); if(item) { item.qty--; if(item.qty<=0) posCart=posCart.filter(x=>x.id!==item.id); renderCart(); } }
  });

  document.getElementById('pos-clear')?.addEventListener('click', () => {
    posCart = [];
    posFoundCustomerId = null;
    const info = document.getElementById('pos-customer-info');
    if (info) info.textContent = '';
    const emailEl = document.getElementById('pos-customer-email');
    if (emailEl) emailEl.value = '';
    renderCart();
  });

  // Customer lookup
  document.getElementById('pos-lookup-customer')?.addEventListener('click', async () => {
    const email = document.getElementById('pos-customer-email')?.value?.trim();
    const info  = document.getElementById('pos-customer-info');
    if (!email || !info) return;
    info.textContent = 'Looking up…';
    info.style.color = '#64748B';
    try {
      const res = await ApiService.getCustomers({ page:0, size:1 });
      const list = extractList(res);
      const found = list.find(c => (c.email||'').toLowerCase() === email.toLowerCase());
      if (found) {
        posFoundCustomerId = found.id;
        info.textContent = `✓ Found: ${found.firstName||''} ${found.lastName||''}`;
        info.style.color = '#10B981';
      } else {
        posFoundCustomerId = null;
        info.textContent = 'Customer not found — will process as walk-in';
        info.style.color = '#F59E0B';
      }
    } catch(_) {
      posFoundCustomerId = null;
      info.textContent = 'Lookup failed — will process as walk-in';
      info.style.color = '#EF4444';
    }
  });

  document.getElementById('pos-checkout')?.addEventListener('click', async () => {
    const errEl = document.getElementById('pos-checkout-err');
    const hide  = () => { if(errEl) errEl.style.display='none'; };
    const show  = (msg) => { if(errEl){ errEl.textContent=msg; errEl.style.display=''; } };
    hide();

    if (!posCart.length) { show('Add at least one product to the cart.'); return; }

    const paymentMethod = document.getElementById('pos-payment-method')?.value;
    if (!paymentMethod) { show('Payment method is required.'); return; }

    const paymentReference = document.getElementById('pos-payment-ref')?.value?.trim() || null;
    const payload = {
      paymentMethod,
      paymentReference,
      items: posCart.map(item => ({ productId: item.id, quantity: item.qty })),
    };
    if (posFoundCustomerId) payload.customerId = posFoundCustomerId;

    const btn = document.getElementById('pos-checkout');
    btn.disabled = true; btn.textContent = 'Processing…';
    try {
      const res = await ApiService.posCheckout(payload);
      const receipt = res.data || res || {};
      posCart = [];
      posFoundCustomerId = null;
      const info = document.getElementById('pos-customer-info');
      if (info) info.textContent = '';
      const emailEl = document.getElementById('pos-customer-email');
      if (emailEl) emailEl.value = '';
      renderCart();
      showPOSReceipt(receipt);
      // Refresh history table
      refreshPOSHistory();
    } catch(e) {
      show(e.message || 'Checkout failed. Please try again.');
    } finally {
      btn.disabled = false;
      renderCart();
    }
  });

  document.getElementById('pos-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.pos-prod').forEach(el => {
      el.style.display = el.querySelector('.pos-prod-name').textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  document.getElementById('pos-reload-history')?.addEventListener('click', refreshPOSHistory);

  // Receipt from history
  document.getElementById('pos-history-tbody')?.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="pos-receipt"]');
    if (!btn) return;
    btn.disabled = true; btn.textContent = '…';
    try {
      const res = await ApiService.getPOSReceipt(btn.dataset.id);
      const receipt = res.data || res || {};
      showPOSReceipt(receipt);
    } catch(_) { showToast('Could not load receipt', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = `${I.eye} Receipt`; }
  });
}

async function refreshPOSHistory() {
  const tbody = document.getElementById('pos-history-tbody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#94A3B8">Loading…</td></tr>`;
  try {
    const res = await ApiService.getPOSHistory({ page:0, size:10 });
    const raw = res?.data || res;
    const history = raw?.content || (Array.isArray(raw) ? raw : []);
    tbody.innerHTML = history.length ? history.map(t => `
      <tr>
        <td class="td-m">${t.orderNumber||'—'}</td>
        <td>${t.cashierEmail||'—'}</td>
        <td>${t.customerEmail||'Walk-in'}</td>
        <td>${(t.paymentMethod||'—').replace(/_/g,' ')}</td>
        <td style="font-weight:700">${fmt.money(t.totalAmount||0)}</td>
        <td>${fmt.num(t.itemCount||0)}</td>
        <td class="td-sm">${fmt.date(t.soldAt)}</td>
        <td><button class="btn-d btn-d-sm" data-action="pos-receipt" data-id="${t.orderId}">${I.eye} Receipt</button></td>
      </tr>`).join('') :
      `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">🧾</div><div class="d-empty-ttl">No transactions yet</div></div></td></tr>`;
  } catch(_) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#EF4444">Failed to load history</td></tr>`;
  }
}
function posTotal() { return posCart.reduce((a,b)=>a+b.price*b.qty,0); }
function renderCart() {
  const items = document.getElementById('pos-cart-items');
  const sub   = posTotal();
  const tax   = sub * 0.18; // matches backend app.tax.sales-rate
  const total = sub + tax;
  if (!posCart.length) {
    if (items) items.innerHTML = `<div class="d-empty" style="padding:32px 16px"><div class="d-empty-ico" style="font-size:28px">🛒</div><div class="d-empty-ttl" style="font-size:13px">Cart is empty</div></div>`;
  } else {
    if (items) items.innerHTML = posCart.map(item => `
      <div class="pos-cart-item">
        <span class="pos-cart-name">${item.name}</span>
        <button class="pos-qty-btn" data-pos-minus="${item.id}">−</button>
        <span style="font-size:13px;font-weight:700;min-width:20px;text-align:center">${item.qty}</span>
        <button class="pos-qty-btn" data-pos-plus="${item.id}">+</button>
        <span class="pos-item-price">${fmt.money(item.price*item.qty)}</span>
      </div>`).join('');
  }
  const subEl = document.getElementById('pos-sub');
  const taxEl = document.getElementById('pos-tax');
  const totEl = document.getElementById('pos-total');
  if (subEl) subEl.textContent = fmt.money(sub);
  if (taxEl) taxEl.textContent = fmt.money(tax) + ' (est.)';
  if (totEl) totEl.textContent = fmt.money(total);
  const btn = document.getElementById('pos-checkout');
  if (btn) btn.textContent = `Charge ${fmt.money(total)}`;
}

// ── POS receipt modal ─────────────────────────────────────
function showPOSReceipt(receipt) {
  const items = receipt.items || [];
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10000;display:flex;align-items:center;justify-content:center';
  el.innerHTML = `
    <div style="background:#fff;border-radius:14px;padding:28px 24px;width:380px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.25)">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:28px">🧾</div>
        <div style="font-size:16px;font-weight:800;margin-top:4px">Sale Complete</div>
        <div style="font-size:12px;color:#64748B">Order #${receipt.orderNumber||receipt.orderId||'—'}</div>
      </div>
      <div style="border-top:1px dashed #E2E8F0;border-bottom:1px dashed #E2E8F0;padding:12px 0;margin-bottom:14px">
        ${items.length ? items.map(i=>`
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span>${i.productName||'Product'} × ${i.quantity}</span>
            <span>${fmt.money(i.subTotal||((i.unitPrice||0)*(i.quantity||1)))}</span>
          </div>`).join('') : '<div style="font-size:13px;color:#94A3B8;text-align:center">Items processed successfully.</div>'}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;margin-bottom:8px">
        <span>Total Charged</span><span style="color:#FF6B00">${fmt.money(receipt.totalAmount||0)}</span>
      </div>
      <div style="font-size:12px;color:#64748B;margin-bottom:4px">Payment: ${(receipt.paymentMethod||'—').replace(/_/g,' ')}</div>
      ${receipt.paymentReference ? `<div style="font-size:12px;color:#64748B;margin-bottom:4px">Ref: ${receipt.paymentReference}</div>` : ''}
      <div style="font-size:12px;color:#64748B;margin-bottom:16px">Cashier: ${receipt.cashierEmail||'—'}</div>
      <button style="width:100%;padding:10px;background:#FF6B00;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px" id="pos-receipt-close">Done</button>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('#pos-receipt-close').onclick = () => el.remove();
  el.onclick = (e) => { if(e.target === el) el.remove(); };
}

// ── Reports ───────────────────────────────────────────────
function downloadReport(type, format) {
  showToast(`Preparing ${type} report as ${format}…`);
  setTimeout(() => {
    const a = document.createElement('a');
    a.download = `${type}-report.${format.toLowerCase()}`;
    a.href = 'data:text/plain,Report data';
    a.click();
  }, 800);
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type='info') {
  const existing = document.getElementById('dash-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'dash-toast';
  const colors = { success:'#ECFDF5;color:#065F46;border-color:#A7F3D0', error:'#FEF2F2;color:#991B1B;border-color:#FECACA', info:'#EFF6FF;color:#1E40AF;border-color:#BFDBFE' };
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.12);border:1px solid;background:${colors[type]||colors.info};animation:dashFade 0.2s ease-out`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
