import './style.css';
import { ApiService } from '../../api.js';
import { appState } from '../../store.js';

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
  const titles = { product:'Product', order:'Order Detail', coupon:'Coupon', banner:'Banner', user:'User', customer:'Customer', adjust:'Adjust Stock', ticket:'Support Ticket' };
  document.getElementById('d-drawer-title').textContent = (data?'Edit ':'New ') + (titles[type]||type);
  document.getElementById('d-drawer-body').innerHTML = drawerBody(type, data);
  document.getElementById('d-drawer-footer').innerHTML = drawerFooter(type, data);
  document.getElementById('d-overlay').classList.add('open');
  document.getElementById('d-drawer').classList.add('open');
  drawerOpen = true;
  bindDrawerEvents(type, data);
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
    badges.orders  = orders.value?.totalElements  || 0;
    badges.returns = returns.value?.totalElements || 0;
    badges.tickets = tickets.value?.totalElements || 0;
    document.querySelectorAll('.dash-nav-item[data-tab="orders"] .dash-nav-badge').forEach(el => { if(badges.orders) el.textContent = badges.orders; });
    if (badges.orders || badges.returns || badges.tickets) {
      const dot = document.getElementById('notif-dot');
      if (dot) dot.style.display = '';
    }
  } catch(_) {}
}

