import './LocationManager.css';
import { ApiService } from '../api.js';

// Self-contained management UI for the Rwanda shipping-location tree. Renders an
// HTML string and binds its own (delegated) events, so it can be dropped into any
// dashboard tab. Nodes are lazy-loaded per level via the management API (which,
// unlike the public API, also returns disabled nodes so they can be re-enabled).

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function rowHtml(node, depth) {
  const off = !node.enabled;
  return `
  <div class="locmgr-node ${off ? 'is-off' : ''}" data-node-id="${esc(node.id)}" style="--depth:${depth}">
    <div class="locmgr-row">
      <button class="locmgr-caret" type="button" data-loc-expand data-loc-id="${esc(node.id)}"
              ${node.hasChildren ? '' : 'style="visibility:hidden"'} aria-label="Expand">▸</button>
      <span class="locmgr-name">${esc(node.name)}</span>
      <span class="locmgr-badge">${esc(String(node.type || '').toLowerCase())}</span>
      <span class="locmgr-hidden-tag">hidden from checkout</span>
      <label class="locmgr-switch" title="Enable / disable">
        <input type="checkbox" data-loc-toggle data-loc-id="${esc(node.id)}" ${node.enabled ? 'checked' : ''}>
        <span class="locmgr-slider"></span>
      </label>
    </div>
    <div class="locmgr-children" data-children-of="${esc(node.id)}" hidden></div>
  </div>`;
}

export function render() {
  return `
  <div id="loc-manager" class="locmgr">
    <div class="locmgr-head">
      <h3 class="locmgr-title">Shipping Locations</h3>
      <p class="locmgr-sub">Enable or disable any province, district, sector, cell or village. Disabling a level
        hides it — and everything beneath it — from customers during checkout.</p>
    </div>
    <div class="locmgr-legend">
      <span><span class="locmgr-dot on"></span> Enabled</span>
      <span><span class="locmgr-dot off"></span> Disabled (hidden from checkout)</span>
      <span class="locmgr-hint">Click a name's ▸ arrow to drill down.</span>
    </div>
    <div id="loc-tree" class="locmgr-tree"><div class="locmgr-loading">Loading provinces…</div></div>
  </div>`;
}

export async function bindEvents(rootEl, helpers) {
  const root = rootEl?.querySelector?.('#loc-manager') || document.getElementById('loc-manager');
  if (!root) return;
  const tree = root.querySelector('#loc-tree');
  const toast = helpers?.toast || (() => {});

  // Initial load — top-level provinces (including disabled ones).
  try {
    const res = await ApiService.locations.manageProvinces();
    const provinces = res.data || [];
    tree.innerHTML = provinces.length
      ? provinces.map(p => rowHtml(p, 0)).join('')
      : '<div class="locmgr-empty">No locations found. Ensure the backend location seeder has run.</div>';
  } catch (e) {
    tree.innerHTML = `<div class="locmgr-empty">Failed to load locations: ${esc(e.message)}</div>`;
    return;
  }

  // Expand / collapse a node, lazy-loading its children on first open.
  tree.addEventListener('click', async e => {
    const caret = e.target.closest('[data-loc-expand]');
    if (!caret) return;
    const id = caret.dataset.locId;
    const container = tree.querySelector(`[data-children-of="${id}"]`);
    if (!container) return;

    const expanded = caret.classList.toggle('open');
    if (!expanded) { container.hidden = true; return; }
    container.hidden = false;

    if (container.dataset.loaded === '1') return;
    container.innerHTML = '<div class="locmgr-loading locmgr-loading-sm">Loading…</div>';
    try {
      const res = await ApiService.locations.manageChildren(id);
      const children = res.data || [];
      const depth = Number(caret.closest('.locmgr-node')?.style.getPropertyValue('--depth') || 0) + 1;
      container.innerHTML = children.length
        ? children.map(c => rowHtml(c, depth)).join('')
        : '<div class="locmgr-empty locmgr-empty-sm">No sub-locations.</div>';
      container.dataset.loaded = '1';
    } catch (err) {
      caret.classList.remove('open');
      container.innerHTML = `<div class="locmgr-empty locmgr-empty-sm">Failed: ${esc(err.message)}</div>`;
    }
  });

  // Enable / disable a node.
  tree.addEventListener('change', async e => {
    const input = e.target.closest('[data-loc-toggle]');
    if (!input) return;
    const id = input.dataset.locId;
    const desired = input.checked;
    input.disabled = true;
    try {
      await ApiService.locations.setEnabled(id, desired);
      tree.querySelector(`.locmgr-node[data-node-id="${id}"]`)?.classList.toggle('is-off', !desired);
      toast(desired ? 'Location enabled' : 'Location disabled — hidden from checkout', 'success');
    } catch (err) {
      input.checked = !desired; // revert on failure
      toast(err.message || 'Failed to update location', 'error');
    } finally {
      input.disabled = false;
    }
  });
}
