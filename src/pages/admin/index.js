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
    { id:'inventory',    label:'Inventory',    icon:I.pkg },
    { id:'suppliers',    label:'Suppliers',    icon:I.users },
    { id:'procurement',  label:'Procurement',  icon:I.truck },
    { id:'returns',      label:'Returns',     icon:I.rotate,  badge:'returns' },
    { id:'fulfillment',  label:'Fulfillment', icon:I.pkg },
    { id:'shipments',    label:'Shipments',   icon:I.truck },
    { section: 'Sales' },
    { id:'pos',      label:'Point of Sale', icon:I.pos },
    { id:'coupons',   label:'Coupons',   icon:I.percent },
    { id:'discounts', label:'Discounts', icon:I.tag },
    { id:'banners',   label:'Banners',   icon:I.img },
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
let _auditCache       = [];
let _productCache     = [];
let _categoryCache    = [];
let _supplierCache    = [];
let _procurementCache = [];
let _movementCache    = [];
let _lowStockCache    = [];
let _invRefreshTimer  = null;
let _discountCache    = [];
let _finSubTab        = 'overview';
let _expenseCache     = [];
let _finDateFrom      = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
let _finDateTo        = new Date().toISOString().slice(0, 10);

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
  const titles = { product:'Product', order:'Order Detail', coupon:'Coupon', banner:'Banner', user:'User', customer:'Customer', adjust:'Adjust Stock', ticket:'Support Ticket', shipment:'Shipment', 'shipment-status':'Shipment Status', 'return-action':'Return Review', supplier:'Supplier', procurement:'Procurement Order', 'inv-threshold':'Stock Threshold', 'receive-po':'Receive Stock' };
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