// ── Formatters ────────────────────────────────────────────
const fmt = {
  money: v => '$' + Number(v||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  num:   v => Number(v||0).toLocaleString(),
  date:  v => v ? new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—',
  ago:   v => { if(!v) return '—'; const s=(Date.now()-new Date(v))/1000; if(s<60) return 'just now'; if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; },
};

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
TAB.analytics = async () => {
  let stats = { revenue:0, orders:0, customers:0, aov:0, convRate:0, refundRate:0 };
  let topProds = [];
  let revenueByMonth = [];
  let ordersByStatus = [];
  try {
    const [ds, tp, rb, os] = await Promise.allSettled([
      ApiService.getAdminStats(),
      ApiService.getTopProducts({ limit:5 }),
      ApiService.getRevenueByMonth(),
      ApiService.getOrdersByStatus(),
    ]);
    if(ds.value) stats = { ...stats, ...ds.value };
    if(tp.value) topProds = tp.value;
    if(rb.value) revenueByMonth = rb.value;
    if(os.value) ordersByStatus = os.value;
  } catch(_){}

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const barData = revenueByMonth.length ? revenueByMonth : months.slice(0,7).map((m,i)=>({ month:m, revenue: 8000+Math.random()*12000 }));
  const maxRev = Math.max(...barData.map(d=>d.revenue||0), 1);

  const donutColors = ['#FF6B00','#3B82F6','#10B981','#8B5CF6','#F59E0B'];
  const catData = ordersByStatus.length ? ordersByStatus : [
    {label:'Delivered',value:45},{label:'Processing',value:25},{label:'Pending',value:15},{label:'Cancelled',value:10},{label:'Returned',value:5}
  ];
  const totalCat = catData.reduce((a,b)=>a+(b.value||0),0)||1;
  let donutPaths = ''; let legendHtml = ''; let off = 0;
  const r = 50, cx = 60, cy = 60, circ = 2*Math.PI*r;
  catData.forEach((d,i)=>{
    const pct = (d.value||0)/totalCat;
    const len = pct * circ;
    donutPaths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${donutColors[i%5]}" stroke-width="20" stroke-dasharray="${len} ${circ-len}" stroke-dashoffset="${-off+circ/4}" transform="rotate(-90,${cx},${cy})"/>`;
    legendHtml += `<div class="dash-legend-item"><div class="dash-legend-dot" style="background:${donutColors[i%5]}"></div>${d.label} <b style="margin-left:auto;font-weight:700">${d.value||0}</b></div>`;
    off += len;
  });

  const barsHtml = barData.map(d => {
    const pct = Math.round(((d.revenue||0)/maxRev)*100);
    return `<div class="dash-bar-col"><div class="dash-bar" style="height:${Math.max(pct,3)}%" title="${fmt.money(d.revenue)}"></div><div class="dash-bar-lbl">${d.month||''}</div></div>`;
  }).join('');

  const topProdsHtml = topProds.length ? topProds.map(p=>`
    <div class="d-widget-row">
      <span>${p.name||p.productName||'Product'}</span>
      <span class="td-b">${fmt.money(p.revenue||p.totalRevenue||0)}</span>
    </div>`).join('') :
    ['Wireless Earbuds','Smart Watch','Laptop Stand','Desk Lamp','Phone Case'].map((n,i)=>`
    <div class="d-widget-row"><span>${n}</span><span style="font-weight:700">${fmt.money(1200-i*180)}</span></div>`).join('');

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Dashboard Overview</div><div class="dash-page-sub">Welcome back, ${getUser().firstName||'Admin'}. Here's what's happening today.</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-export-analytics">${I.download} Export</button>
      <button class="btn-d btn-d-primary" onclick="document.querySelector('[data-tab=orders]').click()">${I.cart} View Orders</button>
    </div>
  </div>

  <div class="dash-stats">
    <div class="dash-stat"><div class="dash-stat-ico ico-green">${I.dollar}</div><div class="dash-stat-lbl">Total Revenue</div><div class="dash-stat-val">${fmt.money(stats.totalRevenue||stats.revenue||0)}</div><div class="dash-stat-trend up">▲ 12.4% vs last month</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-blue">${I.cart}</div><div class="dash-stat-lbl">Total Orders</div><div class="dash-stat-val">${fmt.num(stats.totalOrders||stats.orders||0)}</div><div class="dash-stat-trend up">▲ 8.1% vs last month</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-purple">${I.users}</div><div class="dash-stat-lbl">Customers</div><div class="dash-stat-val">${fmt.num(stats.totalCustomers||stats.customers||0)}</div><div class="dash-stat-trend up">▲ 5.3% vs last month</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-orange">${I.dollar}</div><div class="dash-stat-lbl">Avg Order Value</div><div class="dash-stat-val">${fmt.money(stats.averageOrderValue||stats.aov||0)}</div><div class="dash-stat-trend flat">→ Stable</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-yellow">${I.bar}</div><div class="dash-stat-lbl">Conversion Rate</div><div class="dash-stat-val">${(stats.conversionRate||stats.convRate||3.2).toFixed(1)}%</div><div class="dash-stat-trend up">▲ 0.4%</div></div>
    <div class="dash-stat"><div class="dash-stat-ico ico-red">${I.rotate}</div><div class="dash-stat-lbl">Refund Rate</div><div class="dash-stat-val">${(stats.refundRate||2.1).toFixed(1)}%</div><div class="dash-stat-trend down">▼ 0.3%</div></div>
  </div>

  <div class="dash-charts-row">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Revenue Overview</div>
      <div class="dash-chart-sub">Monthly revenue for the past 7 months</div>
      <div class="dash-bars">${barsHtml}</div>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Orders by Status</div>
      <div class="dash-chart-sub">Current distribution</div>
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
      <div class="d-widget-row"><span>Low Stock Items</span><span class="bdg bdg-red">—</span></div>
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">${I.bell} Quick Links</div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=orders]').click()"><span style="color:#FF6B00">View pending orders</span><span>${I.chevR}</span></div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=returns]').click()"><span style="color:#FF6B00">Review returns</span><span>${I.chevR}</span></div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=support]').click()"><span style="color:#FF6B00">Support tickets</span><span>${I.chevR}</span></div>
      <div class="d-widget-row" style="cursor:pointer" onclick="document.querySelector('[data-tab=inventory]').click()"><span style="color:#FF6B00">Check inventory</span><span>${I.chevR}</span></div>
    </div>
  </div>`;
};

// ── Orders ────────────────────────────────────────────────
TAB.orders = async () => {
  let orders = []; let total = 0;
  try {
    const res = await ApiService.getOrders({ page:0, size:20 });
    orders = res.content || res || [];
    total  = res.totalElements || orders.length;
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
TAB.products = async () => {
  let products = []; let total = 0;
  try {
    const res = await ApiService.getProducts({ page:0, size:20 });
    products = res.content || res || [];
    total    = res.totalElements || products.length;
  } catch(_){}

  const rows = products.length ? products.map(p => `
    <tr>
      <td><span class="td-m">#${p.id||'—'}</span></td>
      <td class="td-b">${p.name||p.productName||'Product'}</td>
      <td>${p.category?.name||p.categoryName||'—'}</td>
      <td>${fmt.money(p.price||0)}</td>
      <td>${p.stock!=null?p.stock:p.quantity||0}</td>
      <td>${statusBdg(p.status||'ACTIVE')}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-product" data-id="${p.id}" title="Edit">${I.edit}</button>
        <button class="btn-d btn-d-danger btn-d-sm btn-d-ico" data-action="delete-product" data-id="${p.id}" title="Delete">${I.trash}</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">📦</div><div class="d-empty-ttl">No products yet</div><div class="d-empty-txt">Add your first product to get started.</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Products</div><div class="dash-page-sub">${fmt.num(total)} products</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec" id="btn-import-products">${I.download} Import</button>
      <button class="btn-d btn-d-sec" id="btn-export-products">${I.download} Export</button>
      <button class="btn-d btn-d-primary" id="btn-add-product">${I.plus} Add Product</button>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">All Products</span>
      <span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search products…" id="product-search" style="width:180px">
        <select class="dash-sel" id="product-cat-filter"><option value="">All Categories</option></select>
        <select class="dash-sel" id="product-status-filter"><option value="">All Statuses</option><option>ACTIVE</option><option>INACTIVE</option></select>
        <button class="btn-d btn-d-sec btn-d-sm" id="btn-filter-products">${I.search}</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody id="products-tbody">${rows}</tbody>
    </table>
  </div>`;
};

// ── Inventory ─────────────────────────────────────────────
TAB.inventory = async () => {
  let items = [];
  try {
    const res = await ApiService.getInventory({ page:0, size:30 });
    items = res.content || res || [];
  } catch(_){}

  const rows = items.length ? items.map(item => {
    const stock = item.quantity||item.stock||0;
    const max   = item.maxStock||100;
    const pct   = Math.min(Math.round(stock/max*100),100);
    const cls   = pct > 50 ? 'ok' : pct > 20 ? 'low' : 'out';
    return `<tr>
      <td class="td-b">${item.productName||item.name||'Product'}</td>
      <td>${item.sku||item.productSku||'—'}</td>
      <td>${item.warehouse||item.location||'Main'}</td>
      <td>
        <span style="font-weight:700;color:${cls==='out'?'#EF4444':cls==='low'?'#F59E0B':'#10B981'}">${stock}</span>
        <div class="d-stock-bar" style="width:80px"><div class="d-stock-fill ${cls}" style="width:${pct}%"></div></div>
      </td>
      <td>${item.reorderPoint||10}</td>
      <td>${statusBdg(stock===0?'OUT_OF_STOCK':stock<(item.reorderPoint||10)?'PENDING':'ACTIVE')}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="adjust-stock" data-id="${item.id||item.productId}" data-name="${item.productName||item.name}">Adjust</button>
      </td>
    </tr>`;
  }).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🏭</div><div class="d-empty-ttl">No inventory data</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Inventory</div><div class="dash-page-sub">Warehouse stock overview</div></div>
    <div class="dash-page-acts">
      <button class="btn-d btn-d-sec">${I.download} Export</button>
      <button class="btn-d btn-d-primary" id="btn-bulk-adjust">${I.plus} Bulk Adjust</button>
    </div>
  </div>
  <div class="d-widgets" style="margin-bottom:16px">
    <div class="d-widget"><div class="d-widget-ttl">Stock Health</div>
      <div class="d-widget-row"><span>In Stock</span><span class="bdg bdg-green">${items.filter(i=>(i.quantity||0)>0).length}</span></div>
      <div class="d-widget-row"><span>Low Stock</span><span class="bdg bdg-yellow">${items.filter(i=>(i.quantity||0)>0&&(i.quantity||0)<=(i.reorderPoint||10)).length}</span></div>
      <div class="d-widget-row"><span>Out of Stock</span><span class="bdg bdg-red">${items.filter(i=>(i.quantity||0)===0).length}</span></div>
    </div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd">
      <span class="dash-tcard-title">Stock Levels</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search SKU or name…" style="width:200px">
        <select class="dash-sel"><option>All Warehouses</option><option>Main</option><option>Secondary</option></select>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Product</th><th>SKU</th><th>Location</th><th>Quantity</th><th>Reorder At</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

// ── Returns ───────────────────────────────────────────────
TAB.returns = async () => {
  let items = []; let total = 0;
  try {
    const res = await ApiService.getReturns({ page:0, size:20 });
    items = res.content || res || [];
    total = res.totalElements || items.length;
  } catch(_){}

  const rows = items.length ? items.map(r => `
    <tr>
      <td class="td-m">#${r.id||'—'}</td>
      <td class="td-m">#${r.orderId||'—'}</td>
      <td class="td-b">${r.customerName||'Customer'}</td>
      <td>${r.reason||'Not specified'}</td>
      <td>${fmt.money(r.refundAmount||r.amount||0)}</td>
      <td>${statusBdg(r.status||'PENDING')}</td>
      <td class="td-sm">${fmt.date(r.createdAt)}</td>
      <td style="display:flex;gap:5px">
        ${r.status==='PENDING'||!r.status ? `
          <button class="btn-d btn-d-success btn-d-sm" data-action="approve-return" data-id="${r.id}">Approve</button>
          <button class="btn-d btn-d-danger btn-d-sm"  data-action="reject-return"  data-id="${r.id}">Reject</button>
        ` : `<button class="btn-d btn-d-sec btn-d-sm" data-action="view-return" data-id="${r.id}">View</button>`}
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
        <select class="dash-sel" id="return-status-filter"><option value="">All</option><option>PENDING</option><option>APPROVED</option><option>REJECTED</option></select>
        <button class="btn-d btn-d-sec btn-d-sm" id="btn-filter-returns">${I.search}</button>
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
    items = res.content || res || [];
    total = res.totalElements || items.length;
  } catch(_){}

  const rows = items.length ? items.map(s => `
    <tr>
      <td class="td-m">${s.trackingNumber||s.tracking||'—'}</td>
      <td class="td-m">#${s.orderId||'—'}</td>
      <td class="td-b">${s.recipientName||s.customerName||'Customer'}</td>
      <td>${s.carrier||'—'}</td>
      <td>${statusBdg(s.status||'IN_TRANSIT')}</td>
      <td class="td-sm">${fmt.date(s.estimatedDelivery||s.eta)}</td>
      <td><button class="btn-d btn-d-sec btn-d-sm" data-action="view-shipment" data-id="${s.id}">${I.eye} Track</button></td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">🚚</div><div class="d-empty-ttl">No shipments found</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Shipments</div><div class="dash-page-sub">${total} shipments</div></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Active Shipments</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts"><input class="dash-inp" placeholder="Search tracking…" style="width:180px"></div>
    </div>
    <table class="dt">
      <thead><tr><th>Tracking #</th><th>Order</th><th>Recipient</th><th>Carrier</th><th>Status</th><th>ETA</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

// ── Coupons ───────────────────────────────────────────────
TAB.coupons = async () => {
  let coupons = []; let total = 0;
  try {
    const res = await ApiService.getCoupons({ page:0, size:20 });
    coupons = res.content || res || [];
    total   = res.totalElements || coupons.length;
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
    banners = res.content || res || [];
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
    const res = await ApiService.getCustomers({ page:0, size:20 });
    customers = res.content || res || [];
    total     = res.totalElements || customers.length;
  } catch(_){}

  const rows = customers.length ? customers.map(c => `
    <tr>
      <td class="td-m">#${c.id||'—'}</td>
      <td class="td-b">${c.firstName||''} ${c.lastName||''}</td>
      <td>${c.email||'—'}</td>
      <td>${c.orderCount||c.totalOrders||0}</td>
      <td>${fmt.money(c.totalSpent||c.lifetimeValue||0)}</td>
      <td>${statusBdg(c.status||'ACTIVE')}</td>
      <td class="td-sm">${fmt.date(c.createdAt||c.joinDate)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm" data-action="view-customer" data-id="${c.id}">${I.eye} View</button>
      </td>
    </tr>`).join('') :
    `<tr><td colspan="8"><div class="d-empty"><div class="d-empty-ico">👥</div><div class="d-empty-ttl">No customers found</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Customers</div><div class="dash-page-sub">${fmt.num(total)} registered customers</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec">${I.download} Export</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Customer List</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search customers…" style="width:180px" id="crm-search">
        <button class="btn-d btn-d-sec btn-d-sm">${I.search}</button>
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Orders</th><th>LTV</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

// ── Support ───────────────────────────────────────────────
TAB.support = async () => {
  let tickets = [];
  try {
    const res = await ApiService.getSupportTickets({ page:0, size:30 });
    tickets = res.content || res || [];
  } catch(_){}

  const ticketListHtml = tickets.length ? tickets.map(t => `
    <div class="sup-item" data-ticket-id="${t.id}">
      <div class="sup-item-title">${t.subject||t.title||'Support Request'}</div>
      <div class="sup-item-meta">
        ${statusBdg(t.status||'OPEN')}
        <span>${fmt.ago(t.updatedAt||t.createdAt)}</span>
      </div>
    </div>`).join('') :
    `<div class="d-empty"><div class="d-empty-ico">💬</div><div class="d-empty-ttl">No tickets</div></div>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Support</div><div class="dash-page-sub">${tickets.length} tickets</div></div>
  </div>
  <div class="sup-layout">
    <div class="sup-list">
      <div class="sup-list-hd">Tickets</div>
      ${ticketListHtml}
    </div>
    <div class="sup-chat" id="sup-chat-panel">
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#94A3B8">
        <div style="text-align:center"><div style="font-size:36px;margin-bottom:8px">💬</div><div style="font-weight:600">Select a ticket to view</div></div>
      </div>
    </div>
  </div>`;
};

// ── Finance ───────────────────────────────────────────────
TAB.finance = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied. Admin only.</div>`;
  let stats = {};
  try { stats = await ApiService.getFinanceStats() || {}; } catch(_){}

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
    users = res.content || res || [];
    total = res.totalElements || users.length;
  } catch(_){}

  const rows = users.length ? users.map(u => `
    <tr>
      <td class="td-m">#${u.id||'—'}</td>
      <td class="td-b">${u.firstName||''} ${u.lastName||''}</td>
      <td>${u.email||'—'}</td>
      <td>${(u.roles||[]).map(r=>`<span class="bdg bdg-blue" style="margin-right:3px">${r.replace('ROLE_','')}</span>`).join('')||'—'}</td>
      <td>${statusBdg(u.status||'ACTIVE')}</td>
      <td class="td-sm">${fmt.date(u.createdAt)}</td>
      <td>
        <button class="btn-d btn-d-sec btn-d-sm btn-d-ico" data-action="edit-user" data-id="${u.id}">${I.edit}</button>
        ${u.status==='BLOCKED'?
          `<button class="btn-d btn-d-success btn-d-sm" data-action="unblock-user" data-id="${u.id}">Unblock</button>`:
          `<button class="btn-d btn-d-danger btn-d-sm"  data-action="block-user"   data-id="${u.id}">Block</button>`}
      </td>
    </tr>`).join('') :
    `<tr><td colspan="7"><div class="d-empty"><div class="d-empty-ico">👤</div><div class="d-empty-ttl">No users found</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">User Management</div><div class="dash-page-sub">${fmt.num(total)} registered users</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-primary" id="btn-add-user">${I.plus} Add User</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">All Users</span><span class="dash-tcard-count">${total}</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Search users…" style="width:180px" id="user-search">
        <select class="dash-sel" id="user-role-filter"><option value="">All Roles</option><option>ADMIN</option><option>EMPLOYEE</option><option>CUSTOMER</option></select>
        <button class="btn-d btn-d-sec btn-d-sm">${I.search}</button>
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
  return `
  <div class="dash-page-hd"><div><div class="dash-page-title">Security Settings</div><div class="dash-page-sub">Authentication and access control</div></div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div class="dash-chart-card">
      <div class="dash-chart-hd">Password Policy</div>
      <div class="f-field"><label class="f-lbl">Min Length</label><input class="f-inp" type="number" value="8" min="6" max="32"></div>
      <div class="f-field"><label class="f-lbl">Require Uppercase</label><label class="d-toggle"><input type="checkbox" checked><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Require Numbers</label><label class="d-toggle"><input type="checkbox" checked><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Require Special Chars</label><label class="d-toggle"><input type="checkbox"><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Password Expiry (days)</label><input class="f-inp" type="number" value="90"></div>
      <button class="btn-d btn-d-primary" style="margin-top:8px">Save Policy</button>
    </div>
    <div class="dash-chart-card">
      <div class="dash-chart-hd">MFA Settings</div>
      <div class="f-field"><label class="f-lbl">MFA Required for Admins</label><label class="d-toggle"><input type="checkbox" checked><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">MFA Required for Employees</label><label class="d-toggle"><input type="checkbox"><span class="d-tog-slider"></span></label></div>
      <div class="f-field"><label class="f-lbl">Session Timeout (minutes)</label><input class="f-inp" type="number" value="60"></div>
      <div class="f-field"><label class="f-lbl">Max Failed Login Attempts</label><input class="f-inp" type="number" value="5"></div>
      <div class="f-field"><label class="f-lbl">Lockout Duration (minutes)</label><input class="f-inp" type="number" value="15"></div>
      <button class="btn-d btn-d-primary" style="margin-top:8px">Save Settings</button>
    </div>
  </div>`;
};

// ── Audit Log ─────────────────────────────────────────────
TAB.audit = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  let logs = []; let total = 0;
  try {
    const res = await ApiService.getAuditLogs({ page:0, size:30 });
    logs  = res.content || res || [];
    total = res.totalElements || logs.length;
  } catch(_){}

  const rows = logs.length ? logs.map(l => `
    <tr>
      <td class="td-sm">${fmt.ago(l.timestamp||l.createdAt)}</td>
      <td class="td-b">${l.actorEmail||l.userEmail||'System'}</td>
      <td><span class="bdg bdg-blue">${l.action||l.actionType||'ACTION'}</span></td>
      <td>${l.entityType||l.resource||'—'}</td>
      <td class="td-sm" style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l.details||l.description||'—'}</td>
      <td class="td-m">${l.ipAddress||'—'}</td>
    </tr>`).join('') :
    `<tr><td colspan="6"><div class="d-empty"><div class="d-empty-ico">📋</div><div class="d-empty-ttl">No audit logs</div></div></td></tr>`;

  return `
  <div class="dash-page-hd">
    <div><div class="dash-page-title">Audit Log</div><div class="dash-page-sub">${fmt.num(total)} events</div></div>
    <div class="dash-page-acts"><button class="btn-d btn-d-sec">${I.download} Export</button></div>
  </div>
  <div class="dash-tcard">
    <div class="dash-tcard-hd"><span class="dash-tcard-title">Recent Activity</span>
      <div class="dash-tcard-acts">
        <input class="dash-inp" placeholder="Filter by user or action…" style="width:200px">
      </div>
    </div>
    <table class="dt">
      <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th><th>IP</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

// ── System ────────────────────────────────────────────────
TAB.system = async () => {
  if (!isAdmin()) return `<div class="d-alert d-alert-err">Access denied.</div>`;
  return `
  <div class="dash-page-hd"><div><div class="dash-page-title">System</div><div class="dash-page-sub">Backups, config & health</div></div></div>
  <div class="d-widgets">
    <div class="d-widget">
      <div class="d-widget-ttl">System Health</div>
      <div class="d-widget-row"><span>API Server</span><span class="bdg bdg-green">Online</span></div>
      <div class="d-widget-row"><span>Database</span><span class="bdg bdg-green">Connected</span></div>
      <div class="d-widget-row"><span>Email Service</span><span class="bdg bdg-yellow">Degraded</span></div>
      <div class="d-widget-row"><span>Storage</span><span class="bdg bdg-green">OK</span></div>
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">Backups</div>
      <div class="d-widget-row"><span>Last Backup</span><span class="td-sm">2 hours ago</span></div>
      <div class="d-widget-row"><span>Backup Size</span><span>2.4 GB</span></div>
      <div class="d-widget-row"><span>Retention</span><span>30 days</span></div>
      <button class="btn-d btn-d-primary" style="margin-top:10px;width:100%" id="btn-trigger-backup">Trigger Backup Now</button>
    </div>
    <div class="d-widget">
      <div class="d-widget-ttl">Configuration</div>
      <div class="f-field"><label class="f-lbl">Store Name</label><input class="f-inp" value="Luz Technology"></div>
      <div class="f-field"><label class="f-lbl">Support Email</label><input class="f-inp" value="support@luz.tech"></div>
      <div class="f-field"><label class="f-lbl">Maintenance Mode</label><label class="d-toggle"><input type="checkbox"><span class="d-tog-slider"></span></label></div>
      <button class="btn-d btn-d-primary" style="margin-top:8px">Save Config</button>
    </div>
  </div>`;
};

// ── POS ───────────────────────────────────────────────────
TAB.pos = async () => {
  let products = [];
  try {
    const res = await ApiService.getProducts({ page:0, size:50, status:'ACTIVE' });
    products = res.content || res || [];
  } catch(_){}

  const prodHtml = products.length ? products.map(p => `
    <div class="pos-prod" data-pos-id="${p.id}" data-pos-name="${p.name||p.productName}" data-pos-price="${p.price||0}">
      <img class="pos-prod-img" src="${p.imageUrl||p.thumbnailUrl||'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22><rect width=%2256%22 height=%2256%22 fill=%22%23f1f5f9%22/><text x=%2228%22 y=%2234%22 text-anchor=%22middle%22 font-size=%2220%22>📦</text></svg>'}" alt="${p.name||''}">
      <div class="pos-prod-name">${p.name||p.productName||'Product'}</div>
      <div class="pos-prod-price">${fmt.money(p.price||0)}</div>
    </div>`).join('') :
    `<div style="grid-column:1/-1;text-align:center;color:#94A3B8;padding:32px">No products available</div>`;

  return `
  <div class="dash-page-hd"><div><div class="dash-page-title">Point of Sale</div><div class="dash-page-sub">In-store retail checkout</div></div></div>
  <div class="pos-layout">
    <div class="pos-catalog">
      <div class="pos-cat-hd">
        <input class="dash-inp" placeholder="Search products…" id="pos-search" style="width:100%">
      </div>
      <div class="pos-grid" id="pos-grid">${prodHtml}</div>
    </div>
    <div class="pos-cart">
      <div class="pos-cart-hd">🛒 Current Sale</div>
      <div class="pos-cart-items" id="pos-cart-items"><div class="d-empty" style="padding:32px 16px"><div class="d-empty-ico" style="font-size:28px">🛒</div><div class="d-empty-ttl" style="font-size:13px">Cart is empty</div></div></div>
      <div class="pos-footer">
        <div class="pos-totals" id="pos-totals">
          <div class="pos-total-row"><span>Subtotal</span><span class="amount" id="pos-sub">$0.00</span></div>
          <div class="pos-total-row"><span>Tax (8%)</span><span class="amount" id="pos-tax">$0.00</span></div>
          <div class="pos-total-row grand"><span>Total</span><span id="pos-total">$0.00</span></div>
        </div>
        <div style="display:flex;gap:7px">
          <button class="btn-d btn-d-sec" style="flex:1" id="pos-clear">Clear</button>
          <button class="btn-d btn-d-primary" style="flex:2" id="pos-checkout">Charge ${fmt.money(0)}</button>
        </div>
      </div>
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
    <div class="f-row"><div class="f-field"><label class="f-lbl">Stock Quantity</label><input class="f-inp" type="number" id="d-prod-stock" value="${data?.stock||0}"></div><div class="f-field"><label class="f-lbl">Category</label><select class="f-sel" id="d-prod-cat"><option value="">Select…</option></select></div></div>
    <div class="f-field"><label class="f-lbl">Image URL</label><input class="f-inp" id="d-prod-img" value="${data?.imageUrl||''}"></div>
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
}

