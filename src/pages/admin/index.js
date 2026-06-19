import './style.css';
import { ApiService } from '../../api.js';
import { appState, setState } from '../../store.js';

export async function render(state) {
  const kpisRes = await ApiService.analytics.getKPIs();
  const kpis = kpisRes.data;
  const activeTab = state.activeAdminTab || 'analytics';

  let panelHtml = '';

  if (activeTab === 'analytics') {
    const salesRes = await ApiService.analytics.getSalesSummary();
    const sales = salesRes.data || [];
    panelHtml = `
      <h3>Key Performance Indicators</h3>
      <div class="kpi-grid">
        <div class="kpi-card"><span class="kpi-label">Sales Revenue</span><span class="kpi-value">£${kpis.totalSales}</span></div>
        <div class="kpi-card"><span class="kpi-label">Active Orders</span><span class="kpi-value">${kpis.ordersCount}</span></div>
        <div class="kpi-card"><span class="kpi-label">Low Stock Items</span><span class="kpi-value">${kpis.lowStockAlerts}</span></div>
        <div class="kpi-card"><span class="kpi-label">Open Tickets</span><span class="kpi-value">${kpis.openTickets}</span></div>
      </div>
      <h3 style="margin-top:32px;margin-bottom:16px;">Sales Analytics Trend</h3>
      <div class="chart-container">
        <div class="chart-bars">
          ${sales.map(s => {
            const h = (s.sales / 30000) * 100;
            return `
              <div class="chart-bar-wrapper">
                <div class="chart-bar" style="height:${h}%;"></div>
                <span class="chart-bar-label">${s.month} (£${s.sales})</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

  } else if (activeTab === 'products') {
    const prodRes = await ApiService.products.getAll();
    const prods = prodRes.data || [];
    const catsRes = await ApiService.products.getCategories();
    const cats = catsRes.data || [];

    panelHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3>Products Lifecycle Catalog</h3>
        <button class="btn-primary" id="btn-admin-add-product" style="font-size:13px;padding:8px 16px;">+ Add New Product</button>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Image</th><th>Name</th><th>SKU</th><th>Price</th><th>Category</th><th>Actions</th></tr></thead>
          <tbody>
            ${prods.map(p => `
              <tr>
                <td><img src="${p.image}" style="width:40px;height:40px;object-fit:contain;"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.sku}</td>
                <td>£${p.price.toFixed(2)}</td>
                <td>${p.category}</td>
                <td>
                  <button class="btn-secondary" style="padding:4px 8px;font-size:12px;border-color:var(--danger);color:var(--danger);" data-action="admin-delete-product" data-id="${p.id}">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" id="add-product-modal" style="display:none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Create Product</h3>
            <button class="modal-close" id="close-add-product">&times;</button>
          </div>
          <div class="modal-body">
            <form class="checkout-form" id="add-product-form">
              <div class="auth-form-group"><label>Name</label><input type="text" id="ap-name" required></div>
              <div class="auth-form-group"><label>Description</label><textarea id="ap-desc" rows="3" required></textarea></div>
              <div class="auth-form-group"><label>Price (£)</label><input type="number" step="0.01" id="ap-price" required></div>
              <div class="auth-form-group"><label>SKU</label><input type="text" id="ap-sku" placeholder="CP-XXX-YYY" required></div>
              <div class="auth-form-group">
                <label>Category</label>
                <select id="ap-category">
                  ${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
              </div>
              <button class="btn-primary" type="submit">Create Product</button>
            </form>
          </div>
        </div>
      </div>
    `;

  } else if (activeTab === 'inventory') {
    const itemsRes = await ApiService.inventory.getItems();
    const items = itemsRes.data || [];
    panelHtml = `
      <h3>Inventory & Stock Movements</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Product Name</th><th>SKU</th><th>Stock Level</th><th>Supplier</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.map(i => `
              <tr>
                <td><strong>${i.productName}</strong></td>
                <td>${i.sku}</td>
                <td><span style="font-weight:700;color:${i.quantity <= 10 ? 'var(--danger)' : 'var(--success)'};">${i.quantity} units</span></td>
                <td>${i.supplier}</td>
                <td><button class="btn-secondary" style="padding:4px 8px;font-size:12px;" data-action="adjust-stock-btn" data-id="${i.id}" data-current="${i.quantity}">Adjust Stock</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } else if (activeTab === 'orders') {
    const ordersRes = await ApiService.ordersAdmin.listAll();
    const orders = ordersRes.data || [];
    panelHtml = `
      <h3>Order Pipeline Status Flow</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date Placed</th></tr></thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td>#${o.id}</td>
                <td>${o.customerName}</td>
                <td>£${o.totalAmount.toFixed(2)}</td>
                <td>
                  <select class="filter-select" data-action="admin-order-status" data-id="${o.id}" style="padding:4px 8px;font-size:12px;font-weight:600;">
                    ${['CREATED','PAID','PICKED','PACKED','DISPATCHED','DELIVERED','CANCELLED'].map(s =>
                      `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`
                    ).join('')}
                  </select>
                </td>
                <td>${new Date(o.timestamp).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } else if (activeTab === 'users') {
    const usersRes = await ApiService.admin.getUsers();
    const users = usersRes.data || [];
    panelHtml = `
      <h3>User Role Management</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Roles</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.firstName} ${u.lastName}</strong></td>
                <td>${u.email}</td>
                <td>${u.phoneNumber || 'N/A'}</td>
                <td>${u.roles.map(r => `<span style="font-size:11px;background:#F1F5F9;padding:2px 6px;border-radius:4px;font-weight:600;margin-right:4px;">${r}</span>`).join('')}</td>
                <td>
                  ${!u.roles.includes('ROLE_EMPLOYEE') ? `
                    <button class="btn-secondary" style="padding:4px 8px;font-size:12px;" data-action="admin-promote" data-id="${u.id}">Make Staff</button>
                  ` : 'Staff User'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } else if (activeTab === 'returns') {
    const returnsRes = await ApiService.returns.getAll();
    const returns = returnsRes.data || [];
    const statusColor = { PENDING: 'warning', APPROVED: 'paid', REJECTED: 'cancelled', COMPLETED: 'delivered' };
    panelHtml = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h3>Returns & Refunds Management</h3>
        <span style="font-size:13px;color:var(--text-light);">${returns.length} total request(s)</span>
      </div>
      ${returns.length === 0 ? `<p style="color:var(--text-light);padding:24px;text-align:center;">No return requests yet.</p>` : `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Return ID</th><th>Order ID</th><th>Reason</th><th>Status</th><th>Amount</th><th>Actions</th></tr></thead>
          <tbody>
            ${returns.map(r => `
              <tr>
                <td style="font-size:11px;font-family:monospace;">${(r.id || '').substring(0,8)}...</td>
                <td style="font-size:11px;font-family:monospace;">${((r.orderId || r.order?.id || '')).toString().substring(0,8)}...</td>
                <td style="max-width:180px;font-size:13px;">${r.reason || '-'}</td>
                <td><span class="status-badge ${statusColor[r.status] || 'created'}">${r.status}</span></td>
                <td>${r.requestedAmount ? '£' + r.requestedAmount : '-'}</td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    ${r.status === 'PENDING' ? `
                      <button class="btn-secondary" style="padding:4px 10px;font-size:12px;color:var(--success);border-color:var(--success);" data-action="admin-return-approve" data-id="${r.id}">Approve</button>
                      <button class="btn-secondary" style="padding:4px 10px;font-size:12px;color:var(--danger);border-color:var(--danger);" data-action="admin-return-reject" data-id="${r.id}">Reject</button>
                    ` : ''}
                    ${r.status === 'APPROVED' && !r.refundStatus ? `
                      <button class="btn-secondary" style="padding:4px 10px;font-size:12px;color:var(--primary);border-color:var(--primary);" data-action="admin-return-refund" data-id="${r.id}">Process Refund</button>
                    ` : ''}
                    ${r.status === 'APPROVED' && r.refundStatus && r.refundStatus !== 'COMPLETED' ? `
                      <button class="btn-secondary" style="padding:4px 10px;font-size:12px;" data-action="admin-return-complete" data-id="${r.id}">Complete</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`}
    `;

  } else if (activeTab === 'system') {
    const auditsRes = await ApiService.admin.getAuditLogs();
    const audits = auditsRes.data || [];
    const backupsRes = await ApiService.admin.getBackups();
    const backups = backupsRes.data || [];
    panelHtml = `
      <h3>Backup & Database Maintenance</h3>
      <div style="margin-bottom:24px;padding:16px;background:var(--bg-main);border:1px solid var(--border);border-radius:8px;">
        <p style="margin-bottom:12px;font-size:14px;">Keep your system state safe. Trigger manual system backups or restore previously saved databases.</p>
        <button class="btn-primary" id="btn-admin-backup" style="font-size:13px;padding:8px 16px;">Trigger System Backup</button>
      </div>
      <h4 style="margin-bottom:12px;">Saved System Backups</h4>
      <div class="data-table-wrapper" style="margin-bottom:32px;">
        <table class="data-table">
          <thead><tr><th>Backup File</th><th>Size</th><th>Created By</th><th>Action</th></tr></thead>
          <tbody>
            ${backups.map(b => `
              <tr>
                <td>💾 <strong>${b.filename}</strong></td>
                <td>${b.size}</td>
                <td>${b.createdBy}</td>
                <td><button class="btn-secondary" style="padding:4px 8px;font-size:12px;border-color:var(--success);color:var(--success);" data-id="${b.id}">Restore</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <h3>Security Audits</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>IP Address</th></tr></thead>
          <tbody>
            ${audits.map(a => `
              <tr>
                <td>${new Date(a.timestamp).toLocaleString()}</td>
                <td>${a.user}</td>
                <td><strong style="color:var(--primary);">${a.action}</strong></td>
                <td><code>${a.ip}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <div class="admin-layout">
      <div class="admin-sidebar">
        <button class="admin-sidebar-item ${activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics">📊 KPIs & Analytics</button>
        <button class="admin-sidebar-item ${activeTab === 'products' ? 'active' : ''}" data-tab="products">🛍️ Products Catalog</button>
        <button class="admin-sidebar-item ${activeTab === 'inventory' ? 'active' : ''}" data-tab="inventory">📦 Inventory & Stock</button>
        <button class="admin-sidebar-item ${activeTab === 'orders' ? 'active' : ''}" data-tab="orders">🛒 Order Pipelines</button>
        <button class="admin-sidebar-item ${activeTab === 'returns' ? 'active' : ''}" data-tab="returns">↩ Returns & Refunds</button>
        <button class="admin-sidebar-item ${activeTab === 'users' ? 'active' : ''}" data-tab="users">👤 User & Roles</button>
        <button class="admin-sidebar-item ${activeTab === 'system' ? 'active' : ''}" data-tab="system">⚙️ Backup & Audits</button>
      </div>
      <div class="admin-panel-content">${panelHtml}</div>
    </div>
  `;
}

export function bindEvents(state, helpers) {
  const { refresh, toast } = helpers;
  const container = document.getElementById('app-view-container');

  // Sidebar tab switching
  container?.querySelectorAll('.admin-sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      setState({ activeAdminTab: item.getAttribute('data-tab') });
      refresh();
    });
  });

  // Add product modal
  const addProdModal = document.getElementById('add-product-modal');
  document.getElementById('btn-admin-add-product')?.addEventListener('click', () => {
    if (addProdModal) addProdModal.style.display = 'flex';
  });
  document.getElementById('close-add-product')?.addEventListener('click', () => {
    if (addProdModal) addProdModal.style.display = 'none';
  });

  document.getElementById('add-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('ap-name').value;
    const desc = document.getElementById('ap-desc').value;
    const price = parseFloat(document.getElementById('ap-price').value);
    const sku = document.getElementById('ap-sku').value;
    const catId = document.getElementById('ap-category').value;
    try {
      await ApiService.productsAdmin.create(name, desc, price, sku, 'ACTIVE', catId);
      toast('Product created successfully!');
      if (addProdModal) addProdModal.style.display = 'none';
      refresh();
    } catch (err) {
      toast('Failed to create product: ' + err.message, 'error');
    }
  });

  container?.querySelectorAll('[data-action="admin-delete-product"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pid = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this product?')) {
        await ApiService.productsAdmin.delete(pid);
        toast('Product deleted');
        refresh();
      }
    });
  });

  container?.querySelectorAll('[data-action="adjust-stock-btn"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const cur = btn.getAttribute('data-current');
      const val = prompt(`Current stock is ${cur}. Enter quantity to add/subtract (e.g. +10, -5):`);
      if (val) {
        const qty = parseInt(val);
        if (!isNaN(qty)) {
          await ApiService.inventory.adjustStock(id, qty, 'Admin manual adjustment');
          toast('Stock level adjusted!');
          refresh();
        }
      }
    });
  });

  container?.querySelectorAll('[data-action="admin-order-status"]').forEach(select => {
    select.addEventListener('change', async () => {
      const oid = select.getAttribute('data-id');
      await ApiService.ordersAdmin.updateStatus(oid, select.value);
      toast(`Order status updated to ${select.value}`);
    });
  });

  container?.querySelectorAll('[data-action="admin-promote"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const uid = btn.getAttribute('data-id');
      await ApiService.admin.assignRole(uid, 'ROLE_EMPLOYEE');
      toast('User promoted to Staff!');
      refresh();
    });
  });

  document.getElementById('btn-admin-backup')?.addEventListener('click', async () => {
    const res = await ApiService.admin.triggerBackup();
    toast(res.message);
    refresh();
  });

  container?.querySelectorAll('[data-action="admin-return-approve"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const notes = prompt('Admin notes (optional):') || '';
      await ApiService.returns.approve(id, notes);
      toast('Return approved');
      refresh();
    });
  });

  container?.querySelectorAll('[data-action="admin-return-reject"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const notes = prompt('Reason for rejection:') || 'Does not meet return criteria';
      await ApiService.returns.reject(id, notes);
      toast('Return rejected');
      refresh();
    });
  });

  container?.querySelectorAll('[data-action="admin-return-refund"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const amount = prompt('Refund amount (£):') || '';
      if (!amount) return;
      const notes = prompt('Admin notes (optional):') || '';
      await ApiService.returns.refund(id, parseFloat(amount), notes);
      toast('Refund submitted to payment provider');
      refresh();
    });
  });

  container?.querySelectorAll('[data-action="admin-return-complete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const ref = prompt('Refund reference number:') || '';
      await ApiService.returns.complete(id, { refundReference: ref });
      toast('Return marked as completed');
      refresh();
    });
  });
}