function esc(s) { return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
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
  let totalRevenue = null;
  try {
    const [kpiRes, rm, totalRevRes] = await Promise.allSettled([
      ApiService.analytics.getKPIs({ startDate: sd, endDate: ed }),
      ApiService.getRevenueByMonth({ startDate: sd, endDate: ed }),
      ApiService.getTotalRevenue({ startDate: sd, endDate: ed }),
    ]);
    if (kpiRes.status === 'fulfilled' && kpiRes.value) {
      stats = kpiRes.value.data || kpiRes.value || {};
      // Extract nested data from KPI dashboard response
      if (stats.orderStatusBreakdown && typeof stats.orderStatusBreakdown === 'object') {
        ordersByStatus = Object.entries(stats.orderStatusBreakdown).map(([label, value]) => ({ label, value: Number(value)||0 }));
      }
      if (Array.isArray(stats.topSellingProducts)) topProducts = stats.topSellingProducts;
      if (stats.customerAnalytics)  customerCount = stats.customerAnalytics.totalCustomers || stats.activeCustomers || 0;
      if (stats.inventoryAnalytics) invAnalytics  = stats.inventoryAnalytics;
      if (Array.isArray(stats.salesTrend)) {
        revenueByMonth = stats.salesTrend.map(d => ({ month: (d.period||d.date||'').slice(5), revenue: Number(d.revenue||d.totalRevenue)||0 }));
      }
    }
    if (rm.status === 'fulfilled' && rm.value) {
      const raw = rm.value.data || rm.value;
      if (Array.isArray(raw) && raw.length) revenueByMonth = raw.map(d => ({ month: (d.month||'').slice(5), revenue: Number(d.revenue)||0 }));
    }
    if (totalRevRes.status === 'fulfilled' && totalRevRes.value != null) {
      const rv = totalRevRes.value?.data ?? totalRevRes.value;
      if (rv != null) totalRevenue = Number(rv);
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
  const revDisplay = totalRevenue != null ? fmt.money(totalRevenue) : fmt.money(stats.totalRevenue||0);
  container.innerHTML = `
  ${totalRevenue != null ? `
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:16px;padding:20px 28px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 20px rgba(37,99,235,0.3)">
    <div>
      <div style="color:rgba(255,255,255,.7);font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Total Revenue (Period)</div>
      <div style="font-size:36px;font-weight:900;color:white;letter-spacing:-.02em">${revDisplay}</div>
      <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px">${sd} → ${ed}</div>
    </div>
    <div style="font-size:52px;opacity:.4">💰</div>
  </div>` : ''}
  <div class="dash-stats">
    <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Revenue (KPI)</div><div class="dash-stat-val">${fmt.money(stats.totalRevenue||0)}</div><div class="dash-stat-trend flat">Selected period</div></div>
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
const buildProductRows = (list) => list.length ? list.map(p => {
  const discountBadge = p.discountName
    ? `<span class="bdg bdg-purple" style="font-size:10px" title="${p.discountName}">-${p.discountPercentage||0}%</span>`
    : '';
  return `
  <tr>
    <td class="td-b">${p.name||p.productName||'—'} ${discountBadge}</td>
    <td>${p.categoryName||p.category?.name||'—'}</td>
    <td>${fmt.money(p.price||0)}</td>
    <td>
      <select class="dash-sel prod-status-sel" data-id="${p.id}" style="font-size:11px;padding:2px 4px;height:26px">
        <option value="ACTIVE"   ${(p.status||'ACTIVE')==='ACTIVE'   ?'selected':''}>Active</option>
        <option value="INACTIVE" ${p.status==='INACTIVE'?'selected':''}>Inactive</option>
        <option value="DRAFT"    ${p.status==='DRAFT'   ?'selected':''}>Draft</option>
      </select>
    </td>
    <td><label class="d-toggle" style="margin:0"><input type="checkbox" class="prod-featured-toggle" data-id="${p.id}" ${p.featured?'checked':''}><span class="d-tog-slider"></span></label></td>
    <td>
      <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-product" data-id="${p.id}" title="Edit">${I.edit}</button>
      <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="manage-images" data-id="${p.id}" title="Manage images">${I.img}</button>
      <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="apply-discount" data-id="${p.id}" data-name="${escAttr(p.name||'')}" title="Apply discount">${I.tag}</button>
      <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-product" data-id="${p.id}" title="Delete">${I.trash}</button>
    </td>
  </tr>`;
}).join('') :
  `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">📦</div><div class="d-empty-ttl">No products found</div><div class="d-empty-txt">Try adjusting your filters.</div></div></td></tr>`;

TAB.products = async () => {
  let products = []; let total = 0;
  try {
    const [prodRes, catRes, discRes] = await Promise.all([
      ApiService.products.search({ page:0, size:200 }),
      ApiService.products.getCategories().catch(()=>({data:[]})),
      ApiService.getDiscounts().catch(()=>({data:[]})),
    ]);
    products = extractList(prodRes);
    total    = extractTotal(prodRes, products);
    _categoryCache = extractList(catRes);
    _discountCache = extractList(discRes);
  } catch(_){}
  _productCache = products;

  const catOptions = _categoryCache.map(c => `<option value="${c.id}">${escAttr(c.name)}</option>`).join('');

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Products</div><div class="dash-page-sub">${fmt.num(total)} products total</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-products">${I.download} Export CSV</button>
      <button class="btn-d btn-d-sec" id="btn-bulk-export">${I.download} Export Excel</button>
      <label class="btn-d btn-d-sec" style="cursor:pointer" title="Import products from Excel">
        ${I.refresh} Import Excel
        <input type="file" id="bulk-import-file" accept=".xlsx,.xls" style="display:none">
      </label>
      <button class="btn-d btn-d-primary" id="btn-add-product">${I.plus} Add Product</button>
    </div>
  </div>
  <div id="bulk-import-result" style="display:none;margin-bottom:14px"></div>
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
          <option value="DRAFT">Draft</option>
        </select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead>
      <tbody id="products-tbody">${buildProductRows(products)}</tbody>
    </table>
  </div>
  <!-- Apply discount modal -->
  <div id="discount-apply-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;align-items:center;justify-content:center">
    <div style="background:#fff;border-radius:12px;padding:24px;width:380px;max-width:95vw">
      <div style="font-weight:700;font-size:15px;margin-bottom:14px">Apply Discount</div>
      <input type="hidden" id="da-product-id">
      <div class="f-field"><label class="f-lbl">Product</label><div id="da-product-name" style="font-size:13px;color:#64748B;margin-bottom:10px"></div></div>
      <div class="f-field"><label class="f-lbl">Select Discount</label>
        <select class="dash-sel" id="da-discount-sel" style="width:100%">
          <option value="">— No discount —</option>
          ${_discountCache.filter(d=>d.active).map(d=>`<option value="${d.id}">${escAttr(d.name)} (${d.discountPercentage}%)</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn-d btn-d-sec" id="btn-da-cancel">Cancel</button>
        <button class="btn-d btn-d-primary" id="btn-da-save">Apply</button>
      </div>
    </div>
  </div>
  <!-- Image management modal -->
  <div id="img-mgmt-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;align-items:center;justify-content:center">
    <div style="background:#fff;border-radius:12px;padding:24px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-weight:700;font-size:15px">Manage Images</div>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" id="btn-img-close">${I.x}</button>
      </div>
      <input type="hidden" id="img-mgmt-product-id">
      <div id="img-mgmt-gallery" style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px"></div>
      <div style="border-top:1px dashed #e2e8f0;padding-top:14px">
        <div class="f-lbl" style="margin-bottom:8px">Add image</div>
        <input type="file" id="img-upload-file" accept="image/*" style="margin-bottom:8px;width:100%">
        <div class="f-row" style="gap:8px">
          <div class="f-field" style="flex:1"><label class="f-lbl">Alt text</label><input class="f-inp" id="img-upload-alt" placeholder="Description…"></div>
          <div class="f-field" style="flex:0 0 auto;padding-top:22px"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px"><input type="checkbox" id="img-upload-primary"> Primary</label></div>
        </div>
        <button class="btn-d btn-d-primary btn-d-sm" id="btn-img-upload" style="margin-top:8px">${I.refresh} Upload Image</button>
      </div>
      <div id="img-upload-msg" style="margin-top:8px;font-size:12px;display:none"></div>
    </div>
  </div>

  <!-- Category management -->
  <div class="dash-chart-card" style="margin-top:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div>
        <div class="dash-chart-hd" style="margin:0">Category Management</div>
        <div class="dash-chart-sub" style="margin:0">${_categoryCache.length} categories · assigned when creating or editing a product</div>
      </div>
      <button class="btn-d btn-d-primary btn-d-sm" id="btn-show-add-cat">${I.plus} Add Category</button>
    </div>

    <!-- Inline add form (hidden by default) -->
    <div id="cat-add-form" style="display:none;background:#F8FAFC;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:14px">
      <div class="f-row" style="align-items:flex-end;gap:10px;flex-wrap:wrap">
        <div class="f-field" style="flex:1;min-width:160px;margin:0">
          <label class="f-lbl">Name *</label>
          <input class="f-inp" id="cat-new-name" placeholder="e.g. Smartphones" autocomplete="off">
        </div>
        <div class="f-field" style="flex:2;min-width:200px;margin:0">
          <label class="f-lbl">Description <span style="color:#94A3B8">(optional)</span></label>
          <input class="f-inp" id="cat-new-desc" placeholder="Short description…">
        </div>
        <div style="display:flex;gap:6px;padding-bottom:1px">
          <button class="btn-d btn-d-sec btn-d-sm" id="btn-cancel-cat">Cancel</button>
          <button class="btn-d btn-d-primary btn-d-sm" id="btn-save-cat">Save</button>
        </div>
      </div>
      <div id="cat-form-err" style="display:none;color:#991B1B;font-size:12px;margin-top:8px"></div>
    </div>

    <!-- Category chips -->
    <div id="cat-chips" style="display:flex;flex-wrap:wrap;gap:8px">
      ${_categoryCache.length ? _categoryCache.map(c => `
        <div class="cat-chip" data-cat-id="${c.id}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#EEF2FF;border:1.5px solid #C7D2FE;border-radius:20px;font-size:13px;font-weight:600;color:#3730a3">
          <span>${esc(c.name)}</span>
          ${isAdmin() ? `<button class="cat-chip-del" data-cat-id="${c.id}" data-cat-name="${escAttr(c.name)}" style="background:none;border:none;cursor:pointer;color:#6366f1;font-size:14px;line-height:1;padding:0 0 0 2px" title="Delete">${I.x}</button>` : ''}
        </div>`).join('') :
        `<div style="color:#94A3B8;font-size:13px">No categories yet — add one above.</div>`}
    </div>
  </div>`;
};

// ── Discounts ─────────────────────────────────────────────
TAB.discounts = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied. Admin only.</div>`;
  let discounts = [];
  try {
    const res = await ApiService.getDiscounts();
    discounts = extractList(res);
    _discountCache = discounts;
  } catch(_){}

  const rows = discounts.length ? discounts.map(d => `
    <tr>
      <td class="td-b">${d.name||'—'}</td>
      <td>${d.description||'—'}</td>
      <td style="text-align:center;font-size:15px;font-weight:700;color:#7C3AED">${Number(d.discountPercentage||0).toFixed(1)}%</td>
      <td>${d.startDate ? fmt.date(d.startDate) : '—'}</td>
      <td>${d.endDate   ? fmt.date(d.endDate)   : '—'}</td>
      <td>${statusBdg(d.active ? 'ACTIVE' : 'INACTIVE')}</td>
      <td>
        <button class="btn-d ${d.active?'btn-d-sec':'btn-d-success'} btn-d-sm" data-action="toggle-discount" data-id="${d.id}">${d.active?'Disable':'Enable'}</button>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-discount" data-id="${d.id}" title="Edit">${I.edit}</button>
        <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-discount" data-id="${d.id}" title="Delete">${I.trash}</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🏷️</div><div class="d-empty-ttl">No discounts yet</div><div class="d-empty-txt">Create a discount to apply it to products.</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Discounts</div><div class="dash-page-sub">Percentage discounts applied to products</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-primary" id="btn-add-discount">${I.plus} New Discount</button>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">All Discounts</span><span class="dash-tcard-count">${discounts.length}</span></div>
    <table class="dt">
      <thead><tr><th>Name</th><th>Description</th><th style="text-align:center">%</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

// ── Inventory ─────────────────────────────────────────────
TAB.inventory = async () => {
  let items = [], movements = [], lowStock = [];
  const [ir, mr, lr] = await Promise.allSettled([
    ApiService.inventory.getItems(),
    ApiService.inventory.getMovements(0, 50),
    ApiService.inventory.getLowStock(),
  ]);
  if (ir.status === 'fulfilled') {
    items = extractList(ir.value);
  } else {
    showToast('Failed to load inventory: ' + (ir.reason?.message || 'Server error'), 'error');
  }
  if (mr.status === 'fulfilled') movements = extractList(mr.value);
  if (lr.status === 'fulfilled') lowStock  = extractList(lr.value);

  _invCache     = items;
  _movementCache = movements;
  _lowStockCache = lowStock;

  const reorderOf = i => i.reorderPoint || i.lowStockThreshold || 10;

  const buildInvRows = (list) => list.length ? list.map(item => {
    const stock   = item.quantity || 0;
    const reorder = reorderOf(item);
    const max     = Math.max(stock * 1.5, reorder * 3, 50);
    const pct     = Math.min(Math.round(stock / max * 100), 100);
    const cls     = stock === 0 ? 'out' : stock <= reorder ? 'low' : 'ok';
    const st      = stock === 0 ? 'OUT_OF_STOCK' : stock <= reorder ? 'PENDING' : 'ACTIVE';
    return `<tr>
      <td class="td-b">${item.productName || item.name || '—'}</td>
      <td>${item.sku || '—'}</td>
      <td>${item.location || item.warehouse || 'Main'}</td>
      <td>
        <span style="font-weight:700;color:${cls==='out'?'#EF4444':cls==='low'?'#F59E0B':'#10B981'}">${stock}</span>
        <div class="d-stock-bar" style="width:80px;display:inline-block;margin-left:8px"><div class="d-stock-fill ${cls}" style="width:${pct}%"></div></div>
      </td>
      <td>
        <span id="thresh-val-${item.id}">${reorder}</span>
        <button class="btn-d btn-d-sec btn-d-sm" style="margin-left:6px;padding:2px 6px;font-size:11px" data-action="edit-threshold" data-id="${item.id}" data-threshold="${reorder}">Edit</button>
      </td>
      <td>${statusBdg(st)}</td>
      <td style="display:flex;gap:4px;">
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="view-inv-item" data-id="${item.id}" title="View detail">${I.eye}</button>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="adjust-stock" data-id="${item.id}" data-item-name="${escAttr(item.productName||item.name||'')}">Adjust</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🏭</div><div class="d-empty-ttl">No inventory data</div></div></td></tr>`;

  const typeIcon = t => t==='IN'?'▲':t==='OUT'?'▼':'↕';
  const typeColor = t => t==='IN'?'#10B981':t==='OUT'?'#EF4444':'#6366F1';
  const buildMovRows = (list) => list.length ? list.map(m => `
    <tr>
      <td class="td-sm">${fmt.ago(m.createdAt)}</td>
      <td class="td-b">${m.inventoryItem?.productName || m.inventoryItem?.name || '—'}</td>
      <td style="color:${typeColor(m.type)};font-weight:700">${typeIcon(m.type)} ${m.type||'—'}</td>
      <td style="font-weight:700;color:${(m.quantity||0)>=0?'#10B981':'#EF4444'}">${(m.quantity||0)>0?'+':''}${m.quantity||0}</td>
      <td>${m.reason||'—'}</td>
      <td class="td-sm">${m.referenceId ? `<code>#${m.referenceId.toString().slice(-8)}</code>` : '—'}</td>
    </tr>`).join('') :
    `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">📋</div><div class="d-empty-ttl">No movements yet</div></div></td></tr>`;

  const locations = [...new Set(items.map(i => i.location || i.warehouse || 'Main').filter(Boolean))];
  const inStock   = items.filter(i=>i.quantity>0&&i.quantity>(reorderOf(i))).length;
  const lowCount  = items.filter(i=>i.quantity>0&&i.quantity<=(reorderOf(i))).length;
  const outCount  = items.filter(i=>!i.quantity||i.quantity<=0).length;

  return `
  <div class="dash-page-hd">
    <div>
      <div class="dash-page-title">Inventory</div>
      <div class="dash-page-sub">${items.length} items · <span style="color:#EF4444;font-weight:600">${outCount} out of stock</span> · <span style="color:#F59E0B;font-weight:600">${lowCount} low stock</span></div>
    </div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-inv">${I.download} Export CSV</button>
      <button class="btn-d btn-d-primary" id="btn-add-inv-item">${I.plus} Add Item</button>
    </div>
  </div>

  <div class="d-widgets" style="margin-bottom:16px">
    <div class="d-widget"><div class="d-widget-ttl">Stock Health</div>
      <div class="d-widget-row"><span>In Stock</span><span class="bdg bdg-green">${inStock}</span></div>
      <div class="d-widget-row"><span>Low Stock</span><span class="bdg bdg-yellow">${lowCount}</span></div>
      <div class="d-widget-row"><span>Out of Stock</span><span class="bdg bdg-red">${outCount}</span></div>
    </div>
    ${lowStock.length ? `
    <div class="d-widget" style="border-left:3px solid #F59E0B">
      <div class="d-widget-ttl" style="color:#F59E0B">⚠ Low Stock Alerts</div>
      ${lowStock.slice(0,5).map(i=>`
        <div class="d-widget-row">
          <span style="font-size:12px">${i.productName||i.name||'—'}</span>
          <span class="bdg bdg-yellow">${i.quantity} left</span>
        </div>`).join('')}
      ${lowStock.length>5?`<div style="font-size:11px;color:#94a3b8;margin-top:4px">+${lowStock.length-5} more items</div>`:''}
    </div>` : ''}
  </div>

  <!-- Sub-tabs -->
  <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px;">
    <button class="inv-subtab active" data-subtab="stock" style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#FF6B00;border-bottom:2px solid #FF6B00;margin-bottom:-2px;">
      Stock Levels <span style="background:#e2e8f0;color:#475569;border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px;">${items.length}</span>
    </button>
    <button class="inv-subtab" data-subtab="movements" style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px;">
      Movement History <span style="background:#e2e8f0;color:#475569;border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px;">${movements.length}</span>
    </button>
  </div>

  <!-- Stock Levels panel -->
  <div id="inv-panel-stock">
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
        <thead><tr><th>Product</th><th>SKU</th><th>Location</th><th>Quantity</th><th>Reorder Threshold</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="inv-tbody">${buildInvRows(items)}</tbody>
      </table>
    </div>
  </div>

  <!-- Movement History panel -->
  <div id="inv-panel-movements" style="display:none">
    <div class="dash-tcard">
      <div class="dash-tcard-hd">
        <span class="dash-tcard-title">Stock Movements</span>
        <div class="dash-tcard-acts">
          <input class="dash-inp" id="mov-search" placeholder="Search product or reason…" style="width:200px">
          <select class="dash-sel" id="mov-type-filter">
            <option value="">All Types</option>
            <option value="IN">IN (Restock)</option>
            <option value="OUT">OUT (Sale)</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>
      <table class="dt">
        <thead><tr><th>Time</th><th>Item</th><th>Type</th><th>Qty Change</th><th>Reason</th><th>Reference</th></tr></thead>
        <tbody id="mov-tbody">${buildMovRows(movements)}</tbody>
      </table>
    </div>
  </div>`;
};

// ── Suppliers ─────────────────────────────────────────────
TAB.suppliers = async () => {
  let suppliers = [];
  try {
    const res = await ApiService.suppliers.getAll();
    suppliers = Array.isArray(res) ? res : (res?.data || res?.content || []);
  } catch(_){}
  _supplierCache = suppliers;

  const rows = suppliers.length ? suppliers.map(s => `
    <tr>
      <td class="td-b">${s.name||'—'}</td>
      <td>${s.contactEmail||'—'}</td>
      <td>${s.contactPhone||'—'}</td>
      <td>${s.performanceRating ? '⭐'.repeat(Math.round(s.performanceRating)) + ' ' + s.performanceRating.toFixed(1) : '—'}</td>
      <td>${s.notes ? `<span title="${escAttr(s.notes)}" style="max-width:180px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.notes}</span>` : '—'}</td>
      <td>${s.active ? `<span class="bdg bdg-green">Active</span>` : `<span class="bdg bdg-gray">Inactive</span>`}</td>
      <td style="display:flex;gap:5px;">
        <button class="btn-d btn-d-sec btn-d-sm" data-action="edit-supplier" data-id="${s.id}">Edit</button>
        <button class="btn-d btn-d-${s.active?'danger':'success'} btn-d-sm" data-action="toggle-supplier" data-id="${s.id}" data-active="${s.active}">${s.active?'Deactivate':'Activate'}</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🏭</div><div class="d-empty-ttl">No suppliers yet</div><div class="d-empty-sub">Add your first supplier to get started</div></div></td></tr>`;

  const active = suppliers.filter(s=>s.active).length;
  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Suppliers</div><div class="dash-page-sub">${suppliers.length} total · ${active} active</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-primary" id="btn-add-supplier">${I.plus} Add Supplier</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Supplier Directory</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" id="supplier-search" placeholder="Search by name or email…" style="width:220px">
        <select class="dash-sel" id="supplier-status-filter">
          <option value="">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Rating</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="supplier-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Procurement ───────────────────────────────────────────
TAB.procurement = async () => {
  let orders = [], suppliers = [], items = [];
  try {
    const [or, sr, ir] = await Promise.allSettled([
      ApiService.procurement.getAll(),
      ApiService.suppliers.getAll(true),
      ApiService.inventory.getItems(),
    ]);
    if (or.status==='fulfilled') orders    = Array.isArray(or.value) ? or.value : (or.value?.data || or.value?.content || []);
    if (sr.status==='fulfilled') suppliers = Array.isArray(sr.value) ? sr.value : (sr.value?.data || sr.value?.content || []);
    if (ir.status==='fulfilled') items     = Array.isArray(ir.value) ? ir.value : (ir.value?.data || ir.value?.content || []);
  } catch(_){}
  _procurementCache = orders;
  _supplierCache    = suppliers.length ? suppliers : _supplierCache;
  _invCache         = items.length     ? items     : _invCache;

  const statusColor = { PENDING:'bdg-yellow', RECEIVED:'bdg-green', PARTIALLY_RECEIVED:'bdg-blue', CANCELLED:'bdg-red', DRAFT:'bdg-gray' };

  const buildPORows = (list) => list.length ? list.map(o => {
    const supplierName = o.supplier?.name || '—';
    const itemName     = o.inventoryItem?.productName || o.inventoryItem?.name || '—';
    const st           = (o.status||'PENDING').toUpperCase();
    const eta          = o.expectedDeliveryDate ? fmt.date(o.expectedDeliveryDate) : '—';
    const cost         = o.totalCost ? fmt.money(o.totalCost) : '—';
    return `<tr>
      <td class="td-m"><code>#${(o.id||'').toString().slice(-8)}</code></td>
      <td class="td-b">${supplierName}</td>
      <td>${itemName}</td>
      <td style="text-align:center">${o.quantityOrdered||0}</td>
      <td style="text-align:center">${o.quantityReceived||0}</td>
      <td>${cost}</td>
      <td>${eta}</td>
      <td><span class="bdg ${statusColor[st]||'bdg-gray'}">${st.replace('_',' ')}</span></td>
      <td style="display:flex;gap:4px;flex-wrap:wrap;">
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="view-po" data-id="${o.id}" title="View detail">${I.eye}</button>
        ${st==='PENDING'||st==='DRAFT' ? `<button class="btn-d btn-d-success btn-d-sm" data-action="receive-po" data-id="${o.id}" data-ordered="${o.quantityOrdered||0}">Receive</button>` : ''}
        ${st==='PENDING'||st==='DRAFT' ? `<button class="btn-d btn-d-danger btn-d-sm" data-action="cancel-po" data-id="${o.id}">Cancel</button>` : ''}
        ${st==='PARTIALLY_RECEIVED' ? `<button class="btn-d btn-d-success btn-d-sm" data-action="receive-po" data-id="${o.id}" data-ordered="${o.quantityOrdered||0}">More</button>` : ''}
      </td>
    </tr>`;
  }).join('') :
  `<tr><td colspan="9"><div class="d-empty"><div class="d-empty-ico">📦</div><div class="d-empty-ttl">No procurement orders</div></div></td></tr>`;

  const pending  = orders.filter(o=>o.status==='PENDING'||o.status==='DRAFT').length;
  const received = orders.filter(o=>o.status==='RECEIVED').length;
  const partial  = orders.filter(o=>o.status==='PARTIALLY_RECEIVED').length;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Procurement</div><div class="dash-page-sub">${orders.length} orders · ${pending} pending</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-primary" id="btn-add-po">${I.plus} New Order</button></div>
  </div>
  <div class="d-widgets" style="margin-bottom:16px">
    <div class="d-widget"><div class="d-widget-ttl">Order Summary</div>
      <div class="d-widget-row"><span>Pending / Draft</span><span class="bdg bdg-yellow">${pending}</span></div>
      <div class="d-widget-row"><span>Partially Received</span><span class="bdg bdg-blue">${partial}</span></div>
      <div class="d-widget-row"><span>Received</span><span class="bdg bdg-green">${received}</span></div>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Purchase Orders</span>
      <div class="dash-tcard-acts">
        <select class="dash-sel" id="po-status-filter">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="DRAFT">Draft</option>
          <option value="PARTIALLY_RECEIVED">Partial</option>
          <option value="RECEIVED">Received</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Order #</th><th>Supplier</th><th>Item</th><th style="text-align:center">Ordered</th><th style="text-align:center">Received</th><th>Cost</th><th>ETA</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="po-tbody">${buildPORows(orders)}</tbody>
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

  <!-- Tracking search bar -->
  <div class="dash-chart-card" style="margin-bottom:16px;padding:16px 20px">
    <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#0F172A">🔍 Track Shipment by Number</div>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="dash-inp" id="track-number-input" placeholder="Enter tracking number…" style="flex:1;max-width:360px">
      <button class="btn-d btn-d-primary" id="btn-track-shipment">Track</button>
    </div>
    <div id="track-result" style="margin-top:12px"></div>
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

// ── Fulfillment ───────────────────────────────────────────
TAB.fulfillment = async () => {
  let orders = [];
  try {
    // Load orders that are fulfillable: PAID or PROCESSING
    const [paidRes, procRes] = await Promise.allSettled([
      ApiService.getOrders({ page:0, size:50, status:'PAID' }),
      ApiService.getOrders({ page:0, size:50, status:'PROCESSING' }),
    ]);
    const paid = paidRes.status === 'fulfilled' ? extractList(paidRes.value) : [];
    const proc = procRes.status === 'fulfilled' ? extractList(procRes.value) : [];
    // Deduplicate by id
    const seen = new Set();
    orders = [...paid, ...proc].filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; });
  } catch(_){}

  const STEPS = ['PICKED','PACKED','DISPATCHED','COMPLETED'];
  function stepIndex(status) { return STEPS.indexOf(status); }

  const rows = orders.length ? orders.map(o => `
    <tr class="ful-row" data-order-id="${o.id}" style="cursor:pointer">
      <td class="td-m">#${(o.orderNumber||o.id||'').toString().slice(-8)}</td>
      <td class="td-b">${esc(o.customerName||o.userName||'Customer')}</td>
      <td>${fmt.money(o.totalAmount||0)}</td>
      <td>${statusBdg(o.status)}</td>
      <td class="td-sm">${fmt.date(o.createdAt)}</td>
      <td>
        <button class="btn-d btn-d-primary btn-d-sm" data-action="start-fulfillment" data-id="${o.id}">
          ${I.pkg} Fulfill
        </button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">✅</div><div class="d-empty-ttl">No orders awaiting fulfillment</div><div class="d-empty-txt">PAID and PROCESSING orders appear here.</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Fulfillment</div><div class="dash-page-sub">${orders.length} order${orders.length===1?'':'s'} awaiting fulfillment</div></div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 420px;gap:16px;align-items:start">
    <!-- Order queue -->
    <div class="dash-tcard">
      <div class="dash-tcard-hd"><span class="dash-tcard-title">Orders to Fulfill</span><span class="dash-tcard-count">${orders.length}</span></div>
      <table class="dt">
        <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
        <tbody id="ful-tbody">${rows}</tbody>
      </table>
    </div>

    <!-- Fulfillment workflow panel -->
    <div id="ful-panel" class="dash-chart-card" style="padding:0;overflow:hidden">
      <div style="padding:18px 20px;border-bottom:1px solid #F1F5F9;font-weight:700;font-size:14px;color:#0F172A">Fulfillment Workflow</div>
      <div id="ful-panel-body" style="padding:20px">
        <div style="text-align:center;color:#94A3B8;padding:40px 0">
          <div style="font-size:36px;margin-bottom:8px">📦</div>
          <div style="font-weight:600">Select an order to start</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Dispatch modal -->
  <div id="dispatch-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;align-items:center;justify-content:center">
    <div style="background:white;border-radius:16px;padding:28px;width:460px;max-width:95vw">
      <div style="font-size:17px;font-weight:700;margin-bottom:20px">Dispatch Order</div>
      <input type="hidden" id="dispatch-order-id">
      <div class="f-field"><label class="f-lbl">Carrier *</label>
        <select class="f-inp" id="dispatch-carrier">
          <option value="">Select carrier…</option>
          <option>DHL</option><option>FedEx</option><option>UPS</option><option>USPS</option><option>EMS</option><option>Local Courier</option><option>Other</option>
        </select>
      </div>
      <div class="f-field"><label class="f-lbl">Tracking Number</label><input class="f-inp" id="dispatch-tracking" placeholder="Optional — auto-generated if blank"></div>
      <div class="f-field"><label class="f-lbl">Est. Delivery Date</label><input class="f-inp" type="datetime-local" id="dispatch-eta"></div>
      <div style="display:flex;gap:10px;margin-top:18px">
        <button class="btn-d btn-d-sec" style="flex:1" id="dispatch-cancel">Cancel</button>
        <button class="btn-d btn-d-primary" style="flex:2" id="dispatch-confirm">Dispatch</button>
      </div>
    </div>
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
let _crmSubTab = 'customers';
let _crmCustomerCache = [];

TAB.crm = async () => {
  let customers = [], analytics = {}, total = 0;
  try {
    const [cusRes, anaRes] = await Promise.allSettled([
      ApiService.getCustomers({ page:0, size:200 }),
      ApiService.getCrmAnalytics(),
    ]);
    if (cusRes.status === 'fulfilled') {
      customers = extractList(cusRes.value);
      total     = extractTotal(cusRes.value, customers);
    }
    if (anaRes.status === 'fulfilled') analytics = anaRes.value?.data || anaRes.value || {};
  } catch(_){}
  _customerCache = customers;
  _crmCustomerCache = customers;

  /* ── Analytics sub-tab ─────────────────────────────── */
  const seg = analytics.segments || {};
  const segRows = Object.entries(seg).map(([name, count]) =>
    `<tr><td class="td-b">${name}</td><td>${count}</td><td>
      <div style="background:#F1F5F9;border-radius:4px;height:8px;width:100%;max-width:200px">
        <div style="background:#FF6B00;height:8px;border-radius:4px;width:${Math.min(100, Math.round((count/(total||1))*100))}%"></div>
      </div>
    </td></tr>`
  ).join('');

  const analyticsHtml = `
    <div class="dash-stats" style="margin-bottom:20px">
      <div class="dash-stat"><div class="dash-stat-ico ico-blue">${I.users}</div><div class="dash-stat-lbl">Total Customers</div><div class="dash-stat-val">${fmt.num(analytics.totalCustomers||0)}</div></div>
      <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Lifetime Revenue</div><div class="dash-stat-val">${fmt.money(analytics.lifetimeValue||0)}</div></div>
      <div class="dash-stat"><div class="dash-stat-ico ico-purple">${I.dollar}</div><div class="dash-stat-lbl">Avg. LTV</div><div class="dash-stat-val">${fmt.money(analytics.averageLifetimeValue||0)}</div></div>
      <div class="dash-stat"><div class="dash-stat-ico ico-red">${I.alert}</div><div class="dash-stat-lbl">At-Risk Customers</div><div class="dash-stat-val">${fmt.num(analytics.atRiskCustomers||0)}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="dash-chart-card">
        <div class="dash-chart-hd">Customer Segments</div>
        <table class="d-table" style="width:100%">
          <thead><tr><th>Segment</th><th>Count</th><th>Share</th></tr></thead>
          <tbody>${segRows || '<tr><td colspan="3" style="text-align:center;color:#94A3B8;padding:20px">No segment data yet</td></tr>'}</tbody>
        </table>
      </div>
      <div class="dash-chart-card">
        <div class="dash-chart-hd">Engagement Overview</div>
        <div class="fin-metric"><span class="fin-metric-lbl">Profiled Customers</span><span class="fin-metric-val">${fmt.num(analytics.profiledCustomers||0)}</span></div>
        <div class="fin-metric"><span class="fin-metric-lbl">Support Tickets</span><span class="fin-metric-val">${fmt.num(analytics.supportTickets||0)}</span></div>
        <div class="fin-metric"><span class="fin-metric-lbl">Communication Logs</span><span class="fin-metric-val">${fmt.num(analytics.communicationLogs||0)}</span></div>
        <div class="fin-metric"><span class="fin-metric-lbl">At-Risk (30d inactive)</span><span class="fin-metric-val neg">${fmt.num(analytics.atRiskCustomers||0)}</span></div>
      </div>
    </div>`;

  /* ── Customer list sub-tab ──────────────────────────── */
  const custRows = customers.length ? customers.map(c => `
    <tr>
      <td class="td-b">${esc(c.firstName||'')} ${esc(c.lastName||'')}</td>
      <td>${esc(c.email||'—')}</td>
      <td>${c.orderCount||c.totalOrders||0}</td>
      <td>${fmt.money(c.totalSpent||c.lifetimeValue||0)}</td>
      <td>${statusBdg(c.locked?'BLOCKED':c.enabled===false?'DISABLED':'ACTIVE')}</td>
      <td class="td-sm">${fmt.date(c.createdAt||c.joinDate)}</td>
      <td style="display:flex;gap:4px">
        <button class="btn-d btn-d-sec btn-d-sm" data-action="view-customer" data-id="${c.id}">${I.eye} View</button>
        <button class="btn-d btn-d-primary btn-d-sm" data-action="log-comm" data-id="${c.id}" data-name="${esc(c.firstName||'')} ${esc(c.lastName||'')}">+ Log</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">👥</div><div class="d-empty-ttl">No customers found</div></div></td></tr>`;

  /* ── Communication logs sub-tab ─────────────────────── */
  const commLogsHtml = `
    <div class="dash-tcard">
      <div class="dash-tcard-hd">
        <span class="dash-tcard-title">Communication Logs</span>
        <div class="dash-tcard-acts">
          <select class="dash-sel" id="comm-customer-filter" style="width:220px">
            <option value="">All Customers</option>
            ${customers.map(c => `<option value="${c.id}">${esc(c.firstName||'')} ${esc(c.lastName||'')} — ${esc(c.email||'')}</option>`).join('')}
          </select>
          <button class="btn-d btn-d-primary btn-d-sm" id="btn-load-comm-logs">Load Logs</button>
        </div>
      </div>
      <div id="comm-logs-body">
        <div style="text-align:center;padding:40px;color:#94A3B8">Select a customer to view their communication history</div>
      </div>
    </div>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">CRM</div><div class="dash-page-sub">${fmt.num(total)} customers · ${fmt.money(analytics.lifetimeValue||0)} LTV</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec" id="btn-export-customers">${I.download} Export</button></div>
  </div>

  <!-- Sub-tab bar -->
  <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid #F1F5F9">
    ${[{id:'analytics',label:'📊 Analytics'},{id:'customers',label:`👥 Customers (${total})`},{id:'comms',label:'📋 Communication Logs'}].map(st=>`
      <button class="sup-main-tab ${_crmSubTab===st.id?'active':''}" data-crm-tab="${st.id}">${st.label}</button>
    `).join('')}
  </div>

  <!-- Analytics -->
  <div id="crm-panel-analytics" style="${_crmSubTab==='analytics'?'':'display:none'}">${analyticsHtml}</div>

  <!-- Customer list -->
  <div id="crm-panel-customers" style="${_crmSubTab==='customers'?'':'display:none'}">
    <div class="dash-tcard">
      <div class="dash-tcard-hd"><span class="dash-tcard-title">Customer List</span><span class="dash-tcard-count">${total}</span>
        <div class="dash-tcard-acts"><input class="dash-inp" placeholder="Search name or email…" style="width:200px" id="crm-search"></div>
      </div>
      <table class="dt">
        <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>LTV</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody id="crm-tbody">${custRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Comm logs -->
  <div id="crm-panel-comms" style="${_crmSubTab==='comms'?'':'display:none'}">${commLogsHtml}</div>

  <!-- Log communication modal -->
  <div id="comm-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;align-items:center;justify-content:center">
    <div style="background:white;border-radius:16px;padding:28px;width:520px;max-width:95vw">
      <div style="font-size:17px;font-weight:700;margin-bottom:20px">Log Communication — <span id="comm-modal-cname"></span></div>
      <input type="hidden" id="comm-customer-id">
      <div class="f-field"><label class="f-lbl">Channel *</label>
        <select class="f-inp" id="comm-channel">
          <option value="EMAIL">Email</option><option value="PHONE">Phone</option><option value="CHAT">Chat</option><option value="IN_PERSON">In Person</option><option value="OTHER">Other</option>
        </select>
      </div>
      <div class="f-field"><label class="f-lbl">Subject *</label><input class="f-inp" id="comm-subject" placeholder="Brief subject of the interaction"></div>
      <div class="f-field"><label class="f-lbl">Notes</label><textarea class="f-inp" id="comm-notes" rows="3" placeholder="Details of the interaction…"></textarea></div>
      <div class="f-field"><label class="f-lbl">Outcome</label><input class="f-inp" id="comm-outcome" placeholder="e.g. Resolved, Follow-up needed"></div>
      <div style="display:flex;gap:10px;margin-top:18px">
        <button class="btn-d btn-d-sec" style="flex:1" id="comm-modal-cancel">Cancel</button>
        <button class="btn-d btn-d-primary" style="flex:2" id="comm-modal-save">Save Log</button>
      </div>
    </div>
  </div>`;
};

// ── Support ───────────────────────────────────────────────
let _supSubTab = 'tickets';
let _supTicketFilter = '';
let _supFaqCache = [];
let _supAgentCache = [];

TAB.support = async () => {
  let tickets = [], chatSessions = [], faqs = [], agents = [];
  try {
    const [tRes, cRes, fRes, uRes] = await Promise.allSettled([
      ApiService.getSupportTickets({ page:0, size:100 }),
      ApiService.chat.getSessions(),
      ApiService.getAllFaqs(),
      ApiService.getUsers({ page:0, size:100 }),
    ]);
    if (tRes.status === 'fulfilled') tickets = extractList(tRes.value);
    if (cRes.status === 'fulfilled') chatSessions = cRes.value?.data || [];
    if (fRes.status === 'fulfilled') faqs = fRes.value?.data || [];
    if (uRes.status === 'fulfilled') {
      const all = extractList(uRes.value);
      agents = all.filter(u => ['SUPPORT_AGENT','ADMIN','EMPLOYEE'].includes(u.role));
    }
  } catch(_){}

  _supFaqCache = faqs;
  _supAgentCache = agents;

  const priorityClr = { HIGH:'#ef4444', CRITICAL:'#dc2626', MEDIUM:'#f59e0b', LOW:'#10b981' };

  /* ── Tickets sub-tab ─────────────────────────────────── */
  const statuses = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const filterBar = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #F1F5F9">
      ${statuses.map(s => `<button class="btn-d btn-d-sm ${_supTicketFilter===s?'btn-d-primary':'btn-d-sec'}" data-action="sup-filter" data-status="${s}">${s||'All'}</button>`).join('')}
      <button class="btn-d btn-d-sm ${_supTicketFilter==='__assigned__'?'btn-d-warning':'btn-d-sec'}" data-action="sup-filter-assigned" style="margin-left:auto">👤 My Queue</button>
    </div>`;
  const filteredTickets = _supTicketFilter ? tickets.filter(t => t.status === _supTicketFilter) : tickets;
  const ticketListHtml = filteredTickets.length ? filteredTickets.map(t => `
    <div class="sup-item" data-ticket-id="${t.id}" style="cursor:pointer">
      <div class="sup-item-title">${esc(t.title||'Support Request')}</div>
      <div class="sup-item-meta">
        ${statusBdg(t.status||'OPEN')}
        <span style="color:${priorityClr[t.priority]||'#94A3B8'};font-size:10px;font-weight:700">${t.priority||''}</span>
        <span style="font-size:11px;color:#94A3B8">${fmt.ago(t.updatedAt||t.createdAt)}</span>
      </div>
      <div style="font-size:11px;color:#64748B;margin-top:3px">${esc(t.customer?.firstName||'')} ${esc(t.customer?.lastName||'')}${t.assignedAgent ? ` · Agent: ${esc(t.assignedAgent.firstName||'')}` : ' · <em style="color:#f59e0b">Unassigned</em>'}</div>
    </div>`).join('') :
    `<div class="d-empty"><div class="d-empty-ico">🎫</div><div class="d-empty-ttl">No tickets</div></div>`;

  /* ── Live chat sub-tab ───────────────────────────────── */
  const chatListHtml = chatSessions.length ? chatSessions.map(s => {
    const sc = s.status==='OPEN'?'#3B82F6':s.status==='ASSIGNED'?'#10B981':'#94A3B8';
    return `<div class="sup-item" data-chat-id="${s.id}" style="cursor:pointer">
      <div class="sup-item-title">${esc(s.subject||'Chat Session')}</div>
      <div class="sup-item-meta">
        <span style="background:${sc}1a;color:${sc};padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600">${s.status}</span>
        <span style="font-size:11px;color:#94A3B8">${fmt.ago(s.updatedAt||s.createdAt)}</span>
      </div>
    </div>`;
  }).join('') :
    `<div class="d-empty"><div class="d-empty-ico">💬</div><div class="d-empty-ttl">No live chats</div></div>`;

  /* ── FAQ sub-tab ─────────────────────────────────────── */
  const faqRows = faqs.length ? faqs.map(f => `
    <tr>
      <td style="max-width:300px"><div style="font-size:13px;font-weight:600;color:#1E293B">${esc(f.question)}</div></td>
      <td><span class="bdg bdg-blue" style="font-size:10px">${esc(f.category)}</span></td>
      <td><span class="bdg ${f.published?'bdg-green':'bdg-grey'}">${f.published?'Published':'Draft'}</span></td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="edit-faq" data-id="${f.id}">Edit</button>
        <button class="btn-d btn-d-danger btn-d-sm" data-action="delete-faq" data-id="${f.id}" style="margin-left:4px">Delete</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="4" style="text-align:center;color:#94A3B8;padding:40px">No FAQ articles yet</td></tr>`;

  const openT = tickets.filter(t => t.status === 'OPEN').length;
  const inpT  = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const unassigned = tickets.filter(t => !t.assignedAgent).length;

  return `
  <div class="dash-page-hd">
    <div>
      <div class="dash-page-title">Support Admin</div>
      <div class="dash-page-sub">${openT} open · ${inpT} in progress · ${unassigned} unassigned</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-d btn-d-primary" id="btn-new-faq">+ New FAQ</button>
    </div>
  </div>

  <!-- Stats row -->
  <div class="dash-stats" style="margin-bottom:16px">
    <div class="dash-stat"><div class="dash-stat-ico ico-blue">${I.msg}</div><div class="dash-stat-lbl">Total Tickets</div><div class="dash-stat-val">${tickets.length}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-yellow">${I.bell}</div><div class="dash-stat-lbl">Open</div><div class="dash-stat-val">${openT}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-orange">${I.clock}</div><div class="dash-stat-lbl">In Progress</div><div class="dash-stat-val">${inpT}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-red">${I.alert}</div><div class="dash-stat-lbl">Unassigned</div><div class="dash-stat-val">${unassigned}</div></div>
  </div>

  <!-- Sub-tab bar -->
  <div style="display:flex;gap:8px;margin-bottom:16px;border-bottom:2px solid #F1F5F9;padding-bottom:0">
    ${[{id:'tickets',label:`🎫 Tickets (${tickets.length})`},{id:'chats',label:`💬 Live Chat (${chatSessions.filter(s=>s.status!=='CLOSED').length})`},{id:'faq',label:`📚 FAQ (${faqs.length})`}].map(st=>`
      <button class="sup-main-tab ${_supSubTab===st.id?'active':''}" data-sup-main="${st.id}">${st.label}</button>
    `).join('')}
  </div>

  <!-- Tickets panel -->
  <div id="sup-panel-tickets" style="${_supSubTab==='tickets'?'':'display:none'}">
    <div class="sup-layout">
      <div class="sup-list">
        ${filterBar}
        <div id="sup-ticket-list">${ticketListHtml}</div>
      </div>
      <div class="sup-chat" id="sup-chat-panel">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8">
          <div style="text-align:center"><div style="font-size:36px;margin-bottom:8px">🎫</div><div style="font-weight:600">Select a ticket to view</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Chats panel -->
  <div id="sup-panel-chats" style="${_supSubTab==='chats'?'':'display:none'}">
    <div class="sup-layout">
      <div class="sup-list">
        <div>${chatListHtml}</div>
      </div>
      <div class="sup-chat" id="sup-chat-panel-live">
        <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8">
          <div style="text-align:center"><div style="font-size:36px;margin-bottom:8px">💬</div><div style="font-weight:600">Select a chat to view</div></div>
        </div>
      </div>
    </div>
  </div>

  <!-- FAQ panel -->
  <div id="sup-panel-faq" style="${_supSubTab==='faq'?'':'display:none'}">
    <div class="dash-card" style="overflow:auto">
      <table class="d-table" style="width:100%">
        <thead><tr><th>Question</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="faq-tbody">${faqRows}</tbody>
      </table>
    </div>
  </div>

  <!-- FAQ drawer modal -->
  <div id="faq-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;align-items:center;justify-content:center">
    <div style="background:white;border-radius:16px;padding:28px;width:560px;max-width:95vw;max-height:90vh;overflow:auto">
      <div style="font-size:17px;font-weight:700;margin-bottom:20px" id="faq-modal-title">New FAQ</div>
      <div class="f-field"><label class="f-lbl">Question *</label><input class="f-inp" id="faq-question"></div>
      <div class="f-field"><label class="f-lbl">Answer *</label><textarea class="f-inp" id="faq-answer" rows="5" style="resize:vertical"></textarea></div>
      <div class="f-field"><label class="f-lbl">Category *</label><input class="f-inp" id="faq-category" placeholder="e.g. general, shipping, returns"></div>
      <div class="f-field"><label class="f-lbl">Published</label><label class="d-toggle" style="margin-top:8px"><input type="checkbox" id="faq-published" checked><span class="d-tog-slider"></span></label></div>
      <input type="hidden" id="faq-edit-id">
      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn-d btn-d-sec" style="flex:1" id="faq-modal-cancel">Cancel</button>
        <button class="btn-d btn-d-primary" style="flex:2" id="faq-modal-save">Save FAQ</button>
      </div>
    </div>
  </div>`;
};

// ── Finance helpers ───────────────────────────────────────
function finMetric(label, value, cls = '') {
  return `<div class="fin-metric"><span class="fin-metric-lbl">${label}</span><span class="fin-metric-val ${cls}">${fmt.money(value)}</span></div>`;
}
function finMetricPct(label, value) {
  return `<div class="fin-metric"><span class="fin-metric-lbl">${label}</span><span class="fin-metric-val">${Number(value||0).toFixed(2)}%</span></div>`;
}
function finDateBar(subTab) {
  const tabs = [
    { id:'overview',       label:'Overview' },
    { id:'expenses',       label:'Expenses' },
    { id:'taxes',          label:'Taxes' },
    { id:'pl',             label:'P&L Report' },
    { id:'mgmt',           label:'Financial Mgmt' },
    { id:'reconciliation', label:'💳 Reconciliation' },
  ];
  const tabsHtml = tabs.map(t =>
    `<button class="btn-d ${_finSubTab===t.id?'btn-d-primary':'btn-d-sec'} btn-d-sm" data-action="fin-subtab" data-tab="${t.id}">${t.label}</button>`
  ).join('');
  return `
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
    ${tabsHtml}
    <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
      <input type="date" class="dash-inp" id="fin-date-from" value="${_finDateFrom}" style="width:130px">
      <span style="color:#94A3B8;font-size:12px">to</span>
      <input type="date" class="dash-inp" id="fin-date-to" value="${_finDateTo}" style="width:130px">
      <button class="btn-d btn-d-primary btn-d-sm" id="btn-fin-apply">Apply</button>
    </div>
  </div>`;
}

// ── Finance: Overview ─────────────────────────────────────
async function finOverview() {
  let s = {};
  try { const r = await ApiService.getFinanceStats({ startDate: _finDateFrom, endDate: _finDateTo }); s = r.data || r || {}; } catch(_){}
  const rev = s.revenue || s.netRevenue || 0;
  const exp = s.expenses || 0;
  const profit = s.netProfit || (rev - exp);
  const margin = rev ? (profit / rev * 100) : 0;
  return `
  <div class="dash-stats">
    <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Net Revenue</div><div class="dash-stat-val">${fmt.money(rev)}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-red">${I.dollar}</div><div class="dash-stat-lbl">Expenses</div><div class="dash-stat-val">${fmt.money(exp)}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ${profit>=0?'ico-green':'ico-red'}">${I.dollar}</div><div class="dash-stat-lbl">Net Profit</div><div class="dash-stat-val">${fmt.money(profit)}</div><div class="dash-stat-trend ${profit>=0?'up':'down'}">${margin>=0?'▲':'▼'} ${Math.abs(margin).toFixed(1)}% margin</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-purple">${I.percent}</div><div class="dash-stat-lbl">Tax Collected</div><div class="dash-stat-val">${fmt.money(s.taxCollected||0)}</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Finance Summary</div>
      ${finMetric('Gross Revenue', s.grossRevenue||rev, 'pos')}
      ${finMetric('Refunds', s.refunds||0, 'neg')}
      ${finMetric('Net Revenue', rev, 'pos')}
      ${finMetric('Operating Expenses', exp, 'neg')}
      ${finMetric('Tax Collected', s.taxCollected||0)}
      <div class="fin-metric" style="border-top:2px solid #E8ECF0;margin-top:8px;padding-top:12px">
        <span class="fin-metric-lbl" style="font-weight:700">Net Profit</span>
        <span class="fin-metric-val ${profit>=0?'pos':'neg'}" style="font-size:16px">${fmt.money(profit)}</span>
      </div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Receivables & Orders</div>
      ${finMetric('Accounts Receivable', s.accountsReceivable||0)}
      <div class="fin-metric"><span class="fin-metric-lbl">Paid Orders</span><span class="fin-metric-val">${fmt.num(s.paidOrders||0)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Refunded Returns</span><span class="fin-metric-val">${fmt.num(s.refundedReturns||0)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Expense Records</span><span class="fin-metric-val">${fmt.num(s.expenseRecords||0)}</span></div>
    </div>
  </div>`;
}

// ── Finance: Expenses ─────────────────────────────────────
async function finExpenses() {
  let expenses = [];
  try {
    const r = await ApiService.getExpenses({ startDate: _finDateFrom, endDate: _finDateTo });
    expenses = extractList(r);
    _expenseCache = expenses;
  } catch(_){}

  const rows = expenses.length ? expenses.map(e => `
    <tr>
      <td class="td-sm">${fmt.date(e.expenseDate)}</td>
      <td class="td-b">${e.category||'—'}</td>
      <td>${e.description||'—'}</td>
      <td>${fmt.money(e.amount||0)}</td>
      <td>${statusBdg(e.status||'PENDING')}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-expense" data-id="${e.id}" title="Edit">${I.edit}</button>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="expense-status" data-id="${e.id}" data-status="APPROVED" title="Approve">✓</button>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="expense-status" data-id="${e.id}" data-status="PAID" title="Mark Paid">$</button>
        <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-expense" data-id="${e.id}" title="Delete">${I.trash}</button>
      </td>
    </tr>`) .join('') :
    `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">💸</div><div class="d-empty-ttl">No expenses found</div></div></td></tr>`;

  const total = expenses.reduce((s, e) => s + (Number(e.amount)||0), 0);
  return `
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Expenses</span>
      <span class="dash-tcard-count">${expenses.length} records · ${fmt.money(total)}</span>
      <div class="dash-tcard-acts">
        <select class="dash-sel" id="expense-status-filter">
          <option value="">All Status</option>
          <option>PENDING</option><option>APPROVED</option><option>PAID</option>
        </select>
        <button class="btn-d btn-d-primary btn-d-sm" id="btn-add-expense">${I.plus} Add Expense</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="expenses-tbody">${rows}</tbody>
    </table>
  </div>
  <!-- Expense form modal -->
  <div id="expense-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;align-items:center;justify-content:center">
    <div style="background:#fff;border-radius:12px;padding:24px;width:420px;max-width:95vw">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-weight:700;font-size:15px" id="expense-modal-title">Add Expense</div>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" id="btn-close-expense-modal">${I.x}</button>
      </div>
      <input type="hidden" id="expense-modal-id">
      <div class="f-field"><label class="f-lbl">Category *</label><input class="f-inp" id="exp-category" placeholder="e.g. Rent, Salaries, Utilities"></div>
      <div class="f-field"><label class="f-lbl">Amount (RWF) *</label><input class="f-inp" type="number" id="exp-amount" min="0.01" step="0.01"></div>
      <div class="f-field"><label class="f-lbl">Date *</label><input class="f-inp" type="date" id="exp-date" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="f-field"><label class="f-lbl">Status *</label>
        <select class="dash-sel" id="exp-status" style="width:100%">
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
        </select>
      </div>
      <div class="f-field"><label class="f-lbl">Description</label><textarea class="f-inp" id="exp-desc" rows="2" placeholder="Optional notes"></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn-d btn-d-sec" id="btn-cancel-expense">Cancel</button>
        <button class="btn-d btn-d-primary" id="btn-save-expense">Save Expense</button>
      </div>
      <div id="expense-modal-err" style="margin-top:8px;font-size:12px;color:#ef4444;display:none"></div>
    </div>
  </div>`;
}

// ── Finance: Taxes ────────────────────────────────────────
async function finTaxes() {
  let records = []; let summary = {};
  try {
    const [rr, rs] = await Promise.all([
      ApiService.getTaxRecords({ startDate: _finDateFrom, endDate: _finDateTo }),
      ApiService.getTaxSummary({ startDate: _finDateFrom, endDate: _finDateTo }),
    ]);
    records = extractList(rr);
    summary = rs.data || rs || {};
  } catch(_){}

  const rows = records.length ? records.map(t => `
    <tr>
      <td class="td-sm">${fmt.date(t.taxDate||t.filingDate)}</td>
      <td><span class="bdg bdg-blue">${t.taxType||'—'}</span></td>
      <td>${t.orderNumber||t.orderId||'—'}</td>
      <td>${fmt.money(t.taxableAmount||0)}</td>
      <td>${fmt.money(t.amount||0)}</td>
      <td>${t.taxRate!=null?Number(t.taxRate).toFixed(2)+'%':'—'}</td>
      <td>${statusBdg(t.status||'PENDING')}</td>
    </tr>`) .join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🧾</div><div class="d-empty-ttl">No tax records found</div></div></td></tr>`;

  return `
  <div class="dash-stats" style="margin-bottom:16px">
    <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Taxable Sales</div><div class="dash-stat-val">${fmt.money(summary.taxableSales||0)}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-purple">${I.percent}</div><div class="dash-stat-lbl">Tax Collected</div><div class="dash-stat-val">${fmt.money(summary.taxCollected||0)}</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-blue">${I.bar}</div><div class="dash-stat-lbl">Total Records</div><div class="dash-stat-val">${fmt.num(summary.totalRecords||records.length)}</div></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Tax Records</span>
      <div class="dash-tcard-acts" style="display:flex;gap:8px;align-items:center">
        <div id="tax-record-form" style="display:none;gap:6px;align-items:center">
          <input class="dash-inp" id="tax-order-id" placeholder="Order UUID…" style="width:280px;font-size:12px">
          <button class="btn-d btn-d-primary btn-d-sm" id="btn-do-record-tax">Record</button>
          <button class="btn-d btn-d-sec btn-d-sm" id="btn-cancel-record-tax">✕</button>
        </div>
        <button class="btn-d btn-d-primary btn-d-sm" id="btn-show-record-tax">+ Record Tax</button>
        <button class="btn-d btn-d-sec btn-d-sm" id="btn-export-taxes">${I.download} Export CSV</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Date</th><th>Type</th><th>Order</th><th>Taxable Amount</th><th>Tax Amount</th><th>Rate</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ── Finance: P&L ──────────────────────────────────────────
async function finPL() {
  let pl = {};
  try { const r = await ApiService.getProfitLoss({ startDate: _finDateFrom, endDate: _finDateTo }); pl = r.data || r || {}; } catch(_){}
  return `
  <div class="dash-chart-card" style="max-width:540px">
    <div class="dash-chart-hd" style="margin-bottom:16px">Profit & Loss — ${fmt.date(_finDateFrom)} to ${fmt.date(_finDateTo)}</div>
    <div style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Revenue</div>
    ${finMetric('Sales Revenue', pl.salesRevenue||0, 'pos')}
    ${finMetric('Refunds', pl.refunds||0, 'neg')}
    ${finMetric('Net Sales', pl.netSales||0, 'pos')}
    <div style="font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px">Costs</div>
    ${finMetric('Operating Expenses', pl.operatingExpenses||0, 'neg')}
    ${finMetric('Tax Collected', pl.taxCollected||0)}
    <div class="fin-metric" style="border-top:2px solid #E8ECF0;margin-top:8px;padding-top:12px">
      <span class="fin-metric-lbl" style="font-weight:700">Gross Profit</span>
      <span class="fin-metric-val ${(pl.grossProfit||0)>=0?'pos':'neg'}" style="font-size:15px">${fmt.money(pl.grossProfit||0)}</span>
    </div>
    <div class="fin-metric" style="margin-top:4px">
      <span class="fin-metric-lbl" style="font-weight:700">Net Profit</span>
      <span class="fin-metric-val ${(pl.netProfit||0)>=0?'pos':'neg'}" style="font-size:16px">${fmt.money(pl.netProfit||0)}</span>
    </div>
    ${finMetricPct('Profit Margin', pl.profitMarginPercent||0)}
  </div>`;
}

// ── Finance: Financial Management ─────────────────────────
async function finMgmt() {
  let m = {};
  try { const r = await ApiService.getFinancialManagement({ startDate: _finDateFrom, endDate: _finDateTo }); m = r.data || r || {}; } catch(_){}
  return `
  <div class="dash-page-acts" style="margin-bottom:16px">
    <button class="btn-d btn-d-sec" id="btn-export-fin-mgmt">${I.download} Export CSV</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Revenue</div>
      ${finMetric('Gross Revenue', m.grossRevenue||0, 'pos')}
      ${finMetric('Refunds', m.refunds||0, 'neg')}
      ${finMetric('Net Revenue', m.netRevenue||0, 'pos')}
      ${finMetric('Taxable Revenue', m.taxableRevenue||0)}
      ${finMetric('Tax Collected', m.taxCollected||0)}
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Expenses</div>
      ${finMetric('Operating Expenses', m.operatingExpenses||0, 'neg')}
      ${finMetric('Paid Expenses', m.paidExpenses||0, 'neg')}
      ${finMetric('Pending Expenses', m.pendingExpenses||0)}
      <div class="fin-metric"><span class="fin-metric-lbl">Expense Records</span><span class="fin-metric-val">${fmt.num(m.expenseRecords||0)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Pending Records</span><span class="fin-metric-val">${fmt.num(m.pendingExpenseRecords||0)}</span></div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Profitability</div>
      ${finMetric('Gross Profit', m.grossProfit||0, (m.grossProfit||0)>=0?'pos':'neg')}
      ${finMetric('Net Profit', m.netProfit||0, (m.netProfit||0)>=0?'pos':'neg')}
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Cash Position</div>
      ${finMetric('Accounts Receivable', m.accountsReceivable||0)}
      ${finMetric('Tax Liability', m.taxLiability||0)}
      ${finMetric('Est. Cash Position', m.estimatedCashPosition||0, (m.estimatedCashPosition||0)>=0?'pos':'neg')}
      <div class="fin-metric"><span class="fin-metric-lbl">Receivable Orders</span><span class="fin-metric-val">${fmt.num(m.receivableOrders||0)}</span></div>
      <div class="fin-metric"><span class="fin-metric-lbl">Revenue Orders</span><span class="fin-metric-val">${fmt.num(m.revenueOrders||0)}</span></div>
    </div>
  </div>`;
}

// ── Finance: Reconciliation ───────────────────────────────
async function finReconciliation() {
  let summary = {};
  let txns    = [];
  try {
    const [sRes, tRes] = await Promise.allSettled([
      ApiService.getReconciliationSummary(),
      ApiService.getReconciliationTransactions(),
    ]);
    if (sRes.status === 'fulfilled') summary = sRes.value?.data || sRes.value || {};
    if (tRes.status === 'fulfilled') txns    = tRes.value?.data || tRes.value || [];
    if (!Array.isArray(txns)) txns = [];
  } catch(_){}

  const breakdown = summary.statusBreakdown || {};
  const rcBdg = s => {
    const m = { MATCHED:'bdg-green', PENDING:'bdg-yellow', MISMATCH:'bdg-red', UNRECONCILED:'bdg-purple' };
    return `<span class="bdg ${m[s]||'bdg-blue'}">${s||'—'}</span>`;
  };

  const statCards = [
    { label:'Total Transactions', value: fmt.num(summary.totalTransactions||0), ico:'💳', color:'#3b82f6' },
    { label:'Matched',            value: fmt.num(breakdown.MATCHED||0),          ico:'✅', color:'#10b981' },
    { label:'Mismatches',         value: fmt.num(breakdown.MISMATCH||0),         ico:'⚠️', color:'#ef4444' },
    { label:'Matched Amount',     value: fmt.money(summary.matchedAmount||0),    ico:'💰', color:'#8b5cf6' },
  ].map(c => `
    <div class="dash-stat-card" style="border-top:3px solid ${c.color}">
      <div class="dash-stat-ico">${c.ico}</div>
      <div class="dash-stat-val">${c.value}</div>
      <div class="dash-stat-lbl">${c.label}</div>
    </div>`).join('');

  const rows = txns.length ? txns.map(t => `
    <tr>
      <td class="td-sm" title="${t.id||''}" style="font-size:10px;color:#94A3B8;max-width:80px;overflow:hidden;text-overflow:ellipsis">${(t.id||'').slice(0,8)}…</td>
      <td class="td-b">${esc(t.provider||'—')}</td>
      <td class="td-m">${esc(t.paymentReference||'—')}</td>
      <td>${esc(t.transactionType||'—')}</td>
      <td>${fmt.money(t.amount||0)}</td>
      <td>${statusBdg(t.status)}</td>
      <td>${rcBdg(t.reconciliationStatus)}</td>
      <td class="td-sm" style="font-size:11px;max-width:180px;white-space:normal;color:#64748B">${esc(t.reconciliationNotes||'—')}</td>
      <td class="td-sm">${t.reconciledAt ? fmt.date(t.reconciledAt) : '—'}</td>
      <td>
        ${t.reconciliationStatus !== 'MATCHED' ? `<button class="btn-d btn-d-success btn-d-sm" data-action="reconcile-txn" data-id="${t.id}">Reconcile</button>` : `<span style="color:#10b981;font-size:12px">✓ Matched</span>`}
      </td>
    </tr>`).join('') :
    `<tr><td colspan="10"><div class="d-empty"><div class="d-empty-ico">💳</div><div class="d-empty-ttl">No transactions yet</div></div></td></tr>`;

  return `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
    ${statCards}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
    <div class="dash-chart-card" style="padding:16px 20px">
      <div style="font-weight:700;margin-bottom:12px;font-size:13px">Reconciliation Breakdown</div>
      ${Object.entries(breakdown).length ? Object.entries(breakdown).map(([k,v]) => {
        const pct = summary.totalTransactions ? Math.round(v/summary.totalTransactions*100) : 0;
        const clr = { MATCHED:'#10b981', PENDING:'#f59e0b', MISMATCH:'#ef4444', UNRECONCILED:'#8b5cf6' }[k] || '#94a3b8';
        return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="font-weight:600">${k}</span><span style="color:#64748B">${v} (${pct}%)</span>
          </div>
          <div style="height:8px;background:#F1F5F9;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${clr};border-radius:4px;transition:width .4s"></div>
          </div>
        </div>`;
      }).join('') : '<div style="color:#94A3B8;font-size:13px">No data yet</div>'}
    </div>
    <div class="dash-chart-card" style="padding:16px 20px">
      <div style="font-weight:700;margin-bottom:12px;font-size:13px">Amount Summary</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;padding:10px 14px;background:#F0FDF4;border-radius:10px;border-left:4px solid #10b981">
          <span style="font-size:13px;color:#064E3B;font-weight:600">Matched Amount</span>
          <span style="font-size:15px;font-weight:800;color:#10b981">${fmt.money(summary.matchedAmount||0)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 14px;background:#FFF7ED;border-radius:10px;border-left:4px solid #f59e0b">
          <span style="font-size:13px;color:#78350F;font-weight:600">Pending / Mismatch</span>
          <span style="font-size:15px;font-weight:800;color:#f59e0b">${fmt.money(summary.pendingOrMismatchAmount||0)}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">All Transactions</span>
      <span class="dash-tcard-count">${txns.length}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search reference or provider…" id="rec-search" style="width:200px">
        <select class="dash-sel" id="rec-status-filter">
          <option value="">All Statuses</option>
          <option>MATCHED</option><option>PENDING</option><option>MISMATCH</option><option>UNRECONCILED</option>
        </select>
        <button class="btn-d btn-d-primary btn-d-sm" id="btn-reconcile-all">⚡ Reconcile All</button>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="dt">
        <thead><tr><th>ID</th><th>Provider</th><th>Reference</th><th>Type</th><th>Amount</th><th>Pay Status</th><th>Rec. Status</th><th>Notes</th><th>Reconciled At</th><th>Action</th></tr></thead>
        <tbody id="rec-tbody">${rows}</tbody>
      </table>
    </div>
  </div>`;
}

// ── Finance ───────────────────────────────────────────────
TAB.finance = async () => {
  if (!isAdmin() && !isEmployee()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let content = '';
  if (_finSubTab === 'overview')  content = await finOverview();
  else if (_finSubTab === 'expenses') content = await finExpenses();
  else if (_finSubTab === 'taxes')    content = await finTaxes();
  else if (_finSubTab === 'pl')       content = await finPL();
  else if (_finSubTab === 'mgmt')          content = await finMgmt();
  else if (_finSubTab === 'reconciliation') content = await finReconciliation();

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Finance</div><div class="dash-page-sub">Revenue, expenses, taxes & profitability</div></div>
  </div>
  ${finDateBar(_finSubTab)}
  <div id="fin-content">${content}</div>`;
};

// ── Reports ───────────────────────────────────────────────
TAB.reports = async () => {
  const reportTypes = [
    { id:'sales',   title:'Sales Report',            desc:'Revenue, orders, AOV by date range',         icon:'📊', formats:['Excel'] },
    { id:'finance', title:'Financial Mgmt Report',   desc:'Full P&L, expenses, cash position export',   icon:'💰', formats:['CSV'] },
    { id:'finance', title:'Tax Records Export',       desc:'Tax collected, rates and filing status',     icon:'🧾', formats:['taxes'] },
    { id:'inventory',   title:'Inventory Report',    desc:'Stock levels — coming soon',                 icon:'📦', formats:[] },
    { id:'orders',      title:'Orders Report',       desc:'Full order history — coming soon',           icon:'🛒', formats:[] },
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
        ${r.formats.length ? r.formats.map(f => `<button class="btn-d btn-d-sec btn-d-sm" data-action="download-report" data-type="${r.id}" data-format="${f}">${I.download} ${f}</button>`).join('') : `<span style="font-size:12px;color:#94A3B8">Coming soon</span>`}
      </div>
    </div>`).join('')}
  </div>`;
};

// ── Users (Admin only) ────────────────────────────────────
TAB.users = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied. Admin only.</div>`;
  let users = []; let total = 0; let roles = [];
  try {
    const [uRes, rRes] = await Promise.allSettled([
      ApiService.getUsers({ page:0, size:20 }),
      ApiService.getRoles(),
    ]);
    if (uRes.status === 'fulfilled') {
      users = extractList(uRes.value);
      total = extractTotal(uRes.value, users);
      _userCache = users;
    }
    if (rRes.status === 'fulfilled') {
      const raw = rRes.value?.data || rRes.value;
      roles = Array.isArray(raw) ? raw : [];
    }
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
  </div>

  <!-- Roles list -->
  <div class="dash-chart-card" style="margin-top:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div class="dash-chart-hd" style="margin:0">System Roles</div>
        <div class="dash-chart-sub" style="margin:0">${roles.length} role${roles.length===1?'':'s'} defined</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
      ${roles.length ? roles.map(r => {
        const name = (r.name||'').replace('ROLE_','');
        const colors = { ADMIN:'#7c3aed', EMPLOYEE:'#2563eb', SUPPORT_AGENT:'#0891b2', CUSTOMER:'#059669' };
        const clr = colors[name] || '#64748b';
        const desc = { ADMIN:'Full system access', EMPLOYEE:'Store management', SUPPORT_AGENT:'Ticket & chat support', CUSTOMER:'Shopper account' }[name] || 'Custom role';
        return `
        <div style="border:1.5px solid ${clr}22;border-radius:12px;padding:14px 16px;background:${clr}08">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <div style="width:10px;height:10px;border-radius:50%;background:${clr}"></div>
            <span style="font-weight:700;font-size:13px;color:${clr}">${name}</span>
          </div>
          <div style="font-size:12px;color:#64748B">${desc}</div>
          ${r.id ? `<div style="font-size:10px;color:#CBD5E1;margin-top:6px;font-family:monospace">${(r.id||'').slice(0,16)}…</div>` : ''}
        </div>`;
      }).join('') : `<div style="color:#94A3B8;font-size:13px">No roles defined</div>`}
    </div>
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
function auditStatusBadge(l) {
  const st = (l.status || '').toString().toUpperCase();
  // Infer from HTTP status code if status field is numeric
  const httpCode = parseInt(l.httpStatus || l.responseStatus || 0);
  const isFail = st === 'FAILURE' || st === 'FAILED' || st === 'ERROR'
               || (httpCode >= 400) || st === 'FORBIDDEN' || st === 'UNAUTHORIZED';
  return isFail
    ? `<span style="background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">FAILURE</span>`
    : `<span style="background:#f0fdf4;color:#22c55e;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">SUCCESS</span>`;
}

const buildAuditRows = (list) => list.length ? list.map(l => {
    const st = (l.status || '').toString().toUpperCase();
    const httpCode = parseInt(l.httpStatus || l.responseStatus || 0);
    const isFail = st === 'FAILURE' || st === 'FAILED' || st === 'ERROR'
                 || (httpCode >= 400) || st === 'FORBIDDEN' || st === 'UNAUTHORIZED';
    return `
    <tr style="${isFail ? 'background:#fff5f5;' : ''}">
      <td class="td-sm">${fmt.ago(l.timestamp||l.createdAt)}</td>
      <td class="td-b">${l.actorEmail||l.userEmail||'System'}</td>
      <td><span class="bdg ${isFail ? 'bdg-red' : 'bdg-blue'}">${l.action||l.actionType||'ACTION'}</span></td>
      <td>${l.entityType||l.resource||'—'}</td>
      <td class="td-sm" style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.details||l.description||'—'}</td>
      <td class="td-m">${l.ipAddress||'—'}</td>
      <td>${auditStatusBadge(l)}</td>
    </tr>`}).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">📋</div><div class="d-empty-ttl">No matching records</div></div></td></tr>`;

// Login-attempt rows for the violations sub-tab
const buildAttemptRows = (list) => list.length ? list.map(a => `
    <tr style="${a.success ? '' : 'background:#fff5f5;'}">
      <td class="td-sm">${fmt.ago(a.timestamp||a.createdAt)}</td>
      <td class="td-b">${a.email||'—'}</td>
      <td class="td-m">${a.ipAddress||'—'}</td>
      <td>${a.success
        ? `<span style="background:#f0fdf4;color:#22c55e;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">SUCCESS</span>`
        : `<span style="background:#fef2f2;color:#ef4444;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;">FAILED</span>`}
      </td>
      <td>${a.failureReason||'—'}</td>
    </tr>`).join('') :
    `<tr><td colspan="5"><div class="d-empty"><div class="d-empty-ico">🔒</div><div class="d-empty-ttl">No login attempts recorded</div></div></td></tr>`;

let _loginAttemptCache = [];

TAB.audit = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let logs = []; let total = 0;
  let attempts = [];
  try {
    const [auditRes, attRes] = await Promise.allSettled([
      ApiService.getAuditLogs({ page:0, size:100 }),
      fetch('http://localhost:8080/api/admin/audit/login-attempts?page=0&size=100', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') }
      }).then(r => r.json()).catch(() => ({}))
    ]);
    if (auditRes.status === 'fulfilled') {
      logs  = extractList(auditRes.value);
      total = extractTotal(auditRes.value, logs);
    }
    if (attRes.status === 'fulfilled') {
      attempts = extractList(attRes.value);
    }
  } catch(_){}
  _auditCache = logs;
  _loginAttemptCache = attempts;

  const violations = logs.filter(l => {
    const st = (l.status || '').toString().toUpperCase();
    const code = parseInt(l.httpStatus || l.responseStatus || 0);
    return st === 'FAILURE' || st === 'FAILED' || st === 'ERROR' || code >= 400;
  });
  const failedLogins = attempts.filter(a => !a.success);

  return `
  <div class="dash-page-hd">
    <div>
      <div class="dash-page-title">Audit &amp; Access Monitoring</div>
      <div class="dash-page-sub">${fmt.num(total)} events · <span style="color:#ef4444;font-weight:600;">${violations.length} violations</span> · ${failedLogins.length} failed logins</div>
    </div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-audit">${I.download} Export CSV</button>
    </div>
  </div>

  <!-- Sub-tabs -->
  <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px;">
    <button class="audit-subtab active" data-subtab="activity" style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#FF6B00;border-bottom:2px solid #FF6B00;margin-bottom:-2px;">
      All Activity <span style="background:#e2e8f0;color:#475569;border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px;">${fmt.num(total)}</span>
    </button>
    <button class="audit-subtab" data-subtab="violations" style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px;">
      Access Violations <span style="background:#fef2f2;color:#ef4444;border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px;">${violations.length}</span>
    </button>
    <button class="audit-subtab" data-subtab="logins" style="padding:9px 18px;border:none;background:none;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;border-bottom:2px solid transparent;margin-bottom:-2px;">
      Login Attempts <span style="background:${failedLogins.length > 0 ? '#fef2f2;color:#ef4444' : '#e2e8f0;color:#475569'};border-radius:20px;padding:1px 7px;font-size:11px;margin-left:4px;">${attempts.length}</span>
    </button>
  </div>

  <!-- All Activity panel -->
  <div id="audit-panel-activity">
    <div class="dash-tcard">
      <div class="dash-tcard-hd"><span class="dash-tcard-title">Recent Activity</span>
        <div class="dash-tcard-acts" style="display:flex;gap:8px;">
          <input class="dash-inp" id="audit-search" placeholder="Search by email, action…" style="width:200px">
          <select class="dash-filter-select" id="audit-status-filter">
            <option value="">All Status</option>
            <option value="success">Success only</option>
            <option value="failure">Failures only</option>
          </select>
        </div>
      </div>
      <table class="dt">
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th><th>IP</th><th>Status</th></tr></thead>
        <tbody id="audit-tbody">${buildAuditRows(logs)}</tbody>
      </table>
    </div>
  </div>

  <!-- Violations panel -->
  <div id="audit-panel-violations" style="display:none;">
    <div class="dash-tcard" style="border-left:4px solid #ef4444;">
      <div class="dash-tcard-hd">
        <span class="dash-tcard-title" style="color:#ef4444;">⚠ Access Violations &amp; Errors</span>
      </div>
      <table class="dt">
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th><th>IP</th><th>Status</th></tr></thead>
        <tbody>${buildAuditRows(violations)}</tbody>
      </table>
    </div>
  </div>

  <!-- Login Attempts panel -->
  <div id="audit-panel-logins" style="display:none;">
    <div class="dash-tcard" style="border-left:4px solid #f59e0b;">
      <div class="dash-tcard-hd">
        <span class="dash-tcard-title">🔑 Login Attempts</span>
        <span style="font-size:12px;color:#ef4444;font-weight:600;">${failedLogins.length} failed</span>
      </div>
      ${attempts.length === 0 ? `<div class="dash-empty">No login attempt data available.<br><small style="color:#94a3b8">Requires GET /api/admin/login-attempts endpoint.</small></div>` : `
      <table class="dt">
        <thead><tr><th>Time</th><th>Email</th><th>IP Address</th><th>Result</th><th>Failure Reason</th></tr></thead>
        <tbody>${buildAttemptRows(attempts)}</tbody>
      </table>`}
    </div>
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
      <div style="display:flex;gap:4px;margin-left:auto">
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="view-backup" data-id="${b.id}" title="View detail">${I.eye}</button>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="restore-backup" data-id="${b.id}">Restore</button>
      </div>
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
  <div class="dash-page-hd"><div><div class="dash-page-title">System</div><div class="dash-page-sub">Backups, configuration, health & developer tools</div></div></div>
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
  </div>

  <!-- Developer Tools -->
  <div class="dash-chart-card" style="margin-top:16px">
    <div class="dash-chart-hd" style="margin-bottom:4px">🛠 Developer Tools</div>
    <div class="dash-chart-sub" style="margin-bottom:20px">Internal backend tools — not part of the customer-facing application</div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">

      <!-- MTN Sandbox Test Runner -->
      <div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:18px">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">📱 MTN MoMo Sandbox Tests</div>
        <div style="font-size:12px;color:#64748B;margin-bottom:14px">Runs 13 automated test cases against the MTN MoMo sandbox — Collection API (request-to-pay, token, balance) and Disbursement API (transfer, refund). Generates a <code>mtn_sandbox_test_report.md</code> on the server.</div>
        <div class="f-field" style="margin-bottom:8px">
          <label class="f-lbl" style="font-size:11px">Collection Subscription Key <span style="color:#94A3B8">(optional — uses env default)</span></label>
          <input class="f-inp" id="mtn-col-key" placeholder="Ocp-Apim-Subscription-Key for Collection…" style="font-size:12px">
        </div>
        <div class="f-field" style="margin-bottom:12px">
          <label class="f-lbl" style="font-size:11px">Disbursement Subscription Key <span style="color:#94A3B8">(optional)</span></label>
          <input class="f-inp" id="mtn-dis-key" placeholder="Ocp-Apim-Subscription-Key for Disbursement…" style="font-size:12px">
        </div>
        <button class="btn-d btn-d-primary" id="btn-run-mtn-tests" style="width:100%">▶ Run MTN Sandbox Tests</button>
        <div id="mtn-test-status" style="margin-top:10px;font-size:12px;display:none"></div>
        <div id="mtn-test-results" style="margin-top:12px;display:none;max-height:360px;overflow-y:auto"></div>
      </div>

      <!-- Webhook Handler info -->
      <div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:18px">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">🔗 Payment Webhook Endpoints</div>
        <div style="font-size:12px;color:#64748B;margin-bottom:14px">These endpoints are called by external payment providers, not the frontend. Configure each provider's dashboard to point callbacks here.</div>
        ${[
          { provider:'MTN_MOMO',  path:'/api/payments/webhook/MTN_MOMO',  desc:'MTN Mobile Money callback' },
          { provider:'PAYPAL',    path:'/api/payments/webhook/PAYPAL',    desc:'PayPal IPN / webhook' },
          { provider:'BK_CARD',   path:'/api/payments/webhook/BK_CARD',   desc:'Bank of Kigali card webhook' },
          { provider:'AIRTEL',    path:'/api/payments/webhook/AIRTEL',    desc:'Airtel Money callback' },
        ].map(w => `
          <div style="margin-bottom:10px;padding:10px 12px;background:#F8FAFC;border-radius:8px;border-left:3px solid #6366f1">
            <div style="font-size:11px;font-weight:700;color:#4338ca;margin-bottom:2px">${w.provider}</div>
            <code style="font-size:10px;color:#0f172a;word-break:break-all">POST http://localhost:8080${w.path}?orderId={uuid}</code>
            <div style="font-size:11px;color:#64748B;margin-top:3px">${w.desc} · Header: <code>X-Signature</code></div>
          </div>`).join('')}
        <div style="margin-top:10px;padding:10px 12px;background:#F0FDF4;border-radius:8px;border-left:3px solid #10b981">
          <div style="font-size:11px;font-weight:700;color:#065f46;margin-bottom:2px">Payment Status Poll</div>
          <code style="font-size:10px;color:#0f172a">GET /api/payments/status/{orderId}</code>
          <div style="font-size:11px;color:#64748B;margin-top:3px">Frontend polls this every 3s while awaiting MTN confirmation</div>
        </div>
      </div>

      <!-- Product test ping -->
      <div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:18px">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">🏓 API Health Pings</div>
        <div style="font-size:12px;color:#64748B;margin-bottom:14px">Quick connectivity checks against key backend endpoints. These are internal test endpoints not exposed to the public.</div>
        <div id="ping-results" style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">
          ${[
            { id:'ping-products', label:'Product API', endpoint:'GET /api/products/_test' },
            { id:'ping-auth',     label:'Auth Service', endpoint:'GET /api/auth/health (inferred)' },
            { id:'ping-db',       label:'Inventory sync', endpoint:'GET /api/inventory' },
          ].map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#F8FAFC;border-radius:8px" id="${p.id}-row">
              <div>
                <div style="font-size:12px;font-weight:600">${p.label}</div>
                <code style="font-size:10px;color:#94A3B8">${p.endpoint}</code>
              </div>
              <span id="${p.id}-badge" class="bdg bdg-blue">Untested</span>
            </div>`).join('')}
        </div>
        <button class="btn-d btn-d-sec" id="btn-run-pings" style="width:100%">🏓 Ping All Endpoints</button>
      </div>

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
    <div class="f-field" style="margin-bottom:14px;">
      <label class="f-lbl" style="color:#FF6B00;font-weight:700;">📋 Load from existing product</label>
      <div style="position:relative;" id="prod-combo-wrap">
        <input class="f-inp" id="prod-combo-input" placeholder="Type to search products…" autocomplete="off"
          style="padding-right:32px;">
        <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none;">▾</span>
        <div id="prod-combo-list" style="display:none;position:absolute;z-index:999;left:0;right:0;top:100%;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:2px;"></div>
      </div>
    </div>
    <hr style="border:none;border-top:1px dashed #e2e8f0;margin-bottom:14px;">
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

  if (type === 'discount') return `
    <div class="f-field"><label class="f-lbl">Name *</label><input class="f-inp" id="d-disc-name" value="${data?.name||''}"></div>
    <div class="f-field"><label class="f-lbl">Description *</label><input class="f-inp" id="d-disc-desc" value="${data?.description||''}"></div>
    <div class="f-field"><label class="f-lbl">Discount Percentage * <small style="color:#94A3B8">(e.g. 15 for 15%)</small></label><input class="f-inp" type="number" min="0.01" max="100" step="0.01" id="d-disc-pct" value="${data?.discountPercentage||''}"></div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Start Date</label><input class="f-inp" type="datetime-local" id="d-disc-start" value="${data?.startDate ? data.startDate.slice(0,16) : ''}"></div>
      <div class="f-field"><label class="f-lbl">End Date</label><input class="f-inp" type="datetime-local" id="d-disc-end" value="${data?.endDate ? data.endDate.slice(0,16) : ''}"></div>
    </div>
    <div class="f-field"><label class="f-lbl">Active</label><label class="d-toggle" style="margin-top:8px"><input type="checkbox" id="d-disc-active" ${data?.active!==false?'checked':''}><span class="d-tog-slider"></span></label></div>`;

  if (type === 'coupon') return `
    <div class="f-row"><div class="f-field"><label class="f-lbl">Coupon Code *</label><input class="f-inp" id="d-coup-code" value="${data?.code||''}" style="text-transform:uppercase"></div><div class="f-field"><label class="f-lbl">Discount Type</label><select class="f-sel" id="d-coup-type"><option value="PERCENTAGE" ${data?.discountType==='PERCENTAGE'?'selected':''}>Percentage</option><option value="FIXED" ${data?.discountType==='FIXED'?'selected':''}>Fixed Amount</option></select></div></div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Discount Value *</label><input class="f-inp" type="number" id="d-coup-val" value="${data?.discountValue||''}"></div><div class="f-field"><label class="f-lbl">Min. Purchase</label><input class="f-inp" type="number" id="d-coup-min" value="${data?.minimumPurchase||''}"></div></div>
    <div class="f-row"><div class="f-field"><label class="f-lbl">Usage Limit</label><input class="f-inp" type="number" id="d-coup-limit" value="${data?.usageLimit||''}"></div><div class="f-field"><label class="f-lbl">Expiry Date</label><input class="f-inp" type="date" id="d-coup-exp" value="${data?.expiryDate||''}"></div></div>`;

  if (type === 'banner') {
    const existingImg = data?.imageUrl
      ? (data.imageUrl.startsWith('/uploads/') ? 'http://localhost:8080' + data.imageUrl : data.imageUrl)
      : '';
    return `
    <div class="f-field"><label class="f-lbl">Title *</label><input class="f-inp" id="d-ban-title" value="${data?.title||''}"></div>
    <div class="f-field"><label class="f-lbl">Subtitle</label><input class="f-inp" id="d-ban-sub" value="${data?.subtitle||''}"></div>
    <div class="f-field"><label class="f-lbl">CTA Button Text</label><input class="f-inp" id="d-ban-cta" value="${data?.ctaText||data?.buttonText||''}"></div>
    <div class="f-field"><label class="f-lbl">CTA Link</label><input class="f-inp" id="d-ban-link" value="${data?.ctaLink||data?.linkUrl||''}"></div>
    <div class="f-field">
      <label class="f-lbl">Banner Image</label>
      <div id="d-ban-img-wrap" style="border:2px dashed #e2e8f0;border-radius:10px;padding:16px;text-align:center;cursor:pointer;background:#fafafa;transition:border-color .2s;" onclick="document.getElementById('d-ban-img-file').click()">
        ${existingImg
          ? `<img id="d-ban-img-preview" src="${existingImg}" style="max-height:120px;max-width:100%;border-radius:6px;display:block;margin:0 auto 8px;">`
          : `<div id="d-ban-img-preview" style="font-size:32px;margin-bottom:6px;">🖼️</div>`}
        <div style="font-size:12px;color:#94a3b8;">Click to choose an image from your computer</div>
      </div>
      <input type="file" id="d-ban-img-file" accept="image/*" style="display:none">
      <input type="hidden" id="d-ban-img-existing" value="${data?.imageUrl||''}">
    </div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Display Order</label><input class="f-inp" type="number" id="d-ban-order" value="${data?.displayOrder||0}"></div>
      <div class="f-field"><label class="f-lbl">Active</label><label class="d-toggle" style="margin-top:8px"><input type="checkbox" id="d-ban-active" ${data?.active!==false?'checked':''}><span class="d-tog-slider"></span></label></div>
    </div>`;
  }

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

  if (type === 'supplier') return `
    <div class="f-field"><label class="f-lbl">Supplier Name *</label><input class="f-inp" id="d-sup-name" value="${data?.name||''}"></div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Contact Email *</label><input class="f-inp" type="email" id="d-sup-email" value="${data?.contactEmail||''}"></div>
      <div class="f-field"><label class="f-lbl">Phone</label><input class="f-inp" id="d-sup-phone" value="${data?.contactPhone||''}"></div>
    </div>
    <div class="f-field"><label class="f-lbl">Address</label><input class="f-inp" id="d-sup-addr" value="${data?.address||''}"></div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Performance Rating <small style="color:#94A3B8">(1–5)</small></label><input class="f-inp" type="number" min="1" max="5" step="0.1" id="d-sup-rating" value="${data?.performanceRating||''}"></div>
      <div class="f-field" style="padding-top:22px"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="d-sup-active" ${data?.active!==false?'checked':''}> Active supplier</label></div>
    </div>
    <div class="f-field"><label class="f-lbl">Notes</label><textarea class="f-ta" id="d-sup-notes" style="min-height:80px">${data?.notes||''}</textarea></div>`;

  if (type === 'procurement') {
    const supplierOpts = _supplierCache.map(s=>`<option value="${s.id}" ${data?.supplier?.id===s.id?'selected':''}>${s.name}</option>`).join('');
    const itemOpts     = _invCache.map(i=>`<option value="${i.id}" ${data?.inventoryItem?.id===i.id?'selected':''}>${i.productName||i.name||i.sku}</option>`).join('');
    return `
    <div class="f-field"><label class="f-lbl">Supplier *</label>
      <select class="f-inp" id="d-po-supplier"><option value="">Select supplier…</option>${supplierOpts}</select>
    </div>
    <div class="f-field"><label class="f-lbl">Inventory Item *</label>
      <select class="f-inp" id="d-po-item"><option value="">Select item…</option>${itemOpts}</select>
    </div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Quantity Ordered *</label><input class="f-inp" type="number" min="1" id="d-po-qty" value="${data?.quantityOrdered||''}"></div>
      <div class="f-field"><label class="f-lbl">Total Cost (RWF)</label><input class="f-inp" type="number" min="0" id="d-po-cost" value="${data?.totalCost||''}"></div>
    </div>
    <div class="f-field"><label class="f-lbl">Expected Delivery Date</label><input class="f-inp" type="date" id="d-po-eta" value="${data?.expectedDeliveryDate||''}"></div>`;
  }

  if (type === 'receive-po') return `
    <div class="d-alert d-alert-info" style="margin-bottom:14px">
      Recording stock receipt for purchase order. Stock will be automatically added to inventory.
    </div>
    <div class="f-field"><label class="f-lbl">Quantity Received *</label>
      <input class="f-inp" type="number" min="1" max="${data?.ordered||9999}" id="d-recv-qty" value="${data?.ordered||''}">
      <small style="color:#94A3B8;margin-top:4px;display:block">Ordered: ${data?.ordered||'?'} units</small>
    </div>`;

  if (type === 'inv-threshold') return `
    <div class="d-alert d-alert-info" style="margin-bottom:14px">
      Setting the reorder threshold for <strong>${data?.name||'this item'}</strong>. An alert fires when stock drops to or below this level.
    </div>
    <div class="f-field"><label class="f-lbl">Reorder Threshold *</label>
      <input class="f-inp" type="number" min="0" id="d-thresh-val" value="${data?.threshold||10}">
    </div>`;

  if (type === 'inv-item') return `
    <div class="d-alert d-alert-info" style="margin-bottom:14px">
      Creates a standalone inventory item. For product-linked inventory, use the sync button on the Inventory tab instead.
    </div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Product Name *</label><input class="f-inp" id="d-inv-name" placeholder="e.g. USB Hub 4-Port" value="${data?.productName||''}"></div>
      <div class="f-field"><label class="f-lbl">SKU</label><input class="f-inp" id="d-inv-sku" placeholder="e.g. USB-HUB-001" value="${data?.sku||''}"></div>
    </div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Initial Quantity *</label><input class="f-inp" type="number" min="0" id="d-inv-qty" value="${data?.quantity||0}"></div>
      <div class="f-field"><label class="f-lbl">Low Stock Threshold</label><input class="f-inp" type="number" min="0" id="d-inv-thresh" value="${data?.lowStockThreshold||10}"></div>
    </div>
    <div class="f-row">
      <div class="f-field"><label class="f-lbl">Location / Warehouse</label><input class="f-inp" id="d-inv-location" placeholder="e.g. Main Warehouse, Shelf A3" value="${data?.location||''}"></div>
      <div class="f-field"><label class="f-lbl">Unit</label><input class="f-inp" id="d-inv-unit" placeholder="e.g. pcs, kg, box" value="${data?.unit||''}"></div>
    </div>`;

  return `<div class="d-empty"><div class="d-empty-ico">📝</div><div class="d-empty-ttl">Form coming soon</div></div>`;
}

function drawerFooter(type, data) {
  const labels = { 'receive-po':'Confirm Receipt', 'inv-threshold':'Save Threshold', 'return-action': data?.action==='approve'?'Approve Return':'Reject Return' };
  const saveLabel = labels[type] || (data ? 'Update' : 'Create');
  const saveCls   = type==='return-action' ? (data?.action==='approve'?'btn-d-success':'btn-d-danger') : 'btn-d-primary';
  return `
    <button class="btn-d btn-d-sec" id="d-btn-cancel" style="flex:1">Cancel</button>
    <button class="btn-d ${saveCls}" id="d-btn-save" style="flex:2">${saveLabel}</button>`;
}

function bindDrawerEvents(type, data) {
  document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
  document.getElementById('d-btn-save')?.addEventListener('click', () => saveDrawer(type, data));

  if (type === 'product') {
    // ── Product combobox: search & auto-fill ──────────────────
    const comboInput = document.getElementById('prod-combo-input');
    const comboList  = document.getElementById('prod-combo-list');

    const renderComboItems = (q) => {
      const term = (q || '').toLowerCase();
      const matches = _productCache.filter(p =>
        !term ||
        (p.name || '').toLowerCase().includes(term) ||
        (p.sku  || '').toLowerCase().includes(term)
      );
      if (!matches.length) {
        comboList.innerHTML = `<div style="padding:10px 14px;font-size:13px;color:#94a3b8;">No products found</div>`;
      } else {
        comboList.innerHTML = matches.map(p => `
          <div class="prod-combo-item" data-id="${p.id}"
            style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;">${p.name||'—'}</span>
            <span style="color:#94a3b8;font-size:11px;">${p.sku||''}</span>
          </div>`).join('');
      }
      comboList.style.display = 'block';
    };

    comboInput?.addEventListener('focus', () => renderComboItems(comboInput.value));
    comboInput?.addEventListener('input', () => renderComboItems(comboInput.value));

    comboList?.addEventListener('click', e => {
      const item = e.target.closest('.prod-combo-item');
      if (!item) return;
      const p = _productCache.find(x => x.id === item.dataset.id);
      if (!p) return;

      // Fill all form fields
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
      set('d-prod-name',    p.name);
      set('d-prod-sku',     p.sku);
      set('d-prod-desc',    p.description);
      set('d-prod-price',   p.price);
      set('d-prod-compare', p.comparePrice || '');
      set('d-prod-stock',   p.stock ?? 0);
      const statusEl = document.getElementById('d-prod-status');
      if (statusEl) statusEl.value = p.status || 'ACTIVE';
      const featuredEl = document.getElementById('d-prod-featured');
      if (featuredEl) featuredEl.checked = !!p.featured;

      // Fill category
      if (p.categoryId || p.category?.id) {
        const catSel = document.getElementById('d-prod-cat');
        if (catSel) catSel.value = p.categoryId || p.category?.id || '';
      }

      // Fill image preview
      const imgUrl = p.imageUrl || p.images?.[0]?.url || '';
      if (imgUrl) {
        const src = imgUrl.startsWith('/uploads/') ? 'http://localhost:8080' + imgUrl : imgUrl;
        const preview = document.getElementById('d-prod-img-preview');
        if (preview) {
          if (preview.tagName === 'IMG') { preview.src = src; }
          else {
            const img = document.createElement('img');
            img.id = 'd-prod-img-preview';
            img.src = src;
            img.style.cssText = 'max-height:120px;max-width:100%;border-radius:6px;display:block;margin:0 auto 8px;';
            preview.replaceWith(img);
          }
        }
        document.getElementById('d-prod-img-url').value = imgUrl;
      }

      comboInput.value = p.name;
      comboList.style.display = 'none';
      showToast(`Loaded "${p.name}" — edit fields and save`, 'info');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function closeCombo(e) {
      if (!document.getElementById('prod-combo-wrap')?.contains(e.target)) {
        comboList.style.display = 'none';
        document.removeEventListener('click', closeCombo);
      }
    });

    // Hover highlight
    comboList?.addEventListener('mouseover', e => {
      const item = e.target.closest('.prod-combo-item');
      if (item) item.style.background = '#fff7f0';
    });
    comboList?.addEventListener('mouseout', e => {
      const item = e.target.closest('.prod-combo-item');
      if (item) item.style.background = '';
    });

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

  }

  if (type === 'banner') {
    const banFileInput = document.getElementById('d-ban-img-file');
    const banWrap      = document.getElementById('d-ban-img-wrap');
    const showBanPreview = (src) => {
      const preview = document.getElementById('d-ban-img-preview');
      if (preview?.tagName === 'IMG') { preview.src = src; }
      else {
        const img = document.createElement('img');
        img.id = 'd-ban-img-preview';
        img.src = src;
        img.style.cssText = 'max-height:120px;max-width:100%;border-radius:6px;display:block;margin:0 auto 8px;';
        preview?.replaceWith(img);
      }
    };
    banFileInput?.addEventListener('change', () => {
      const f = banFileInput.files[0];
      if (f) showBanPreview(URL.createObjectURL(f));
    });
    banWrap?.addEventListener('dragover', e => { e.preventDefault(); banWrap.style.borderColor = '#FF6B00'; });
    banWrap?.addEventListener('dragleave', () => { banWrap.style.borderColor = '#e2e8f0'; });
    banWrap?.addEventListener('drop', e => {
      e.preventDefault(); banWrap.style.borderColor = '#e2e8f0';
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) {
        const dt = new DataTransfer(); dt.items.add(f); banFileInput.files = dt.files;
        showBanPreview(URL.createObjectURL(f));
      }
    });
  }

  if (type === 'product') {
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
    } else if (type === 'discount') {
      const payload = {
        name:               document.getElementById('d-disc-name')?.value?.trim(),
        description:        document.getElementById('d-disc-desc')?.value?.trim(),
        discountPercentage: parseFloat(document.getElementById('d-disc-pct')?.value),
        startDate:          document.getElementById('d-disc-start')?.value || null,
        endDate:            document.getElementById('d-disc-end')?.value || null,
        active:             document.getElementById('d-disc-active')?.checked ?? true,
      };
      if (!payload.name) throw new Error('Name is required');
      if (!payload.description) throw new Error('Description is required');
      if (!payload.discountPercentage || payload.discountPercentage <= 0) throw new Error('Enter a valid percentage');
      await ApiService.createDiscount(payload);
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
      const file        = document.getElementById('d-ban-img-file')?.files?.[0];
      const title       = document.getElementById('d-ban-title')?.value || '';
      const subtitle    = document.getElementById('d-ban-sub')?.value || '';
      const buttonText  = document.getElementById('d-ban-cta')?.value || '';
      const linkUrl     = document.getElementById('d-ban-link')?.value || '';
      const displayOrder = parseInt(document.getElementById('d-ban-order')?.value) || 0;
      const active      = document.getElementById('d-ban-active')?.checked ?? true;
      if (!title) throw new Error('Title is required');
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('title', title);
        if (subtitle)   fd.append('subtitle', subtitle);
        if (buttonText) fd.append('buttonText', buttonText);
        if (linkUrl)    fd.append('linkUrl', linkUrl);
        fd.append('displayOrder', displayOrder);
        fd.append('active', active);
        const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('luz_jwt') };
        const endpoint = data
          ? `http://localhost:8080/api/banners/${data.id}/upload`
          : 'http://localhost:8080/api/banners/upload';
        const method = data ? 'PUT' : 'POST';
        const res = await fetch(endpoint, { method, headers, body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Banner save failed');
      } else {
        const existingUrl = document.getElementById('d-ban-img-existing')?.value || '';
        const payload = { title, subtitle, buttonText, linkUrl, imageUrl: existingUrl, displayOrder, active };
        data ? await ApiService.updateBanner(data.id, payload) : await ApiService.createBanner(payload);
      }
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
      const etaRaw = document.getElementById('d-shp-eta')?.value;
      const eta = etaRaw ? (etaRaw.length === 16 ? etaRaw + ':00' : etaRaw) : null;
      const payload = {
        orderId:               document.getElementById('d-shp-order')?.value?.trim(),
        carrier:               document.getElementById('d-shp-carrier')?.value?.trim(),
        trackingNumber:        document.getElementById('d-shp-tracking')?.value?.trim() || null,
        estimatedDeliveryDate: eta,
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
    } else if (type === 'supplier') {
      const payload = {
        name:              document.getElementById('d-sup-name')?.value?.trim(),
        contactEmail:      document.getElementById('d-sup-email')?.value?.trim(),
        contactPhone:      document.getElementById('d-sup-phone')?.value?.trim() || null,
        address:           document.getElementById('d-sup-addr')?.value?.trim() || null,
        performanceRating: parseFloat(document.getElementById('d-sup-rating')?.value) || null,
        active:            document.getElementById('d-sup-active')?.checked,
        notes:             document.getElementById('d-sup-notes')?.value?.trim() || null,
      };
      if (!payload.name) throw new Error('Supplier name is required');
      if (!payload.contactEmail) throw new Error('Contact email is required');
      data?.id ? await ApiService.suppliers.update(data.id, payload) : await ApiService.suppliers.create(payload);
      closeDrawer(); showToast(data?.id ? 'Supplier updated' : 'Supplier created', 'success');
      setTimeout(() => loadTab('suppliers'), 300);
      return;
    } else if (type === 'procurement') {
      const supplierId = document.getElementById('d-po-supplier')?.value;
      const itemId     = document.getElementById('d-po-item')?.value;
      const qty        = parseInt(document.getElementById('d-po-qty')?.value) || 0;
      const cost       = parseFloat(document.getElementById('d-po-cost')?.value) || null;
      const eta        = document.getElementById('d-po-eta')?.value || null;
      if (!supplierId) throw new Error('Please select a supplier');
      if (!itemId)     throw new Error('Please select an inventory item');
      if (qty < 1)     throw new Error('Quantity must be at least 1');
      await ApiService.procurement.create({ supplierId, inventoryItemId: itemId, quantityOrdered: qty, totalCost: cost, expectedDeliveryDate: eta });
      closeDrawer(); showToast('Procurement order created', 'success');
      setTimeout(() => loadTab('procurement'), 300);
      return;
    } else if (type === 'receive-po') {
      const qty = parseInt(document.getElementById('d-recv-qty')?.value) || 0;
      if (qty < 1) throw new Error('Quantity received must be at least 1');
      await ApiService.procurement.receive(data.id, qty);
      closeDrawer(); showToast('Stock received and inventory updated', 'success');
      setTimeout(() => loadTab('procurement'), 300);
      return;
    } else if (type === 'inv-threshold') {
      const threshold = parseInt(document.getElementById('d-thresh-val')?.value);
      if (isNaN(threshold) || threshold < 0) throw new Error('Enter a valid threshold (0 or more)');
      await ApiService.inventory.updateThreshold(data.id, threshold);
      closeDrawer(); showToast('Threshold updated', 'success');
      setTimeout(() => loadTab('inventory'), 300);
      return;
    } else if (type === 'inv-item') {
      const productName = document.getElementById('d-inv-name')?.value?.trim();
      const sku         = document.getElementById('d-inv-sku')?.value?.trim() || null;
      const quantity    = parseInt(document.getElementById('d-inv-qty')?.value) || 0;
      const threshold   = parseInt(document.getElementById('d-inv-thresh')?.value) || 10;
      const location    = document.getElementById('d-inv-location')?.value?.trim() || null;
      const unit        = document.getElementById('d-inv-unit')?.value?.trim() || null;
      if (!productName) throw new Error('Product name is required');
      await ApiService.inventory.createItem({ productName, sku, quantity, lowStockThreshold: threshold, location, unit });
      closeDrawer(); showToast('Inventory item created', 'success');
      setTimeout(() => loadTab('inventory'), 300);
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
    else if (action === 'delete-product') { await ApiService.deleteProduct(id).catch(()=>{}); showToast('Product deleted', 'success'); loadTab('products'); }
    else if (action === 'apply-discount') {
      const modal = document.getElementById('discount-apply-modal');
      if (!modal) return;
      document.getElementById('da-product-id').value = id;
      document.getElementById('da-product-name').textContent = el.dataset.name || id;
      modal.style.display = 'flex';
      document.getElementById('btn-da-cancel')?.addEventListener('click', () => { modal.style.display = 'none'; }, { once: true });
      document.getElementById('btn-da-save')?.addEventListener('click', async () => {
        const discountId = document.getElementById('da-discount-sel')?.value;
        const pid = document.getElementById('da-product-id')?.value;
        try {
          if (discountId) await ApiService.applyProductDiscount(pid, discountId);
          else            await ApiService.removeProductDiscount(pid);
          modal.style.display = 'none';
          showToast(discountId ? 'Discount applied' : 'Discount removed', 'success');
          loadTab('products');
        } catch(err) { showToast(err.message || 'Failed', 'error'); }
      }, { once: true });
    }
    else if (action === 'manage-images') {
      const modal = document.getElementById('img-mgmt-modal');
      if (!modal) return;
      document.getElementById('img-mgmt-product-id').value = id;
      const gallery = document.getElementById('img-mgmt-gallery');
      if (gallery) {
        const prod = _productCache.find(p => p.id === id);
        const images = prod?.images || [];
        if (images.length) {
          gallery.innerHTML = images.map(img => {
            const src = img.url?.startsWith('/uploads/') ? 'http://localhost:8080' + img.url : (img.url||'');
            return `<div style="position:relative;width:100px">
              <img src="${src}" style="width:100px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0">
              ${img.isPrimary ? '<span style="position:absolute;top:2px;left:2px;background:#FF6B00;color:#fff;font-size:9px;padding:1px 4px;border-radius:3px">Primary</span>' : ''}
              <button class="btn-d btn-d-danger btn-d-sm btn-d-ico img-delete-btn" data-image-id="${img.id}" style="position:absolute;top:2px;right:2px;width:20px;height:20px;padding:0;font-size:10px">${I.x}</button>
            </div>`;
          }).join('');
          gallery.querySelectorAll('.img-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
              if (!confirm('Remove this image?')) return;
              try {
                await ApiService.removeProductImage(id, btn.dataset.imageId);
                btn.closest('div[style*="width:100px"]').remove();
                showToast('Image removed', 'success');
                const pIdx = _productCache.findIndex(p => p.id === id);
                if (pIdx >= 0 && _productCache[pIdx].images) {
                  _productCache[pIdx].images = _productCache[pIdx].images.filter(i => i.id !== btn.dataset.imageId);
                }
              } catch(err) { showToast(err.message || 'Remove failed', 'error'); }
            });
          });
        } else {
          gallery.innerHTML = `<div style="font-size:13px;color:#94A3B8">No images uploaded yet.</div>`;
        }
      }
      const msgEl = document.getElementById('img-upload-msg');
      modal.style.display = 'flex';
      document.getElementById('btn-img-close')?.addEventListener('click', () => { modal.style.display = 'none'; }, { once: true });
      document.getElementById('btn-img-upload')?.addEventListener('click', async () => {
        const file = document.getElementById('img-upload-file')?.files?.[0];
        const alt  = document.getElementById('img-upload-alt')?.value?.trim() || '';
        const prim = document.getElementById('img-upload-primary')?.checked || false;
        if (!file) { showToast('Choose an image file first', 'error'); return; }
        const pid = document.getElementById('img-mgmt-product-id')?.value;
        if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = 'Uploading…'; msgEl.style.color = '#64748B'; }
        try {
          const res = await ApiService.uploadProductImage(pid, file, alt, prim);
          if (msgEl) { msgEl.textContent = 'Upload successful!'; msgEl.style.color = '#16a34a'; }
          showToast('Image uploaded', 'success');
          modal.style.display = 'none';
          loadTab('products');
        } catch(err) {
          if (msgEl) { msgEl.textContent = err.message || 'Upload failed'; msgEl.style.color = '#ef4444'; }
          showToast(err.message || 'Upload failed', 'error');
        }
      }, { once: true });
    }
    else if (action === 'toggle-discount') {
      try { await ApiService.toggleDiscount(id); showToast('Discount toggled', 'success'); loadTab('discounts'); }
      catch(e) { showToast(e.message || 'Failed', 'error'); }
    }
    else if (action === 'edit-discount') {
      const d = _discountCache.find(x => x.id === id) || { id };
      openDrawer('discount', d);
    }
    else if (action === 'delete-discount') {
      if (!confirm('Delete this discount? It will be removed from all products.')) return;
      try { await ApiService.deleteDiscount(id); showToast('Discount deleted', 'success'); loadTab('discounts'); }
      catch(e) { showToast(e.message || 'Delete failed', 'error'); }
    }
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
    else if (action === 'adjust-stock')  { openDrawer('adjust', { id, name: el.dataset.itemName || name }); }
    else if (action === 'edit-threshold') { openDrawer('inv-threshold', { id, name: el.dataset.itemName || name, threshold: parseInt(el.dataset.threshold)||10 }); }
    else if (action === 'view-inv-item') {
      try {
        const res = await ApiService.inventory.getItem(id);
        const item = res?.data || res;
        const reorder = item.reorderPoint || item.lowStockThreshold || 10;
        document.getElementById('d-drawer-title').textContent = item.productName || item.name || 'Inventory Item';
        document.getElementById('d-drawer-body').innerHTML = `
          <div class="d-alert d-alert-info" style="margin-bottom:14px">SKU: <b>${esc(item.sku||'—')}</b> · Location: <b>${esc(item.location||item.warehouse||'Main')}</b></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <div class="dash-stat" style="padding:12px"><div class="dash-stat-lbl">In Stock</div><div class="dash-stat-val" style="color:${item.quantity<=0?'#ef4444':item.quantity<=reorder?'#f59e0b':'#10b981'}">${item.quantity||0}</div></div>
            <div class="dash-stat" style="padding:12px"><div class="dash-stat-lbl">Reorder Point</div><div class="dash-stat-val">${reorder}</div></div>
          </div>
          ${item.unitCost ? `<div class="f-field"><label class="f-lbl">Unit Cost</label><div class="f-val">${fmt.money(item.unitCost)}</div></div>` : ''}
          ${item.unit ? `<div class="f-field"><label class="f-lbl">Unit</label><div class="f-val">${esc(item.unit)}</div></div>` : ''}
          ${item.product ? `<div class="f-field"><label class="f-lbl">Linked Product</label><div class="f-val">${esc(item.product.name||item.product.id||'—')}</div></div>` : ''}
          <div class="f-field"><label class="f-lbl">Last Updated</label><div class="f-val">${fmt.ago(item.updatedAt||item.createdAt)}</div></div>`;
        document.getElementById('d-drawer-footer').innerHTML = `<button class="btn-d btn-d-sec" id="d-btn-cancel">Close</button>`;
        document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
        document.getElementById('d-overlay').classList.add('open');
      } catch(e) { showToast(e.message || 'Failed to load item', 'error'); }
    }
    else if (action === 'edit-supplier')  {
      try {
        const res = await ApiService.suppliers.getById(id);
        const s = res?.data || res || _supplierCache.find(x=>x.id===id) || { id };
        openDrawer('supplier', s);
      } catch(_) {
        const s = _supplierCache.find(x=>x.id===id) || { id };
        openDrawer('supplier', s);
      }
    }
    else if (action === 'toggle-supplier') {
      const active = el.dataset.active === 'true';
      if (!confirm(`${active?'Deactivate':'Activate'} this supplier?`)) return;
      await ApiService.suppliers.setActive(id, !active).catch(()=>{});
      loadTab('suppliers');
    }
    else if (action === 'view-po') {
      try {
        const res = await ApiService.procurement.getById(id);
        const o = res?.data || res;
        const st = (o.status||'PENDING').toUpperCase();
        const statusColor = { PENDING:'bdg-yellow', RECEIVED:'bdg-green', PARTIALLY_RECEIVED:'bdg-blue', CANCELLED:'bdg-red', DRAFT:'bdg-gray' };
        document.getElementById('d-drawer-title').textContent = `PO #${(o.id||'').toString().slice(-8)}`;
        document.getElementById('d-drawer-body').innerHTML = `
          <div class="d-alert d-alert-info" style="margin-bottom:14px">
            Supplier: <b>${esc(o.supplier?.name||'—')}</b> · <span class="bdg ${statusColor[st]||'bdg-gray'}">${st.replace('_',' ')}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <div class="dash-stat" style="padding:12px"><div class="dash-stat-lbl">Ordered</div><div class="dash-stat-val">${o.quantityOrdered||0}</div></div>
            <div class="dash-stat" style="padding:12px"><div class="dash-stat-lbl">Received</div><div class="dash-stat-val" style="color:${(o.quantityReceived||0)>=(o.quantityOrdered||0)?'#10b981':'#f59e0b'}">${o.quantityReceived||0}</div></div>
          </div>
          <div class="f-field"><label class="f-lbl">Item</label><div class="f-val">${esc(o.inventoryItem?.productName||o.inventoryItem?.name||'—')}</div></div>
          ${o.totalCost ? `<div class="f-field"><label class="f-lbl">Total Cost</label><div class="f-val">${fmt.money(o.totalCost)}</div></div>` : ''}
          ${o.expectedDeliveryDate ? `<div class="f-field"><label class="f-lbl">Expected Delivery</label><div class="f-val">${fmt.date(o.expectedDeliveryDate)}</div></div>` : ''}
          ${o.notes ? `<div class="f-field"><label class="f-lbl">Notes</label><div class="f-val" style="white-space:pre-wrap;font-size:13px">${esc(o.notes)}</div></div>` : ''}
          <div class="f-field"><label class="f-lbl">Created</label><div class="f-val">${fmt.ago(o.createdAt)}</div></div>`;
        document.getElementById('d-drawer-footer').innerHTML = `<button class="btn-d btn-d-sec" id="d-btn-cancel">Close</button>`;
        document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
        document.getElementById('d-overlay').classList.add('open');
      } catch(e) { showToast(e.message || 'Failed to load order', 'error'); }
    }
    else if (action === 'receive-po') {
      openDrawer('receive-po', { id, ordered: parseInt(el.dataset.ordered)||0 });
    }
    else if (action === 'cancel-po') {
      if (!confirm('Cancel this procurement order?')) return;
      await ApiService.procurement.cancel(id).catch(()=>{});
      showToast('Order cancelled', 'success');
      loadTab('procurement');
    }
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
    else if (action === 'view-backup') {
      try {
        const res = await ApiService.getBackup(id);
        const b = res?.data || res;
        document.getElementById('d-drawer-title').textContent = `Backup — ${fmt.date(b.createdAt)}`;
        document.getElementById('d-drawer-body').innerHTML = `
          <div class="d-alert d-alert-info" style="margin-bottom:14px">
            Status: ${statusBdg(b.status||'COMPLETED')}
          </div>
          ${b.filePath||b.path ? `<div class="f-field"><label class="f-lbl">File Path</label><div class="f-val" style="font-family:monospace;font-size:12px;word-break:break-all">${esc(b.filePath||b.path)}</div></div>` : ''}
          ${b.fileSize||b.size ? `<div class="f-field"><label class="f-lbl">File Size</label><div class="f-val">${Math.round((b.fileSize||b.size)/1024)} KB</div></div>` : ''}
          ${b.type ? `<div class="f-field"><label class="f-lbl">Type</label><div class="f-val">${esc(b.type)}</div></div>` : ''}
          ${b.description ? `<div class="f-field"><label class="f-lbl">Description</label><div class="f-val">${esc(b.description)}</div></div>` : ''}
          <div class="f-field"><label class="f-lbl">Created</label><div class="f-val">${fmt.ago(b.createdAt)}</div></div>
          ${b.completedAt ? `<div class="f-field"><label class="f-lbl">Completed</label><div class="f-val">${fmt.ago(b.completedAt)}</div></div>` : ''}`;
        document.getElementById('d-drawer-footer').innerHTML = `
          <button class="btn-d btn-d-sec" id="d-btn-cancel">Close</button>
          <button class="btn-d btn-d-danger" data-action="restore-backup" data-id="${b.id}">Restore This Backup</button>`;
        document.getElementById('d-btn-cancel')?.addEventListener('click', closeDrawer);
        document.getElementById('d-overlay').classList.add('open');
      } catch(e) { showToast(e.message || 'Failed to load backup', 'error'); }
    }
    else if (action === 'restore-backup') {
      if (confirm('Restore from this backup? Current data will be replaced.')) {
        el.disabled = true; el.textContent = 'Restoring…';
        try {
          await ApiService.restoreBackup(id);
          showToast('Restore started successfully', 'success');
          closeDrawer();
        } catch(err) { showToast(err.message||'Restore failed', 'error'); el.disabled = false; el.textContent = 'Restore'; }
      }
    }
    else if (action === 'edit-config') {
      try {
        const res = await ApiService.getSystemConfiguration(key);
        const c = res?.data || res;
        const keyEl = document.getElementById('sys-cfg-key');
        const valEl = document.getElementById('sys-cfg-val');
        const catEl = document.getElementById('sys-cfg-cat');
        const dscEl = document.getElementById('sys-cfg-desc');
        if (keyEl) keyEl.value = c.configKey || c.key || key || '';
        if (valEl) valEl.value = c.sensitive ? '' : (c.configValue || c.value || value || '');
        if (catEl) catEl.value = c.category || category || '';
        if (dscEl) dscEl.value = c.description || desc || '';
        if (c.sensitive) showToast('Sensitive value — re-enter to update', 'info');
      } catch(_) {
        const keyEl = document.getElementById('sys-cfg-key');
        const valEl = document.getElementById('sys-cfg-val');
        const catEl = document.getElementById('sys-cfg-cat');
        const dscEl = document.getElementById('sys-cfg-desc');
        if (keyEl) keyEl.value = key || '';
        if (valEl) valEl.value = value || '';
        if (catEl) catEl.value = category || '';
        if (dscEl) dscEl.value = desc || '';
      }
      document.getElementById('sys-cfg-key')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
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

    // Export CSV (local)
    document.getElementById('btn-export-products')?.addEventListener('click', () => {
      if (!_productCache.length) { showToast('No products to export', 'error'); return; }
      const header = 'Name,Category,Price,Status,Featured,SKU,Discount';
      const rows = _productCache.map(p => [
        p.name||'', p.categoryName||p.category?.name||'',
        p.price||0, p.status||'', p.featured?'Yes':'No', p.sku||'', p.discountName||''
      ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
      const csv = header + '\n' + rows.join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'products_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
      showToast('Products exported', 'success');
    });

    // Bulk export Excel
    document.getElementById('btn-bulk-export')?.addEventListener('click', async () => {
      try { showToast('Preparing Excel export…'); await ApiService.exportProductsBulk(); showToast('Download started', 'success'); }
      catch(e) { showToast(e.message || 'Export failed', 'error'); }
    });

    // Bulk import Excel
    document.getElementById('bulk-import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const resultEl = document.getElementById('bulk-import-result');
      if (resultEl) { resultEl.style.display = 'block'; resultEl.innerHTML = `<div class="d-alert d-alert-info">Importing <b>${file.name}</b>…</div>`; }
      try {
        const res = await ApiService.importProductsBulk(file);
        const d = res.data || res || {};
        const errors = (d.errors || []).map(err => `<li>Row ${err.rowNumber}: ${err.message}</li>`).join('');
        if (resultEl) resultEl.innerHTML = `
          <div class="d-alert" style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:12px">
            <b>Import complete:</b> ${d.createdCount||0} created · ${d.updatedCount||0} updated · ${d.skippedCount||0} skipped
            ${errors ? `<ul style="margin:8px 0 0;padding-left:18px;color:#991b1b">${errors}</ul>` : ''}
          </div>`;
        showToast('Import complete', 'success');
        setTimeout(() => loadTab('products'), 800);
      } catch(err) {
        if (resultEl) resultEl.innerHTML = `<div class="d-alert d-alert-err">${err.message||'Import failed'}</div>`;
        showToast(err.message || 'Import failed', 'error');
      }
      e.target.value = '';
    });

    // Quick status change
    document.getElementById('products-tbody')?.addEventListener('change', async e => {
      const sel = e.target.closest('.prod-status-sel');
      if (sel) {
        const id = sel.dataset.id;
        const status = sel.value;
        try {
          await ApiService.updateProductStatus(id, status);
          const p = _productCache.find(x => x.id === id);
          if (p) p.status = status;
          showToast(`Status set to ${status.toLowerCase()}`, 'success');
        } catch(err) { showToast(err.message || 'Status update failed', 'error'); }
        return;
      }
      // Featured toggle (existing)
      const cb = e.target.closest('.prod-featured-toggle');
      if (cb) {
        const id = cb.dataset.id;
        const featured = cb.checked;
        try {
          await ApiService.setProductFeatured(id, featured);
          const p = _productCache.find(x => x.id === id);
          if (p) p.featured = featured;
          showToast(featured ? 'Marked as featured' : 'Removed from featured', 'success');
        } catch(err) { showToast(err.message || 'Failed', 'error'); cb.checked = !featured; }
      }
    });

    // ── Category management ────────────────────────────────
    const catAddForm = document.getElementById('cat-add-form');
    const catErrEl   = document.getElementById('cat-form-err');

    document.getElementById('btn-show-add-cat')?.addEventListener('click', () => {
      if (catAddForm) catAddForm.style.display = '';
      document.getElementById('cat-new-name')?.focus();
    });

    document.getElementById('btn-cancel-cat')?.addEventListener('click', () => {
      if (catAddForm) catAddForm.style.display = 'none';
      if (catErrEl) catErrEl.style.display = 'none';
      if (document.getElementById('cat-new-name')) document.getElementById('cat-new-name').value = '';
      if (document.getElementById('cat-new-desc')) document.getElementById('cat-new-desc').value = '';
    });

    document.getElementById('btn-save-cat')?.addEventListener('click', async () => {
      const name = document.getElementById('cat-new-name')?.value?.trim();
      const desc = document.getElementById('cat-new-desc')?.value?.trim() || '';
      if (!name) {
        if (catErrEl) { catErrEl.textContent = 'Category name is required.'; catErrEl.style.display = ''; }
        return;
      }
      const btn = document.getElementById('btn-save-cat');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        const res = await ApiService.createCategory(name, desc);
        const cat = res?.data || res;
        // Append new chip without full reload
        _categoryCache.push(cat);
        const chipsEl = document.getElementById('cat-chips');
        if (chipsEl) {
          // Remove "No categories" placeholder if present
          const placeholder = chipsEl.querySelector('div[style*="color:#94A3B8"]');
          if (placeholder) placeholder.remove();
          const chip = document.createElement('div');
          chip.className = 'cat-chip';
          chip.dataset.catId = cat.id;
          chip.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:#EEF2FF;border:1.5px solid #C7D2FE;border-radius:20px;font-size:13px;font-weight:600;color:#3730a3';
          chip.innerHTML = `<span>${esc(cat.name)}</span>${isAdmin() ? `<button class="cat-chip-del" data-cat-id="${cat.id}" data-cat-name="${escAttr(cat.name)}" style="background:none;border:none;cursor:pointer;color:#6366f1;font-size:14px;line-height:1;padding:0 0 0 2px" title="Delete">${I.x}</button>` : ''}`;
          chipsEl.appendChild(chip);
        }
        // Refresh category dropdown in product filter
        const catFilter = document.getElementById('product-cat-filter');
        if (catFilter) {
          const opt = document.createElement('option');
          opt.value = cat.id; opt.textContent = cat.name;
          catFilter.appendChild(opt);
        }
        // Reset form
        document.getElementById('cat-new-name').value = '';
        document.getElementById('cat-new-desc').value = '';
        if (catAddForm) catAddForm.style.display = 'none';
        if (catErrEl) catErrEl.style.display = 'none';
        showToast(`Category "${cat.name}" created`, 'success');
      } catch(e) {
        if (catErrEl) { catErrEl.textContent = e.message || 'Failed to create category'; catErrEl.style.display = ''; }
      } finally { btn.disabled = false; btn.textContent = 'Save'; }
    });

    // Enter key in name field triggers save
    document.getElementById('cat-new-name')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-save-cat')?.click();
    });

    // Delete chip — delegated
    document.getElementById('cat-chips')?.addEventListener('click', async e => {
      const delBtn = e.target.closest('.cat-chip-del');
      if (!delBtn) return;
      const id   = delBtn.dataset.catId;
      const name = delBtn.dataset.catName;
      if (!confirm(`Delete category "${name}"?\n\nProducts assigned to this category will lose their category.`)) return;
      delBtn.disabled = true;
      try {
        await ApiService.deleteCategory(id);
        const chip = delBtn.closest('.cat-chip');
        chip?.remove();
        _categoryCache = _categoryCache.filter(c => c.id !== id);
        // Remove from product filter dropdown
        document.getElementById('product-cat-filter')?.querySelector(`option[value="${id}"]`)?.remove();
        showToast(`Category "${name}" deleted`, 'success');
        // If no categories left, show placeholder
        const chipsEl = document.getElementById('cat-chips');
        if (chipsEl && !chipsEl.querySelector('.cat-chip')) {
          chipsEl.innerHTML = `<div style="color:#94A3B8;font-size:13px">No categories yet — add one above.</div>`;
        }
      } catch(e) { showToast(e.message || 'Delete failed', 'error'); delBtn.disabled = false; }
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

    // Inventory sub-tab switching
    document.querySelectorAll('.inv-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.inv-subtab').forEach(b => {
          b.style.color = '#64748b'; b.style.borderBottomColor = 'transparent';
        });
        btn.style.color = '#FF6B00'; btn.style.borderBottomColor = '#FF6B00';
        const sub = btn.dataset.subtab;
        document.getElementById('inv-panel-stock').style.display     = sub==='stock'     ? 'block' : 'none';
        document.getElementById('inv-panel-movements').style.display = sub==='movements' ? 'block' : 'none';
      });
    });

    // Movement history filter
    const filterMov = () => {
      const q  = (document.getElementById('mov-search')?.value||'').toLowerCase();
      const tp = (document.getElementById('mov-type-filter')?.value||'').toUpperCase();
      const tbody = document.getElementById('mov-tbody');
      if (!tbody) return;
      const typeIcon  = t => t==='IN'?'▲':t==='OUT'?'▼':'↕';
      const typeColor = t => t==='IN'?'#10B981':t==='OUT'?'#EF4444':'#6366F1';
      const filtered = _movementCache.filter(m => {
        const name = (m.inventoryItem?.productName||m.inventoryItem?.name||'').toLowerCase();
        const reason = (m.reason||'').toLowerCase();
        return (!q || name.includes(q) || reason.includes(q)) && (!tp || m.type===tp);
      });
      tbody.innerHTML = filtered.length ? filtered.map(m=>`
        <tr>
          <td class="td-sm">${fmt.ago(m.createdAt)}</td>
          <td class="td-b">${m.inventoryItem?.productName||m.inventoryItem?.name||'—'}</td>
          <td style="color:${typeColor(m.type)};font-weight:700">${typeIcon(m.type)} ${m.type||'—'}</td>
          <td style="font-weight:700;color:${(m.quantity||0)>=0?'#10B981':'#EF4444'}">${(m.quantity||0)>0?'+':''}${m.quantity||0}</td>
          <td>${m.reason||'—'}</td>
          <td class="td-sm">${m.referenceId?`<code>#${m.referenceId.toString().slice(-8)}</code>`:'—'}</td>
        </tr>`).join('') :
        `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">🔍</div><div class="d-empty-ttl">No matching movements</div></div></td></tr>`;
    };
    document.getElementById('mov-search')?.addEventListener('input', filterMov);
    document.getElementById('mov-type-filter')?.addEventListener('change', filterMov);

    // Auto-refresh inventory every 60s
    clearInterval(_invRefreshTimer);
    _invRefreshTimer = setInterval(async () => {
      if (activeTab !== 'inventory') { clearInterval(_invRefreshTimer); return; }
      try {
        const res = await ApiService.getInventory({ page:0, size:100 });
        _invCache = extractList(res);
        filterInv();
      } catch(_){}
    }, 60000);
  }

  if (tab === 'suppliers') {
    document.getElementById('btn-add-supplier')?.addEventListener('click', () => {
      if (!_supplierCache.length) ApiService.suppliers.getAll().then(r => { _supplierCache = Array.isArray(r)?r:(r?.data||[]); });
      openDrawer('supplier', null);
    });

    // Search + filter
    const filterSup = () => {
      const q  = (document.getElementById('supplier-search')?.value||'').toLowerCase();
      const st = document.getElementById('supplier-status-filter')?.value||'';
      const tbody = document.getElementById('supplier-tbody');
      if (!tbody) return;
      const filtered = _supplierCache.filter(s => {
        const matchQ  = !q || (s.name||'').toLowerCase().includes(q) || (s.contactEmail||'').toLowerCase().includes(q);
        const matchSt = !st || (st==='active'&&s.active) || (st==='inactive'&&!s.active);
        return matchQ && matchSt;
      });
      tbody.innerHTML = filtered.length ? filtered.map(s=>`
        <tr>
          <td class="td-b">${s.name||'—'}</td>
          <td>${s.contactEmail||'—'}</td>
          <td>${s.contactPhone||'—'}</td>
          <td>${s.performanceRating ? '⭐'.repeat(Math.round(s.performanceRating)) + ' ' + s.performanceRating.toFixed(1) : '—'}</td>
          <td>${s.notes ? `<span title="${escAttr(s.notes)}" style="max-width:180px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.notes}</span>` : '—'}</td>
          <td>${s.active?`<span class="bdg bdg-green">Active</span>`:`<span class="bdg bdg-gray">Inactive</span>`}</td>
          <td style="display:flex;gap:5px;">
            <button class="btn-d btn-d-sec btn-d-sm" data-action="edit-supplier" data-id="${s.id}">Edit</button>
            <button class="btn-d btn-d-${s.active?'danger':'success'} btn-d-sm" data-action="toggle-supplier" data-id="${s.id}" data-active="${s.active}">${s.active?'Deactivate':'Activate'}</button>
          </td>
        </tr>`).join('') :
        `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🔍</div><div class="d-empty-ttl">No matching suppliers</div></div></td></tr>`;
    };
    document.getElementById('supplier-search')?.addEventListener('input', filterSup);
    document.getElementById('supplier-status-filter')?.addEventListener('change', filterSup);
  }

  if (tab === 'procurement') {
    document.getElementById('btn-add-po')?.addEventListener('click', async () => {
      // Pre-load suppliers and inventory items for the form
      const [sr, ir] = await Promise.allSettled([
        ApiService.suppliers.getAll(true),
        ApiService.inventory.getItems(),
      ]);
      if (sr.status==='fulfilled') _supplierCache = Array.isArray(sr.value)?sr.value:(sr.value?.data||[]);
      if (ir.status==='fulfilled') _invCache      = Array.isArray(ir.value)?ir.value:(ir.value?.data||extractList(ir.value));
      openDrawer('procurement', null);
    });

    // Status filter
    document.getElementById('po-status-filter')?.addEventListener('change', e => {
      const st = e.target.value;
      const tbody = document.getElementById('po-tbody');
      if (!tbody) return;
      const statusColor = { PENDING:'bdg-yellow', RECEIVED:'bdg-green', PARTIALLY_RECEIVED:'bdg-blue', CANCELLED:'bdg-red', DRAFT:'bdg-gray' };
      const filtered = st ? _procurementCache.filter(o=>o.status===st) : _procurementCache;
      tbody.innerHTML = filtered.length ? filtered.map(o=>{
        const supplierName = o.supplier?.name||'—';
        const itemName     = o.inventoryItem?.productName||o.inventoryItem?.name||'—';
        const s            = (o.status||'PENDING').toUpperCase();
        return `<tr>
          <td class="td-m"><code>#${(o.id||'').toString().slice(-8)}</code></td>
          <td class="td-b">${supplierName}</td>
          <td>${itemName}</td>
          <td style="text-align:center">${o.quantityOrdered||0}</td>
          <td style="text-align:center">${o.quantityReceived||0}</td>
          <td>${o.totalCost?fmt.money(o.totalCost):'—'}</td>
          <td>${o.expectedDeliveryDate?fmt.date(o.expectedDeliveryDate):'—'}</td>
          <td><span class="bdg ${statusColor[s]||'bdg-gray'}">${s.replace('_',' ')}</span></td>
          <td style="display:flex;gap:4px;flex-wrap:wrap;">
            ${s==='PENDING'||s==='DRAFT'?`<button class="btn-d btn-d-success btn-d-sm" data-action="receive-po" data-id="${o.id}" data-ordered="${o.quantityOrdered||0}">Receive</button>`:''}
            ${s==='PENDING'||s==='DRAFT'?`<button class="btn-d btn-d-danger btn-d-sm" data-action="cancel-po" data-id="${o.id}">Cancel</button>`:''}
            ${s==='PARTIALLY_RECEIVED'?`<button class="btn-d btn-d-success btn-d-sm" data-action="receive-po" data-id="${o.id}" data-ordered="${o.quantityOrdered||0}">More</button>`:''}
          </td>
        </tr>`;
      }).join('') : `<tr><td colspan="9"><div class="d-empty"><div class="d-empty-ico">📦</div><div class="d-empty-ttl">No matching orders</div></div></td></tr>`;
    });
  }

  if (tab === 'crm') {
    // Sub-tab switching
    document.querySelectorAll('[data-crm-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        _crmSubTab = btn.dataset.crmTab;
        document.querySelectorAll('[data-crm-tab]').forEach(b => b.classList.toggle('active', b===btn));
        ['analytics','customers','comms'].forEach(id => {
          const el = document.getElementById(`crm-panel-${id}`);
          if (el) el.style.display = id === _crmSubTab ? '' : 'none';
        });
      });
    });

    // Export CSV
    document.getElementById('btn-export-customers')?.addEventListener('click', () => {
      if (!_customerCache.length) { showToast('No customers to export', 'error'); return; }
      const header = 'First Name,Last Name,Email,Phone,Status,Joined';
      const rows = _customerCache.map(c => [
        c.firstName||'', c.lastName||'', c.email||'',
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

    // Customer list search
    document.getElementById('crm-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      const tbody = document.getElementById('crm-tbody');
      if (!tbody) return;
      const filtered = !q ? _crmCustomerCache : _crmCustomerCache.filter(c => {
        const name  = `${c.firstName||''} ${c.lastName||''}`.toLowerCase();
        return name.includes(q) || (c.email||'').toLowerCase().includes(q);
      });
      tbody.innerHTML = filtered.length ? filtered.map(c => `
        <tr>
          <td class="td-b">${esc(c.firstName||'')} ${esc(c.lastName||'')}</td>
          <td>${esc(c.email||'—')}</td>
          <td>${c.orderCount||c.totalOrders||0}</td>
          <td>${fmt.money(c.totalSpent||c.lifetimeValue||0)}</td>
          <td>${statusBdg(c.locked?'BLOCKED':c.enabled===false?'DISABLED':'ACTIVE')}</td>
          <td class="td-sm">${fmt.date(c.createdAt||c.joinDate)}</td>
          <td style="display:flex;gap:4px">
            <button class="btn-d btn-d-sec btn-d-sm" data-action="view-customer" data-id="${c.id}">${I.eye} View</button>
            <button class="btn-d btn-d-primary btn-d-sm" data-action="log-comm" data-id="${c.id}" data-name="${esc(c.firstName||'')} ${esc(c.lastName||'')}">+ Log</button>
          </td>
        </tr>`).join('') :
        `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🔍</div><div class="d-empty-ttl">No matching customers</div></div></td></tr>`;
    });

    // Load communication logs for selected customer
    document.getElementById('btn-load-comm-logs')?.addEventListener('click', async () => {
      const customerId = document.getElementById('comm-customer-filter')?.value;
      const body = document.getElementById('comm-logs-body');
      if (!body) return;
      if (!customerId) {
        body.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8">Select a customer first</div>';
        return;
      }
      body.innerHTML = '<div style="padding:20px;color:#94A3B8">Loading…</div>';
      try {
        const res = await ApiService.getCommunicationLogs(customerId);
        const logs = res?.data || [];
        const channelClr = { EMAIL:'#3B82F6', PHONE:'#10B981', CHAT:'#8B5CF6', IN_PERSON:'#F59E0B', OTHER:'#94A3B8' };
        body.innerHTML = logs.length ? `
          <table class="d-table" style="width:100%">
            <thead><tr><th>Channel</th><th>Subject</th><th>Notes</th><th>Outcome</th><th>Handled By</th><th>Date</th></tr></thead>
            <tbody>${logs.map(l => `
              <tr>
                <td><span class="bdg" style="background:${channelClr[l.channel]||'#94A3B8'}1a;color:${channelClr[l.channel]||'#94A3B8'}">${l.channel||'—'}</span></td>
                <td class="td-b">${esc(l.subject||'—')}</td>
                <td style="max-width:220px;font-size:12px;color:#64748B">${esc(l.notes||'—')}</td>
                <td>${esc(l.outcome||'—')}</td>
                <td>${esc(l.handledBy ? `${l.handledBy.firstName||''} ${l.handledBy.lastName||''}` : '—')}</td>
                <td class="td-sm">${fmt.date(l.createdAt)}</td>
              </tr>`).join('')}
            </tbody>
          </table>` :
          '<div style="text-align:center;padding:40px;color:#94A3B8">No communication logs for this customer</div>';
      } catch(e) { body.innerHTML = `<div class="d-alert d-alert-err" style="margin:16px">${e.message}</div>`; }
    });

    // Log communication modal (delegated — opens from customer list "+ Log" button)
    function openCommModal(customerId, customerName) {
      document.getElementById('comm-customer-id').value  = customerId;
      document.getElementById('comm-modal-cname').textContent = customerName;
      document.getElementById('comm-subject').value  = '';
      document.getElementById('comm-notes').value    = '';
      document.getElementById('comm-outcome').value  = '';
      document.getElementById('comm-modal').style.display = 'flex';
      document.getElementById('comm-subject').focus();
    }
    function closeCommModal() { document.getElementById('comm-modal').style.display = 'none'; }

    document.getElementById('comm-modal-cancel')?.addEventListener('click', closeCommModal);
    document.getElementById('comm-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeCommModal(); });
    document.getElementById('comm-modal-save')?.addEventListener('click', async () => {
      const customerId = document.getElementById('comm-customer-id')?.value;
      const channel    = document.getElementById('comm-channel')?.value;
      const subject    = document.getElementById('comm-subject')?.value.trim();
      const notes      = document.getElementById('comm-notes')?.value.trim();
      const outcome    = document.getElementById('comm-outcome')?.value.trim();
      if (!subject) return showToast('Subject is required', 'error');
      const btn = document.getElementById('comm-modal-save');
      btn.disabled = true; btn.textContent = 'Saving…';
      try {
        await ApiService.createCommunicationLog({ customerId, channel, subject, notes, outcome });
        showToast('Communication log saved');
        closeCommModal();
      } catch(e) { showToast(e.message||'Save failed','error'); }
      finally { btn.disabled = false; btn.textContent = 'Save Log'; }
    });

    // Delegated click for "log-comm" buttons rendered in tbody after search
    document.getElementById('crm-tbody')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-action="log-comm"]');
      if (btn) openCommModal(btn.dataset.id, btn.dataset.name);
    });
  }

  if (tab === 'audit') {
    // Sub-tab switching
    document.querySelectorAll('.audit-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.audit-subtab').forEach(b => {
          b.style.color = '#64748b'; b.style.borderBottomColor = 'transparent';
        });
        btn.style.color = '#FF6B00'; btn.style.borderBottomColor = '#FF6B00';
        const tab = btn.dataset.subtab;
        ['activity','violations','logins'].forEach(p => {
          const el = document.getElementById(`audit-panel-${p}`);
          if (el) el.style.display = p === tab ? 'block' : 'none';
        });
      });
    });

    // Text + status filter for All Activity
    function applyAuditFilters() {
      const q  = (document.getElementById('audit-search')?.value || '').toLowerCase().trim();
      const st = (document.getElementById('audit-status-filter')?.value || '').toLowerCase();
      const tbody = document.getElementById('audit-tbody');
      if (!tbody) return;
      let filtered = _auditCache;
      if (q) filtered = filtered.filter(l => {
        const email  = (l.actorEmail||l.userEmail||'').toLowerCase();
        const action = (l.action||l.actionType||'').toLowerCase();
        const res    = (l.entityType||l.resource||'').toLowerCase();
        return email.includes(q) || action.includes(q) || res.includes(q);
      });
      if (st === 'failure') filtered = filtered.filter(l => {
        const s = (l.status||'').toUpperCase();
        const code = parseInt(l.httpStatus||l.responseStatus||0);
        return s==='FAILURE'||s==='FAILED'||s==='ERROR'||code>=400;
      });
      if (st === 'success') filtered = filtered.filter(l => {
        const s = (l.status||'').toUpperCase();
        const code = parseInt(l.httpStatus||l.responseStatus||0);
        return s==='SUCCESS'||(code>0&&code<400);
      });
      tbody.innerHTML = buildAuditRows(filtered);
    }

    let _auditSearchTimer = null;
    document.getElementById('audit-search')?.addEventListener('input', (e) => {
      applyAuditFilters();
      clearTimeout(_auditSearchTimer);
      const q = e.target.value.trim();
      if (q.length < 2) return;
      _auditSearchTimer = setTimeout(async () => {
        try {
          const res = await ApiService.searchAuditLogs({ q, size: 200 });
          const rows = extractList(res);
          if (rows.length) {
            _auditCache = rows;
            const tbody = document.getElementById('audit-tbody');
            if (tbody) tbody.innerHTML = buildAuditRows(rows);
          }
        } catch(_) {}
      }, 500);
    });
    document.getElementById('audit-status-filter')?.addEventListener('change', applyAuditFilters);

    document.getElementById('btn-export-audit')?.addEventListener('click', () => {
      if (!_auditCache.length) { showToast('No data to export', 'error'); return; }
      const header = 'Time,User,Action,Resource,Details,IP,Status';
      const rows = _auditCache.map(l => [
        l.timestamp||l.createdAt||'', l.actorEmail||l.userEmail||'System',
        l.action||l.actionType||'', l.entityType||l.resource||'',
        (l.details||l.description||'').replace(/,/g,' '), l.ipAddress||'',
        l.status||''
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
  if (tab === 'discounts') {
    document.getElementById('btn-add-discount')?.addEventListener('click', () => openDrawer('discount', null));
  }
  if (tab === 'finance')  bindFinanceTab();
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
  if (tab === 'fulfillment') {
    const STEPS = ['PICKED','PACKED','DISPATCHED','COMPLETED'];
    const STEP_LABELS = { PICKED:'Picked', PACKED:'Packed', DISPATCHED:'Dispatched', COMPLETED:'Completed' };
    const STEP_ICONS  = { PICKED:'🫳', PACKED:'📦', DISPATCHED:'🚚', COMPLETED:'✅' };
    const STEP_COLORS = { PICKED:'#f59e0b', PACKED:'#3b82f6', DISPATCHED:'#8b5cf6', COMPLETED:'#10b981' };

    function stepDot(step, fulfillmentStatus) {
      const idx     = STEPS.indexOf(step);
      const curIdx  = STEPS.indexOf(fulfillmentStatus);
      const done    = curIdx >= idx;
      const active  = curIdx === idx;
      const clr     = done ? (STEP_COLORS[step]||'#10b981') : '#e2e8f0';
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
          <div style="width:36px;height:36px;border-radius:50%;background:${clr};display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:${active?`0 0 0 3px ${clr}40`:'none'};transition:all .3s">${done?STEP_ICONS[step]:'○'}</div>
          <div style="font-size:10px;font-weight:${active?'700':'500'};color:${done?'#0F172A':'#94A3B8'};text-align:center">${STEP_LABELS[step]}</div>
        </div>`;
    }

    function buildFulPanel(orderId, f) {
      const status = f?.fulfillmentStatus || null;
      const curIdx = status ? STEPS.indexOf(status) : -1;

      const nextStep    = STEPS[curIdx + 1];
      const canPick     = !status;
      const canPack     = status === 'PICKED';
      const canDispatch = status === 'PACKED';
      const canComplete = status === 'DISPATCHED';
      const isDone      = status === 'COMPLETED';

      const timelineHtml = `
        <div style="display:flex;align-items:center;margin-bottom:24px">
          ${STEPS.map((s, i) => `
            ${stepDot(s, status||'')}
            ${i < STEPS.length-1 ? `<div style="flex:0 0 20px;height:2px;background:${curIdx>i?'#10b981':'#e2e8f0'};margin-bottom:18px;transition:background .3s"></div>` : ''}
          `).join('')}
        </div>`;

      const timestamps = status ? `
        <div style="background:#F8FAFC;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:12px">
          ${f.pickedAt     ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#64748B">Picked</span><span style="font-weight:600">${fmt.date(f.pickedAt)}</span></div>` : ''}
          ${f.packedAt     ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#64748B">Packed</span><span style="font-weight:600">${fmt.date(f.packedAt)}</span></div>` : ''}
          ${f.dispatchedAt ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#64748B">Dispatched</span><span style="font-weight:600">${fmt.date(f.dispatchedAt)}</span></div>` : ''}
          ${f.completedAt  ? `<div style="display:flex;justify-content:space-between"><span style="color:#64748B">Completed</span><span style="font-weight:600;color:#10b981">${fmt.date(f.completedAt)}</span></div>` : ''}
          ${f.trackingNumber ? `<div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #E2E8F0"><span style="color:#64748B">Tracking</span><span style="font-weight:600;color:#3b82f6">${f.trackingNumber}</span></div>` : ''}
          ${f.carrier ? `<div style="display:flex;justify-content:space-between;margin-top:4px"><span style="color:#64748B">Carrier</span><span style="font-weight:600">${f.carrier}</span></div>` : ''}
        </div>` : '';

      const actionBtn = isDone
        ? `<div class="d-alert d-alert-ok" style="text-align:center">✅ Fulfillment complete</div>`
        : canPick
        ? `<button class="btn-d btn-d-primary" style="width:100%" id="ful-action-btn" data-action-type="pick" data-order-id="${orderId}">🫳 Mark as Picked</button>`
        : canPack
        ? `<button class="btn-d btn-d-primary" style="width:100%" id="ful-action-btn" data-action-type="pack" data-order-id="${orderId}">📦 Mark as Packed</button>`
        : canDispatch
        ? `<button class="btn-d btn-d-primary" style="width:100%;background:linear-gradient(90deg,#8b5cf6,#7c3aed)" id="ful-action-btn" data-action-type="dispatch" data-order-id="${orderId}">🚚 Dispatch Order…</button>`
        : canComplete
        ? `<button class="btn-d btn-d-success" style="width:100%" id="ful-action-btn" data-action-type="complete" data-order-id="${orderId}">✅ Mark as Delivered</button>`
        : '';

      return `
        <div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:16px">Order #${(f?.orderNumber||orderId||'').toString().slice(-8)}</div>
        ${timelineHtml}
        ${timestamps}
        ${actionBtn}`;
    }

    async function loadFulPanel(orderId) {
      const panel = document.getElementById('ful-panel-body');
      if (!panel) return;
      panel.innerHTML = '<div style="text-align:center;padding:30px;color:#94A3B8">Loading…</div>';
      try {
        const res = await ApiService.getFulfillment(orderId);
        const f = res?.data || res;
        panel.innerHTML = buildFulPanel(orderId, f);
      } catch(e) {
        // No fulfillment yet — show start panel
        panel.innerHTML = buildFulPanel(orderId, null);
      }
      bindPanelBtn(orderId);
    }

    function bindPanelBtn(orderId) {
      const btn = document.getElementById('ful-action-btn');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        const type = btn.dataset.actionType;
        if (type === 'dispatch') {
          document.getElementById('dispatch-order-id').value = orderId;
          document.getElementById('dispatch-modal').style.display = 'flex';
          return;
        }
        btn.disabled = true; btn.textContent = 'Working…';
        try {
          if (type === 'pick')     await ApiService.pickOrder(orderId);
          if (type === 'pack')     await ApiService.packOrder(orderId);
          if (type === 'complete') await ApiService.completeOrder(orderId);
          await loadFulPanel(orderId);
          showToast(`Order ${type === 'complete' ? 'completed' : type + 'ed'}!`);
          if (type === 'complete') loadTab('fulfillment');
        } catch(e) { showToast(e.message || 'Action failed', 'error'); btn.disabled = false; }
      });
    }

    // Row click + "Fulfill" button → load panel
    document.getElementById('ful-tbody')?.addEventListener('click', e => {
      const row = e.target.closest('.ful-row');
      const btn = e.target.closest('[data-action="start-fulfillment"]');
      const orderId = (row || btn)?.dataset?.orderId || (row || btn)?.dataset?.id;
      if (!orderId) return;
      document.querySelectorAll('.ful-row').forEach(r => r.style.background = '');
      if (row) row.style.background = '#FFF7ED';
      loadFulPanel(orderId);
    });

    // Dispatch modal
    document.getElementById('dispatch-cancel')?.addEventListener('click', () => {
      document.getElementById('dispatch-modal').style.display = 'none';
    });
    document.getElementById('dispatch-modal')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });
    document.getElementById('dispatch-confirm')?.addEventListener('click', async () => {
      const orderId  = document.getElementById('dispatch-order-id')?.value;
      const carrier  = document.getElementById('dispatch-carrier')?.value;
      const tracking = document.getElementById('dispatch-tracking')?.value.trim() || undefined;
      const eta      = document.getElementById('dispatch-eta')?.value || undefined;
      if (!carrier) return showToast('Carrier is required', 'error');
      const btn = document.getElementById('dispatch-confirm');
      btn.disabled = true; btn.textContent = 'Dispatching…';
      try {
        await ApiService.dispatchOrder(orderId, {
          carrier,
          trackingNumber: tracking,
          estimatedDeliveryDate: eta ? (eta.length === 16 ? eta + ':00' : eta) : undefined,
        });
        document.getElementById('dispatch-modal').style.display = 'none';
        await loadFulPanel(orderId);
        showToast('Order dispatched!');
      } catch(e) { showToast(e.message || 'Dispatch failed', 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Dispatch'; }
    });
  }

  if (tab === 'shipments') {
    document.getElementById('btn-create-shipment')?.addEventListener('click', () => openDrawer('shipment', null));

    // Track by tracking number
    async function doTrack() {
      const num = document.getElementById('track-number-input')?.value.trim();
      const resultEl = document.getElementById('track-result');
      if (!num || !resultEl) return;
      resultEl.innerHTML = '<span style="color:#94A3B8;font-size:13px">Searching…</span>';
      try {
        const res = await ApiService.trackShipment(num);
        const s = res?.data || res;
        if (!s?.id) throw new Error('Not found');
        const statusColors = { PENDING:'#f59e0b', IN_TRANSIT:'#3b82f6', OUT_FOR_DELIVERY:'#8b5cf6', DELIVERED:'#10b981', CANCELLED:'#ef4444' };
        const clr = statusColors[s.status] || '#94a3b8';
        resultEl.innerHTML = `
          <div style="border:1.5px solid ${clr}30;border-radius:12px;padding:16px 20px;background:${clr}08;display:flex;gap:20px;flex-wrap:wrap;align-items:center">
            <div>
              <div style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Tracking #</div>
              <div style="font-size:14px;font-weight:700;color:#0F172A">${esc(s.trackingNumber||num)}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Carrier</div>
              <div style="font-size:14px;font-weight:700;color:#0F172A">${esc(s.carrier||'—')}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Status</div>
              <span style="background:${clr}20;color:${clr};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700">${s.status||'—'}</span>
            </div>
            <div>
              <div style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Est. Delivery</div>
              <div style="font-size:14px;font-weight:700;color:#0F172A">${fmt.date(s.estimatedDeliveryDate||s.estimatedDelivery||null)}</div>
            </div>
            ${s.actualDeliveryDate ? `<div>
              <div style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Delivered On</div>
              <div style="font-size:14px;font-weight:700;color:#10b981">${fmt.date(s.actualDeliveryDate)}</div>
            </div>` : ''}
            <div style="margin-left:auto">
              <div style="font-size:11px;color:#94A3B8;font-weight:600;text-transform:uppercase;letter-spacing:.06em">Order</div>
              <div style="font-size:12px;color:#0F172A">#${(s.order?.id||s.orderId||'—').toString().slice(-8)}</div>
            </div>
          </div>`;
      } catch(err) {
        const msg = err?.message && err.message !== 'Not found' ? `: ${err.message}` : '';
        resultEl.innerHTML = `<div class="d-alert d-alert-err" style="margin:0">No shipment found for tracking number "<strong>${esc(num)}</strong>"${msg}</div>`;
      }
    }
    document.getElementById('btn-track-shipment')?.addEventListener('click', doTrack);
    document.getElementById('track-number-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') doTrack(); });

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
  const populateSel = (list) => {
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
    const sel2 = document.getElementById('d-prod-cat');
    if (sel2 && selectedId) sel2.value = selectedId;
  };

  // Pre-fill immediately from cache so the dropdown isn't empty while fetching
  if (_categoryCache.length) populateSel(_categoryCache);

  try {
    const cats = await ApiService.getCategories();
    const list = Array.isArray(cats?.data) ? cats.data
               : Array.isArray(cats?.content) ? cats.content
               : Array.isArray(cats) ? cats : [];
    if (list.length) { _categoryCache = list; populateSel(list); }
  } catch(_){}
}

async function viewOrderDetail(id) {
  let order = {}, shipment = null;
  try {
    [order, shipment] = await Promise.all([
      ApiService.getOrder(id).catch(() => ({})),
      ApiService.getShipmentByOrder(id).then(r => r?.data || r).catch(() => null)
    ]);
  } catch(_){}
  const ship = Array.isArray(shipment) ? shipment[0] : shipment;
  const shipSection = ship ? `
    <div style="margin-top:16px;padding:12px;background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0">
      <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:8px">🚚 Shipment</div>
      <div style="font-size:12px;color:#15803D;display:flex;gap:16px;flex-wrap:wrap">
        <span>Carrier: <b>${esc(ship.carrier||'—')}</b></span>
        <span>Tracking: <b>${esc(ship.trackingNumber||'—')}</b></span>
        <span>Status: ${statusBdg(ship.status||'PENDING')}</span>
        ${ship.estimatedDelivery ? `<span>ETA: <b>${fmt.date(ship.estimatedDelivery)}</b></span>` : ''}
      </div>
    </div>` : '';
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
    ${shipSection}
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

  // ── MTN sandbox test runner ──────────────────────────────
  document.getElementById('btn-run-mtn-tests')?.addEventListener('click', async () => {
    const btn      = document.getElementById('btn-run-mtn-tests');
    const statusEl = document.getElementById('mtn-test-status');
    const resultsEl= document.getElementById('mtn-test-results');
    const colKey   = document.getElementById('mtn-col-key')?.value.trim() || undefined;
    const disKey   = document.getElementById('mtn-dis-key')?.value.trim() || undefined;

    btn.disabled = true; btn.textContent = '⏳ Running 13 tests…';
    if (statusEl) { statusEl.style.display=''; statusEl.style.color='#1E40AF'; statusEl.textContent='Connecting to MTN MoMo sandbox…'; }
    if (resultsEl) resultsEl.style.display = 'none';

    try {
      const results = await ApiService.runMtnSandboxTests({ collectionKey: colKey, disbursementKey: disKey });
      const list = Array.isArray(results) ? results : (results?.data || []);

      const passed = list.filter(r => r.actualResult === 'Pass').length;
      const failed = list.filter(r => r.actualResult === 'Fail').length;
      const skipped= list.filter(r => r.actualResult === 'Not Tested').length;

      if (statusEl) {
        statusEl.style.color = failed > 0 ? '#991B1B' : '#065F46';
        statusEl.textContent = `Done — ${passed} passed · ${failed} failed · ${skipped} skipped. Report saved to mtn_sandbox_test_report.md on server.`;
      }

      if (resultsEl && list.length) {
        resultsEl.style.display = '';
        resultsEl.innerHTML = `
          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
            <span class="bdg bdg-green">${passed} Pass</span>
            <span class="bdg bdg-red">${failed} Fail</span>
            ${skipped ? `<span class="bdg bdg-yellow">${skipped} Skipped</span>` : ''}
          </div>
          <table class="dt" style="font-size:11px">
            <thead><tr><th>#</th><th>Scenario</th><th>Step</th><th>Result</th><th>Response</th></tr></thead>
            <tbody>
              ${list.map(r => `
                <tr>
                  <td>${r.testCaseId}</td>
                  <td style="white-space:nowrap;font-weight:600">${esc(r.scenarioTitle||'')}</td>
                  <td>${esc(r.stepDescription||'')}</td>
                  <td><span class="bdg ${r.actualResult==='Pass'?'bdg-green':r.actualResult==='Fail'?'bdg-red':'bdg-yellow'}">${r.actualResult}</span></td>
                  <td style="max-width:220px;white-space:normal;font-size:10px;color:#64748B">${esc(String(r.apiResponse||'').slice(0,120))}</td>
                </tr>`).join('')}
            </tbody>
          </table>`;
      }
    } catch(e) {
      if (statusEl) { statusEl.style.color='#991B1B'; statusEl.textContent = e.message || 'MTN test runner failed'; }
    } finally {
      btn.disabled = false; btn.textContent = '▶ Run MTN Sandbox Tests';
    }
  });

  // ── API health pings ─────────────────────────────────────
  document.getElementById('btn-run-pings')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-pings');
    btn.disabled = true; btn.textContent = '⏳ Pinging…';

    async function ping(badgeId, fn) {
      const badge = document.getElementById(badgeId);
      if (badge) { badge.className = 'bdg bdg-yellow'; badge.textContent = 'Checking…'; }
      try {
        await fn();
        if (badge) { badge.className = 'bdg bdg-green'; badge.textContent = 'OK'; }
      } catch(_) {
        if (badge) { badge.className = 'bdg bdg-red'; badge.textContent = 'Error'; }
      }
    }

    await Promise.allSettled([
      ping('ping-products-badge', () => ApiService.pingProductApi()),
      ping('ping-auth-badge',     () => ApiService.getProfile()),
      ping('ping-db-badge',       () => ApiService.inventory.getItems()),
    ]);

    btn.disabled = false; btn.textContent = '🏓 Ping All Endpoints';
  });
}

// ── Support tab ───────────────────────────────────────────
let _supActiveChatId = null;

function bindSupportTab() {
  // ── Main sub-tab switching ─────────────────────────────
  document.querySelectorAll('.sup-main-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _supSubTab = btn.dataset.supMain;
      document.querySelectorAll('.sup-main-tab').forEach(b => b.classList.toggle('active', b===btn));
      ['tickets','chats','faq'].forEach(id => {
        const el = document.getElementById(`sup-panel-${id}`);
        if (el) el.style.display = id === _supSubTab ? '' : 'none';
      });
    });
  });

  // ── My Queue (assigned-to-me tickets) ──────────────────
  document.querySelector('[data-action="sup-filter-assigned"]')?.addEventListener('click', async (e) => {
    _supTicketFilter = '__assigned__';
    document.querySelectorAll('[data-action="sup-filter"]').forEach(b => {
      b.classList.remove('btn-d-primary'); b.classList.add('btn-d-sec');
    });
    e.currentTarget.classList.remove('btn-d-sec'); e.currentTarget.classList.add('btn-d-warning');
    const res = await ApiService.getAssignedTickets().catch(() => null);
    const tickets = extractList(res);
    const priorityClr = { HIGH:'#ef4444', CRITICAL:'#dc2626', MEDIUM:'#f59e0b', LOW:'#10b981' };
    const html = tickets.length ? tickets.map(t => `
      <div class="sup-item" data-ticket-id="${t.id}" style="cursor:pointer">
        <div class="sup-item-title">${esc(t.title||'Support Request')}</div>
        <div class="sup-item-meta">
          ${statusBdg(t.status||'OPEN')}
          <span style="color:${priorityClr[t.priority]||'#94A3B8'};font-size:10px;font-weight:700">${t.priority||''}</span>
          <span style="font-size:11px;color:#94A3B8">${fmt.ago(t.updatedAt||t.createdAt)}</span>
        </div>
        <div style="font-size:11px;color:#64748B;margin-top:3px">${esc(t.customer?.firstName||'')} ${esc(t.customer?.lastName||'')} · <em style="color:#3B82F6">Assigned to me</em></div>
      </div>`).join('') :
      `<div class="d-empty"><div class="d-empty-ico">✅</div><div class="d-empty-ttl">No tickets assigned to you</div></div>`;
    const list = document.getElementById('sup-ticket-list');
    if (list) { list.innerHTML = html; bindTicketClicks(); }
  });

  // ── Ticket status filter ───────────────────────────────
  document.querySelectorAll('[data-action="sup-filter"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      _supTicketFilter = btn.dataset.status;
      document.querySelectorAll('[data-action="sup-filter"]').forEach(b => {
        b.classList.toggle('btn-d-primary', b.dataset.status === _supTicketFilter);
        b.classList.toggle('btn-d-sec',     b.dataset.status !== _supTicketFilter);
      });
      const myQ = document.querySelector('[data-action="sup-filter-assigned"]');
      if (myQ) { myQ.classList.remove('btn-d-warning'); myQ.classList.add('btn-d-sec'); }
      const res = await ApiService.getSupportTickets({ page:0, size:100, status: _supTicketFilter }).catch(() => null);
      const tickets = extractList(res);
      const priorityClr = { HIGH:'#ef4444', CRITICAL:'#dc2626', MEDIUM:'#f59e0b', LOW:'#10b981' };
      const html = tickets.length ? tickets.map(t => `
        <div class="sup-item" data-ticket-id="${t.id}" style="cursor:pointer">
          <div class="sup-item-title">${esc(t.title||'Support Request')}</div>
          <div class="sup-item-meta">
            ${statusBdg(t.status||'OPEN')}
            <span style="color:${priorityClr[t.priority]||'#94A3B8'};font-size:10px;font-weight:700">${t.priority||''}</span>
            <span style="font-size:11px;color:#94A3B8">${fmt.ago(t.updatedAt||t.createdAt)}</span>
          </div>
          <div style="font-size:11px;color:#64748B;margin-top:3px">${esc(t.customer?.firstName||'')} ${esc(t.customer?.lastName||'')}${t.assignedAgent ? ` · Agent: ${esc(t.assignedAgent.firstName||'')}` : ' · <em style="color:#f59e0b">Unassigned</em>'}</div>
        </div>`).join('') :
        `<div class="d-empty"><div class="d-empty-ico">🎫</div><div class="d-empty-ttl">No tickets</div></div>`;
      const list = document.getElementById('sup-ticket-list');
      if (list) { list.innerHTML = html; bindTicketClicks(); }
    });
  });

  // ── Ticket click → messages + assign panel ─────────────
  function bindTicketClicks() {
    document.querySelectorAll('#sup-ticket-list .sup-item[data-ticket-id]').forEach(el => {
      el.addEventListener('click', async () => {
        if (_supActiveChatId) { unsubscribeWS(`/topic/live-chat/${_supActiveChatId}`); _supActiveChatId = null; }
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
          const msgs   = msgRes.data || [];
          const customerName = ticket.customer
            ? `${ticket.customer.firstName||''} ${ticket.customer.lastName||''}`.trim() : 'Customer';
          const agentOpts = _supAgentCache.map(a =>
            `<option value="${a.id}" ${ticket.assignedAgent?.id===a.id?'selected':''}>${a.firstName||''} ${a.lastName||''} (${a.role})</option>`
          ).join('');
          panel.innerHTML = `
            <div class="sup-chat-hd">
              <div class="dash-user-av">${customerName[0]||'C'}</div>
              <div>
                <div style="font-size:13px;font-weight:700">${esc(ticket.title||ticket.subject||'Ticket')}</div>
                <div style="font-size:11px;color:#94A3B8">${customerName} · Priority: <b>${ticket.priority||'—'}</b></div>
              </div>
              ${statusBdg(ticket.status||'OPEN')}
              <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
                <select id="sup-assign-agent" class="dash-inp" style="font-size:12px;padding:4px 8px;width:170px">
                  <option value="">— Assign agent —</option>
                  ${agentOpts}
                </select>
                <button class="btn-d btn-d-primary btn-d-sm" id="btn-do-assign">Assign</button>
                <button class="btn-d btn-d-success btn-d-sm" id="btn-resolve-ticket" data-id="${ticketId}">Resolve</button>
              </div>
            </div>
            <div class="sup-messages" id="sup-msgs">
              ${msgs.length ? msgs.map(m => {
                const isAgent = m.sender?.roles?.some(r => (r.name||r||'').includes('AGENT')||(r.name||r||'').includes('ADMIN')) ?? false;
                return `<div><div class="sup-bubble ${isAgent?'agent':'customer'}">${m.message||m.content||''}</div><div style="font-size:10px;color:#94A3B8;text-align:${isAgent?'right':'left'};margin-top:3px">${fmt.ago(m.createdAt)}</div></div>`;
              }).join('') : '<div style="text-align:center;color:#94A3B8;padding:24px">No messages yet</div>'}
            </div>
            <div class="sup-inp-row">
              <textarea id="sup-reply" placeholder="Type your reply…"></textarea>
              <button class="btn-d btn-d-primary" id="sup-send">Send</button>
            </div>`;
          document.getElementById('btn-do-assign')?.addEventListener('click', async () => {
            const agentId = document.getElementById('sup-assign-agent')?.value;
            if (!agentId) return showToast('Select an agent first', 'error');
            await ApiService.assignTicket(ticketId, agentId).catch(e => { throw e; });
            showToast('Ticket assigned'); loadTab('support');
          });
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
  }
  bindTicketClicks();

  // ── Live chat session click ─────────────────────────────
  document.querySelectorAll('.sup-item[data-chat-id]').forEach(el => {
    el.addEventListener('click', async () => {
      document.querySelectorAll('.sup-item').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      const sessionId = el.dataset.chatId;
      const panel = document.getElementById('sup-chat-panel-live') || document.getElementById('sup-chat-panel');
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
            <textarea id="sup-live-reply" placeholder="Type a message…"></textarea>
            <button class="btn-d btn-d-primary" id="sup-live-send">Send</button>
          </div>`;
        ApiService.chat.getSessions().then(r => {
          const session = (r.data||[]).find(s => s.id === sessionId);
          if (session) {
            const subEl = document.getElementById('sup-chat-subject');
            const stEl  = document.getElementById('sup-chat-status-label');
            if (subEl) subEl.textContent = session.subject || 'Live Chat';
            if (stEl)  stEl.textContent  = session.status + (session.agent ? ` · Agent: ${session.agent.firstName||session.agent.email}` : ' · Unassigned');
          }
        }).catch(() => {});
        document.getElementById('sup-msgs-live').scrollTop = 99999;
        document.getElementById('sup-live-send')?.addEventListener('click', async () => {
          const ta = document.getElementById('sup-live-reply');
          const msg = ta?.value?.trim(); if (!msg) return; ta.value = '';
          await ApiService.chat.sendMessage(sessionId, msg).catch(() => {});
        });
        document.getElementById('btn-assign-self')?.addEventListener('click', async () => {
          if (!me?.id) return;
          await ApiService.chat.assignSession(sessionId, me.id).catch(e => showToast(e.message,'error'));
          const stEl = document.getElementById('sup-chat-status-label');
          if (stEl) stEl.textContent = 'ASSIGNED · You are the agent';
          showToast('You joined this chat as agent');
        });
        document.getElementById('btn-close-chat')?.addEventListener('click', async () => {
          if (!confirm('Close this chat session?')) return;
          await ApiService.chat.closeSession(sessionId).catch(() => {});
          if (_supActiveChatId) { unsubscribeWS(`/topic/live-chat/${_supActiveChatId}`); _supActiveChatId = null; }
          showToast('Chat closed'); loadTab('support');
        });
        if (_supActiveChatId && _supActiveChatId !== sessionId) unsubscribeWS(`/topic/live-chat/${_supActiveChatId}`);
        _supActiveChatId = sessionId;
        connectWS(() => {
          subscribeWS(`/topic/live-chat/${sessionId}`, (msgData) => {
            const isMe = msgData.senderId === me?.id;
            const box = document.getElementById('sup-msgs-live'); if (!box) return;
            const lbl = !isMe ? `<div style="font-size:10px;opacity:.6;margin-bottom:2px">${(msgData.senderEmail||'').split('@')[0]}</div>` : '';
            box.innerHTML += `<div style="display:flex;flex-direction:column;align-items:${isMe?'flex-end':'flex-start'};margin-bottom:8px">${lbl}<div class="sup-bubble ${isMe?'agent':'customer'}">${msgData.message||''}</div></div>`;
            box.scrollTop = box.scrollHeight;
          });
          subscribeWS('/topic/live-chat/sessions', (session) => {
            if (session.id === sessionId && session.status === 'CLOSED') { showToast('Chat session was closed'); loadTab('support'); }
          });
        });
      } catch(_) { panel.innerHTML = `<div class="d-alert d-alert-err" style="margin:16px">Failed to load chat</div>`; }
    });
  });

  // ── FAQ CRUD ───────────────────────────────────────────
  function openFaqModal(faq = null) {
    document.getElementById('faq-modal-title').textContent = faq ? 'Edit FAQ' : 'New FAQ';
    document.getElementById('faq-question').value  = faq?.question  || '';
    document.getElementById('faq-answer').value    = faq?.answer    || '';
    document.getElementById('faq-category').value  = faq?.category  || '';
    document.getElementById('faq-published').checked = faq ? faq.published : true;
    document.getElementById('faq-edit-id').value   = faq?.id        || '';
    document.getElementById('faq-modal').style.display = 'flex';
    document.getElementById('faq-question').focus();
  }
  function closeFaqModal() { document.getElementById('faq-modal').style.display = 'none'; }

  document.getElementById('btn-new-faq')?.addEventListener('click', () => openFaqModal());
  document.getElementById('faq-modal-cancel')?.addEventListener('click', closeFaqModal);
  document.getElementById('faq-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeFaqModal(); });

  document.getElementById('faq-modal-save')?.addEventListener('click', async () => {
    const question  = document.getElementById('faq-question')?.value.trim();
    const answer    = document.getElementById('faq-answer')?.value.trim();
    const category  = document.getElementById('faq-category')?.value.trim();
    const published = document.getElementById('faq-published')?.checked ?? true;
    const editId    = document.getElementById('faq-edit-id')?.value;
    if (!question || !answer || !category) return showToast('Question, answer and category are required', 'error');
    const btn = document.getElementById('faq-modal-save');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const payload = { question, answer, category, published };
      if (editId) await ApiService.updateFaq(editId, payload);
      else        await ApiService.createFaq(payload);
      showToast(editId ? 'FAQ updated' : 'FAQ created');
      closeFaqModal();
      loadTab('support');
    } catch(e) { showToast(e.message||'Save failed','error'); }
    finally { btn.disabled = false; btn.textContent = 'Save FAQ'; }
  });

  document.getElementById('faq-tbody')?.addEventListener('click', async e => {
    const editBtn   = e.target.closest('[data-action="edit-faq"]');
    const deleteBtn = e.target.closest('[data-action="delete-faq"]');
    if (editBtn) {
      try {
        const res = await ApiService.getFaq(editBtn.dataset.id);
        const faq = res?.data || res || _supFaqCache.find(f => f.id === editBtn.dataset.id);
        if (faq) openFaqModal(faq);
      } catch(_) {
        const faq = _supFaqCache.find(f => f.id === editBtn.dataset.id);
        if (faq) openFaqModal(faq);
      }
    }
    if (deleteBtn) {
      if (!confirm('Delete this FAQ article?')) return;
      await ApiService.deleteFaq(deleteBtn.dataset.id).catch(e => showToast(e.message,'error'));
      showToast('FAQ deleted'); loadTab('support');
    }
  });

  // Real-time: new sessions notification
  connectWS(() => {
    subscribeWS('/topic/live-chat/sessions', (session) => {
      if (session.status === 'OPEN') showToast(`New live chat: "${session.subject || 'Session'}"`, 'info');
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
  const items    = receipt.items || [];
  const orderId  = receipt.orderId || receipt.id || '';
  const orderNum = receipt.orderNumber || orderId;
  const subtotal = receipt.subTotalAmount || receipt.subtotal || 0;
  const taxAmt   = receipt.taxAmount || 0;
  const total    = receipt.totalAmount || 0;

  const el = document.createElement('div');
  el.id = 'pos-receipt-overlay';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = `
    <div style="background:#fff;border-radius:14px;width:420px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;">

      <!-- Header -->
      <div style="padding:24px 24px 0;text-align:center;">
        <div style="font-size:13px;font-weight:700;color:#FF6B00;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px;">Luz Technology</div>
        <div style="font-size:11px;color:#94A3B8;margin-bottom:12px;">Official Receipt</div>
        <div style="width:48px;height:48px;background:#FFF7F0;border-radius:50%;margin:0 auto 8px;display:flex;align-items:center;justify-content:center;font-size:22px;">🧾</div>
        <div style="font-size:16px;font-weight:800;">Sale Complete</div>
        <div style="font-size:12px;color:#64748B;margin-top:2px;">Order #${orderNum}</div>
        <div style="font-size:11px;color:#94A3B8;">${new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</div>
      </div>

      <!-- Receipt printable body -->
      <div id="pos-rcpt-printable" style="padding:16px 24px;">
        <!-- Items -->
        <div style="border-top:1px dashed #E2E8F0;border-bottom:1px dashed #E2E8F0;padding:12px 0;margin:12px 0;">
          ${items.length ? items.map(i=>`
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
              <span style="max-width:220px;">${i.productName||'Product'} <span style="color:#94A3B8">×${i.quantity}</span></span>
              <span style="font-weight:600;">${fmt.money(i.subTotal||((i.unitPrice||0)*(i.quantity||1)))}</span>
            </div>`).join('') :
            '<div style="font-size:13px;color:#94A3B8;text-align:center;">Items processed successfully.</div>'}
        </div>

        <!-- Totals -->
        <div style="font-size:13px;">
          ${subtotal ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#64748B;"><span>Subtotal</span><span>${fmt.money(subtotal)}</span></div>` : ''}
          ${taxAmt   ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#64748B;"><span>Tax (18%)</span><span>${fmt.money(taxAmt)}</span></div>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding-top:8px;border-top:2px solid #F1F5F9;margin-top:4px;">
          <span>Total Paid</span><span style="color:#FF6B00;">${fmt.money(total)}</span>
        </div>

        <!-- Meta -->
        <div style="margin-top:12px;padding:10px;background:#F8FAFC;border-radius:8px;font-size:12px;color:#64748B;line-height:1.8;">
          <div><strong>Payment:</strong> ${(receipt.paymentMethod||'—').replace(/_/g,' ')}</div>
          ${receipt.paymentReference ? `<div><strong>Reference:</strong> ${receipt.paymentReference}</div>` : ''}
          ${receipt.cashierEmail     ? `<div><strong>Cashier:</strong> ${receipt.cashierEmail}</div>` : ''}
          ${receipt.customerEmail    ? `<div><strong>Customer:</strong> ${receipt.customerEmail}</div>` : ''}
        </div>

        <div style="text-align:center;font-size:11px;color:#94A3B8;margin-top:14px;padding-top:10px;border-top:1px dashed #E2E8F0;">
          Thank you for shopping at Luz Technology!
        </div>
      </div>

      <!-- Action buttons -->
      <div style="padding:12px 24px 20px;display:flex;gap:8px;">
        <button id="pos-rcpt-pdf" style="flex:1;padding:10px 8px;background:#1E293B;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">⬇ Download PDF</button>
        <button id="pos-rcpt-print" style="flex:1;padding:10px 8px;background:#475569;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">🖨 Print</button>
        <button id="pos-receipt-close" style="flex:1;padding:10px 8px;background:#FF6B00;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">Done</button>
      </div>
    </div>`;

  document.body.appendChild(el);

  // Close
  el.querySelector('#pos-receipt-close').onclick = () => el.remove();
  el.onclick = (e) => { if (e.target === el) el.remove(); };

  // PDF download — uses existing receipt PDF endpoint
  el.querySelector('#pos-rcpt-pdf').onclick = async (e) => {
    const btn = e.currentTarget;
    if (!orderId) { showToast('Order ID not available for PDF download', 'error'); return; }
    btn.disabled = true; btn.textContent = '⏳ Generating…';
    try {
      await ApiService.receipts.downloadPdf(orderId, orderNum);
      showToast('Receipt downloaded', 'success');
    } catch(_) {
      showToast('Could not download PDF', 'error');
    } finally {
      btn.disabled = false; btn.textContent = '⬇ Download PDF';
    }
  };

  // Print — inject print stylesheet, print the receipt content, remove stylesheet
  el.querySelector('#pos-rcpt-print').onclick = () => {
    const printable = el.querySelector('#pos-rcpt-printable');
    const header    = el.querySelector('div[style*="padding:24px 24px 0"]');
    const win = window.open('', '_blank', 'width=480,height=720');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Receipt — ${orderNum}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
        .brand { text-align:center; font-size:18px; font-weight:800; color:#FF6B00; margin-bottom:2px; }
        .sub   { text-align:center; font-size:11px; color:#94A3B8; margin-bottom:12px; }
        .title { text-align:center; font-size:16px; font-weight:700; margin-bottom:4px; }
        .meta  { text-align:center; font-size:12px; color:#64748B; margin-bottom:16px; }
        .items { border-top:1px dashed #ccc; border-bottom:1px dashed #ccc; padding:10px 0; margin:12px 0; }
        .item  { display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; }
        .totals  { font-size:13px; }
        .tot-row { display:flex; justify-content:space-between; margin-bottom:4px; color:#64748B; }
        .grand { display:flex; justify-content:space-between; font-size:16px; font-weight:800; border-top:2px solid #e2e8f0; padding-top:8px; margin-top:6px; }
        .grand span:last-child { color:#FF6B00; }
        .info  { font-size:12px; color:#64748B; line-height:1.8; background:#f8fafc; padding:10px; border-radius:6px; margin-top:12px; }
        .footer { text-align:center; font-size:11px; color:#94A3B8; margin-top:16px; border-top:1px dashed #ccc; padding-top:10px; }
        @media print { body { padding:10px; } }
      </style>
    </head><body>
      <div class="brand">Luz Technology</div>
      <div class="sub">Official Receipt</div>
      <div class="title">Sale Complete — #${orderNum}</div>
      <div class="meta">${new Date().toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}</div>
      <div class="items">
        ${items.map(i=>`<div class="item"><span>${i.productName||'Product'} ×${i.quantity}</span><span>${fmt.money(i.subTotal||((i.unitPrice||0)*(i.quantity||1)))}</span></div>`).join('')}
      </div>
      <div class="totals">
        ${subtotal ? `<div class="tot-row"><span>Subtotal</span><span>${fmt.money(subtotal)}</span></div>` : ''}
        ${taxAmt   ? `<div class="tot-row"><span>Tax (18%)</span><span>${fmt.money(taxAmt)}</span></div>` : ''}
      </div>
      <div class="grand"><span>Total Paid</span><span>${fmt.money(total)}</span></div>
      <div class="info">
        <div><strong>Payment:</strong> ${(receipt.paymentMethod||'—').replace(/_/g,' ')}</div>
        ${receipt.paymentReference ? `<div><strong>Reference:</strong> ${receipt.paymentReference}</div>` : ''}
        ${receipt.cashierEmail     ? `<div><strong>Cashier:</strong> ${receipt.cashierEmail}</div>` : ''}
        ${receipt.customerEmail    ? `<div><strong>Customer:</strong> ${receipt.customerEmail}</div>` : ''}
      </div>
      <div class="footer">Thank you for shopping at Luz Technology!</div>
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };
}

// ── Reports ───────────────────────────────────────────────
async function downloadReport(type, format) {
  const from = document.getElementById('report-from')?.value || _finDateFrom;
  const to   = document.getElementById('report-to')?.value   || _finDateTo;
  showToast(`Preparing ${type} report…`);
  try {
    if (type === 'sales') {
      await ApiService.downloadSalesReport({ startDate: from, endDate: to });
    } else if (type === 'finance' && format === 'CSV') {
      await ApiService.exportFinancialManagement({ startDate: from, endDate: to });
    } else if (type === 'finance' && format === 'taxes') {
      await ApiService.exportTaxRecords({ startDate: from, endDate: to });
    } else {
      showToast(`${type} ${format} export not yet available`, 'error');
      return;
    }
    showToast('Download started', 'success');
  } catch(e) {
    showToast(e.message || 'Download failed', 'error');
  }
}

// ── Finance tab bindings ──────────────────────────────────
function bindFinanceTab() {
  // Date range apply
  document.getElementById('btn-fin-apply')?.addEventListener('click', () => {
    const from = document.getElementById('fin-date-from')?.value;
    const to   = document.getElementById('fin-date-to')?.value;
    if (from) _finDateFrom = from;
    if (to)   _finDateTo   = to;
    loadTab('finance');
  });

  // Sub-tab switching (delegated via the action handler in bindEvents)
  // but we also bind direct clicks here for the sub-tab buttons
  document.querySelectorAll('[data-action="fin-subtab"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      _finSubTab = btn.dataset.tab;
      loadTab('finance');
    });
  });

  // Export buttons
  document.getElementById('btn-export-taxes')?.addEventListener('click', async () => {
    try {
      showToast('Exporting tax records…');
      await ApiService.exportTaxRecords({ startDate: _finDateFrom, endDate: _finDateTo });
      showToast('Download started', 'success');
    } catch(e) { showToast(e.message || 'Export failed', 'error'); }
  });

  // ── Manual tax recording ─────────────────────────────────
  const taxRecordForm  = document.getElementById('tax-record-form');
  const showRecordBtn  = document.getElementById('btn-show-record-tax');
  const cancelRecordBtn = document.getElementById('btn-cancel-record-tax');
  showRecordBtn?.addEventListener('click', () => {
    if (taxRecordForm) { taxRecordForm.style.display = 'flex'; showRecordBtn.style.display = 'none'; }
    document.getElementById('tax-order-id')?.focus();
  });
  cancelRecordBtn?.addEventListener('click', () => {
    if (taxRecordForm) { taxRecordForm.style.display = 'none'; showRecordBtn.style.display = ''; }
    const inp = document.getElementById('tax-order-id'); if (inp) inp.value = '';
  });
  document.getElementById('btn-do-record-tax')?.addEventListener('click', async () => {
    const orderId = document.getElementById('tax-order-id')?.value.trim();
    if (!orderId) return showToast('Enter an Order UUID', 'error');
    const btn = document.getElementById('btn-do-record-tax');
    btn.disabled = true; btn.textContent = '…';
    try {
      const res = await ApiService.recordOrderTax(orderId);
      const rec = res?.data || res;
      showToast(`Tax recorded: ${fmt.money(rec?.amount || 0)} for order …${orderId.slice(-8)}`);
      if (taxRecordForm) { taxRecordForm.style.display = 'none'; showRecordBtn.style.display = ''; }
      loadTab('finance');
    } catch(e) { showToast(e.message || 'Failed to record tax', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Record'; }
  });
  document.getElementById('tax-order-id')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-do-record-tax')?.click();
  });

  document.getElementById('btn-export-fin-mgmt')?.addEventListener('click', async () => {
    try {
      showToast('Exporting financial management report…');
      await ApiService.exportFinancialManagement({ startDate: _finDateFrom, endDate: _finDateTo });
      showToast('Download started', 'success');
    } catch(e) { showToast(e.message || 'Export failed', 'error'); }
  });

  // ── Reconciliation bindings ──────────────────────────────
  if (_finSubTab === 'reconciliation') {
    let _recTxnCache = [];

    async function reloadRecTbody(search, statusFilter) {
      const tbody = document.getElementById('rec-tbody');
      if (!tbody) return;
      let list = _recTxnCache;
      if (search) list = list.filter(t => (t.provider||'').toLowerCase().includes(search) || (t.paymentReference||'').toLowerCase().includes(search));
      if (statusFilter) list = list.filter(t => t.reconciliationStatus === statusFilter);
      const rcBdg = s => {
        const m = { MATCHED:'bdg-green', PENDING:'bdg-yellow', MISMATCH:'bdg-red', UNRECONCILED:'bdg-purple' };
        return `<span class="bdg ${m[s]||'bdg-blue'}">${s||'—'}</span>`;
      };
      tbody.innerHTML = list.length ? list.map(t => `
        <tr>
          <td class="td-sm" title="${t.id||''}" style="font-size:10px;color:#94A3B8;max-width:80px;overflow:hidden;text-overflow:ellipsis">${(t.id||'').slice(0,8)}…</td>
          <td class="td-b">${esc(t.provider||'—')}</td>
          <td class="td-m">${esc(t.paymentReference||'—')}</td>
          <td>${esc(t.transactionType||'—')}</td>
          <td>${fmt.money(t.amount||0)}</td>
          <td>${statusBdg(t.status)}</td>
          <td>${rcBdg(t.reconciliationStatus)}</td>
          <td class="td-sm" style="font-size:11px;max-width:180px;white-space:normal;color:#64748B">${esc(t.reconciliationNotes||'—')}</td>
          <td class="td-sm">${t.reconciledAt ? fmt.date(t.reconciledAt) : '—'}</td>
          <td>${t.reconciliationStatus !== 'MATCHED'
            ? `<button class="btn-d btn-d-success btn-d-sm" data-action="reconcile-txn" data-id="${t.id}">Reconcile</button>`
            : `<span style="color:#10b981;font-size:12px">✓ Matched</span>`}
          </td>
        </tr>`).join('') :
        `<tr><td colspan="10"><div class="d-empty"><div class="d-empty-ico">💳</div><div class="d-empty-ttl">No matching transactions</div></div></td></tr>`;
      // Re-bind reconcile buttons
      tbody.querySelectorAll('[data-action="reconcile-txn"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          btn.disabled = true; btn.textContent = 'Working…';
          try {
            await ApiService.reconcileTransaction(btn.dataset.id);
            showToast('Transaction reconciled', 'success');
            loadTab('finance');
          } catch(e) { showToast(e.message || 'Failed', 'error'); btn.disabled = false; btn.textContent = 'Reconcile'; }
        });
      });
    }

    // Initial cache population (already rendered in HTML; populate cache from API for filtering)
    ApiService.getReconciliationTransactions().then(res => {
      _recTxnCache = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    }).catch(() => {});

    // Search + filter
    const recSearch = document.getElementById('rec-search');
    const recFilter = document.getElementById('rec-status-filter');
    function applyRecFilter() {
      reloadRecTbody(recSearch?.value.toLowerCase().trim(), recFilter?.value);
    }
    recSearch?.addEventListener('input', applyRecFilter);
    recFilter?.addEventListener('change', applyRecFilter);

    // Reconcile All
    document.getElementById('btn-reconcile-all')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-reconcile-all');
      btn.disabled = true; btn.textContent = '⏳ Running…';
      try {
        const res = await ApiService.reconcileAll();
        const s = res?.data || res || {};
        showToast(`Reconciliation complete — ${s.statusBreakdown?.MATCHED||0} matched`, 'success');
        loadTab('finance');
      } catch(e) { showToast(e.message || 'Reconcile all failed', 'error'); }
      finally { btn.disabled = false; btn.textContent = '⚡ Reconcile All'; }
    });

    // Individual reconcile buttons in initial render
    document.querySelectorAll('[data-action="reconcile-txn"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = 'Working…';
        try {
          await ApiService.reconcileTransaction(btn.dataset.id);
          showToast('Transaction reconciled', 'success');
          loadTab('finance');
        } catch(e) { showToast(e.message || 'Failed', 'error'); btn.disabled = false; btn.textContent = 'Reconcile'; }
      });
    });

    return; // Don't fall through to expense bindings
  }

  // Expense CRUD — only present when sub-tab is 'expenses'
  if (_finSubTab !== 'expenses') return;

  const modal    = document.getElementById('expense-modal');
  const titleEl  = document.getElementById('expense-modal-title');
  const idEl     = document.getElementById('expense-modal-id');
  const catEl    = document.getElementById('exp-category');
  const amtEl    = document.getElementById('exp-amount');
  const dateEl   = document.getElementById('exp-date');
  const statusEl = document.getElementById('exp-status');
  const descEl   = document.getElementById('exp-desc');
  const errEl    = document.getElementById('expense-modal-err');

  function openExpenseModal(expense = null) {
    if (!modal) return;
    idEl.value     = expense?.id || '';
    catEl.value    = expense?.category || '';
    amtEl.value    = expense?.amount || '';
    dateEl.value   = expense?.expenseDate || new Date().toISOString().slice(0,10);
    statusEl.value = expense?.status || 'PENDING';
    descEl.value   = expense?.description || '';
    if (titleEl) titleEl.textContent = expense ? 'Edit Expense' : 'Add Expense';
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
    modal.style.display = 'flex';
  }
  function closeExpenseModal() { if (modal) modal.style.display = 'none'; }

  document.getElementById('btn-add-expense')?.addEventListener('click', () => openExpenseModal(null));
  document.getElementById('btn-close-expense-modal')?.addEventListener('click', closeExpenseModal);
  document.getElementById('btn-cancel-expense')?.addEventListener('click', closeExpenseModal);

  document.getElementById('btn-save-expense')?.addEventListener('click', async () => {
    const id = idEl?.value;
    const payload = {
      category:    catEl?.value?.trim(),
      amount:      parseFloat(amtEl?.value),
      expenseDate: dateEl?.value,
      status:      statusEl?.value,
      description: descEl?.value?.trim() || null,
    };
    if (!payload.category || !payload.amount || !payload.expenseDate || !payload.status) {
      if (errEl) { errEl.textContent = 'Category, amount, date and status are required.'; errEl.style.display = 'block'; }
      return;
    }
    try {
      if (id) await ApiService.updateExpense(id, payload);
      else    await ApiService.createExpense(payload);
      closeExpenseModal();
      showToast(id ? 'Expense updated' : 'Expense added', 'success');
      loadTab('finance');
    } catch(e) {
      if (errEl) { errEl.textContent = e.message || 'Save failed'; errEl.style.display = 'block'; }
    }
  });

  // Edit expense — populate modal from cache
  document.querySelectorAll('[data-action="edit-expense"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exp = _expenseCache.find(e => e.id === btn.dataset.id);
      if (exp) openExpenseModal(exp);
    });
  });

  // Quick status update
  document.querySelectorAll('[data-action="expense-status"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await ApiService.updateExpenseStatus(btn.dataset.id, btn.dataset.status);
        showToast(`Expense marked ${btn.dataset.status.toLowerCase()}`, 'success');
        loadTab('finance');
      } catch(e) { showToast(e.message || 'Update failed', 'error'); }
    });
  });

  // Delete expense
  document.querySelectorAll('[data-action="delete-expense"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this expense?')) return;
      try {
        await ApiService.deleteExpense(btn.dataset.id);
        showToast('Expense deleted', 'success');
        loadTab('finance');
      } catch(e) { showToast(e.message || 'Delete failed', 'error'); }
    });
  });

  // Status filter
  document.getElementById('expense-status-filter')?.addEventListener('change', (e) => {
    const val = e.target.value;
    const filtered = val ? _expenseCache.filter(ex => ex.status === val) : _expenseCache;
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;
    const rows = filtered.length ? filtered.map(ex => `
      <tr>
        <td class="td-sm">${fmt.date(ex.expenseDate)}</td>
        <td class="td-b">${ex.category||'—'}</td>
        <td>${ex.description||'—'}</td>
        <td>${fmt.money(ex.amount||0)}</td>
        <td>${statusBdg(ex.status||'PENDING')}</td>
        <td>
          <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-expense" data-id="${ex.id}">${I.edit}</button>
          <button class="btn-d btn-d-sec btn-d-sm" data-action="expense-status" data-id="${ex.id}" data-status="APPROVED">✓</button>
          <button class="btn-d btn-d-sec btn-d-sm" data-action="expense-status" data-id="${ex.id}" data-status="PAID">$</button>
          <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-expense" data-id="${ex.id}">${I.trash}</button>
        </td>
      </tr>`) .join('') :
      `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">💸</div><div class="d-empty-ttl">No expenses found</div></div></td></tr>`;
    tbody.innerHTML = rows;
    bindFinanceTab();
  });
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