async function saveDrawer(type, data) {
  const btn = document.getElementById('d-btn-save');
  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    if (type === 'product') {
      const payload = {
        name:        document.getElementById('d-prod-name')?.value,
        sku:         document.getElementById('d-prod-sku')?.value,
        description: document.getElementById('d-prod-desc')?.value,
        price:       parseFloat(document.getElementById('d-prod-price')?.value)||0,
        comparePrice:parseFloat(document.getElementById('d-prod-compare')?.value)||null,
        stock:       parseInt(document.getElementById('d-prod-stock')?.value)||0,
        imageUrl:    document.getElementById('d-prod-img')?.value,
        status:      document.getElementById('d-prod-status')?.value,
        featured:    document.getElementById('d-prod-featured')?.checked,
      };
      data ? await ApiService.updateProduct(data.id, payload) : await ApiService.createProduct(payload);
    } else if (type === 'coupon') {
      const payload = {
        code:            (document.getElementById('d-coup-code')?.value||'').toUpperCase(),
        discountType:    document.getElementById('d-coup-type')?.value,
        discountValue:   parseFloat(document.getElementById('d-coup-val')?.value)||0,
        minimumPurchase: parseFloat(document.getElementById('d-coup-min')?.value)||null,
        usageLimit:      parseInt(document.getElementById('d-coup-limit')?.value)||null,
        expiryDate:      document.getElementById('d-coup-exp')?.value||null,
      };
      data ? await ApiService.updateCoupon(data.id, payload) : await ApiService.createCoupon(payload);
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
      const adjType = document.getElementById('adj-type')?.value;
      const qty     = parseInt(document.getElementById('adj-qty')?.value)||0;
      const reason  = document.getElementById('adj-reason')?.value;
      await ApiService.adjustInventory(data.id, { adjustmentType:adjType, quantity:qty, reason });
    } else if (type === 'user') {
      const payload = {
        firstName: document.getElementById('d-usr-fn')?.value,
        lastName:  document.getElementById('d-usr-ln')?.value,
        email:     document.getElementById('d-usr-email')?.value,
        password:  document.getElementById('d-usr-pw')?.value,
        roles:     [document.getElementById('d-usr-role')?.value],
      };
      data ? await ApiService.updateUser(data.id, payload) : await ApiService.createUser(payload);
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
    const { action, id, name, type: rtype, format } = el.dataset;

    if (action === 'edit-product') { const p = await ApiService.getProduct(id).catch(()=>({id})); openDrawer('product', p); }
    else if (action === 'delete-product') { if(confirm('Delete this product?')) { await ApiService.deleteProduct(id).catch(()=>{}); loadTab('products'); } }
    else if (action === 'edit-coupon')  { const c = await ApiService.getCoupon(id).catch(()=>({id})); openDrawer('coupon', c); }
    else if (action === 'delete-coupon') { if(confirm('Delete coupon?')) { await ApiService.deleteCoupon(id).catch(()=>{}); loadTab('coupons'); } }
    else if (action === 'edit-banner')  { const b = await ApiService.getBanner(id).catch(()=>({id})); openDrawer('banner', b); }
    else if (action === 'delete-banner') { if(confirm('Delete banner?')) { await ApiService.deleteBanner(id).catch(()=>{}); loadTab('banners'); } }
    else if (action === 'adjust-stock') { openDrawer('adjust', { id, name }); }
    else if (action === 'approve-return') { await ApiService.approveReturn(id).catch(()=>{}); showToast('Return approved'); loadTab('returns'); }
    else if (action === 'reject-return')  { await ApiService.rejectReturn(id).catch(()=>{}); showToast('Return rejected'); loadTab('returns'); }
    else if (action === 'block-user')   { await ApiService.blockUser(id).catch(()=>{}); showToast('User blocked'); loadTab('users'); }
    else if (action === 'unblock-user') { await ApiService.unblockUser(id).catch(()=>{}); showToast('User unblocked'); loadTab('users'); }
    else if (action === 'download-report') { downloadReport(rtype, format); }
    else if (action === 'view-order')    { viewOrderDetail(id); }
    else if (action === 'view-customer') { viewCustomer(id); }
    else if (action === 'edit-user')     { const u = await ApiService.getUser(id).catch(()=>({id})); openDrawer('user', u); }
  });

  // Tab-specific bindings
  if (tab === 'products') {
    document.getElementById('btn-add-product')?.addEventListener('click', () => openDrawer('product', null));
    document.getElementById('btn-filter-products')?.addEventListener('click', () => loadTab('products'));
    loadCategories();
  }
  if (tab === 'coupons')  document.getElementById('btn-add-coupon')?.addEventListener('click',  () => openDrawer('coupon', null));
  if (tab === 'banners')  document.getElementById('btn-add-banner')?.addEventListener('click',  () => openDrawer('banner', null));
  if (tab === 'users')    document.getElementById('btn-add-user')?.addEventListener('click',    () => openDrawer('user', null));
  if (tab === 'support')  bindSupportTab();
  if (tab === 'pos')      bindPOS();
  if (tab === 'system')   document.getElementById('btn-trigger-backup')?.addEventListener('click', async () => { showToast('Backup started…'); });
}

async function loadCategories() {
  try {
    const cats = await ApiService.getCategories();
    const sel = document.getElementById('d-prod-cat') || document.getElementById('product-cat-filter');
    if (!sel) return;
    (cats.content||cats||[]).forEach(c => { const o = document.createElement('option'); o.value=c.id; o.textContent=c.name; sel.appendChild(o); });
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

// ── Support tab ───────────────────────────────────────────
function bindSupportTab() {
  document.querySelectorAll('.sup-item').forEach(el => {
    el.addEventListener('click', async () => {
      document.querySelectorAll('.sup-item').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      const ticketId = el.dataset.ticketId;
      const panel = document.getElementById('sup-chat-panel');
      panel.innerHTML = `<div style="padding:20px;color:#94A3B8">Loading…</div>`;
      try {
        const ticket = await ApiService.getSupportTicket(ticketId);
        const msgs   = ticket.messages || [];
        panel.innerHTML = `
          <div class="sup-chat-hd">
            <div class="dash-user-av">${(ticket.customerName||'C')[0]}</div>
            <div><div style="font-size:13px;font-weight:700">${ticket.subject||'Ticket'}</div><div style="font-size:11px;color:#94A3B8">${ticket.customerName||''}</div></div>
            ${statusBdg(ticket.status||'OPEN')}
            <div style="margin-left:auto;display:flex;gap:6px">
              <button class="btn-d btn-d-success btn-d-sm" id="btn-resolve-ticket" data-id="${ticketId}">Resolve</button>
            </div>
          </div>
          <div class="sup-messages" id="sup-msgs">
            ${msgs.length ? msgs.map(m=>`<div><div class="sup-bubble ${m.senderType==='AGENT'?'agent':'customer'}">${m.content||m.message||''}</div><div style="font-size:10px;color:#94A3B8;text-align:${m.senderType==='AGENT'?'right':'left'};margin-top:3px">${fmt.ago(m.createdAt)}</div></div>`).join('') :
            `<div style="text-align:center;color:#94A3B8;padding:24px">No messages yet</div>`}
          </div>
          <div class="sup-inp-row">
            <textarea id="sup-reply" placeholder="Type your reply…"></textarea>
            <button class="btn-d btn-d-primary" id="sup-send">Send</button>
          </div>`;
        document.getElementById('sup-send')?.addEventListener('click', async () => {
          const msg = document.getElementById('sup-reply').value.trim();
          if (!msg) return;
          await ApiService.replyToTicket(ticketId, { message:msg }).catch(()=>{});
          document.getElementById('sup-reply').value = '';
          const msgs2 = document.getElementById('sup-msgs');
          msgs2.innerHTML += `<div><div class="sup-bubble agent">${msg}</div><div style="font-size:10px;color:#94A3B8;text-align:right;margin-top:3px">just now</div></div>`;
          msgs2.scrollTop = msgs2.scrollHeight;
        });
        document.getElementById('btn-resolve-ticket')?.addEventListener('click', async () => {
          await ApiService.resolveTicket(ticketId).catch(()=>{});
          showToast('Ticket resolved'); loadTab('support');
        });
        document.getElementById('sup-msgs').scrollTop = 99999;
      } catch(_) { panel.innerHTML = `<div class="d-alert d-alert-err" style="margin:16px">Failed to load ticket</div>`; }
    });
  });
}

// ── POS ───────────────────────────────────────────────────
let posCart = [];
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

  document.getElementById('pos-clear')?.addEventListener('click', () => { posCart = []; renderCart(); });
  document.getElementById('pos-checkout')?.addEventListener('click', () => {
    if (!posCart.length) return;
    showToast(`Sale of ${fmt.money(posTotal())} processed!`, 'success');
    posCart = []; renderCart();
  });

  document.getElementById('pos-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.pos-prod').forEach(el => {
      el.style.display = el.querySelector('.pos-prod-name').textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}
function posTotal() { return posCart.reduce((a,b)=>a+b.price*b.qty,0); }
function renderCart() {
  const items = document.getElementById('pos-cart-items');
  const sub   = posTotal();
  const tax   = sub * 0.08;
  const total = sub + tax;
  if (!posCart.length) {
    items.innerHTML = `<div class="d-empty" style="padding:32px 16px"><div class="d-empty-ico" style="font-size:28px">🛒</div><div class="d-empty-ttl" style="font-size:13px">Cart is empty</div></div>`;
  } else {
    items.innerHTML = posCart.map(item => `
      <div class="pos-cart-item">
        <span class="pos-cart-name">${item.name}</span>
        <button class="pos-qty-btn" data-pos-minus="${item.id}">−</button>
        <span style="font-size:13px;font-weight:700;min-width:20px;text-align:center">${item.qty}</span>
        <button class="pos-qty-btn" data-pos-plus="${item.id}">+</button>
        <span class="pos-item-price">${fmt.money(item.price*item.qty)}</span>
      </div>`).join('');
  }
  document.getElementById('pos-sub').textContent   = fmt.money(sub);
  document.getElementById('pos-tax').textContent   = fmt.money(tax);
  document.getElementById('pos-total').textContent = fmt.money(total);
  const btn = document.getElementById('pos-checkout');
  if (btn) btn.textContent = `Charge ${fmt.money(total)}`;
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
