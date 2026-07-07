// Rwanda administrative locations (province → district → sector → cell → village)
// are now served dynamically by the backend (GET /api/locations). Admins and
// employees enable or disable nodes from the "Locations" management tab; disabled
// nodes are filtered out server-side and never appear in these results.
//
// This module is a thin async wrapper over that API. Each function resolves to an
// array of { id, name, type, enabled, hasChildren } objects. Drive the cascading
// dropdowns by id: fetch provinces first, then getChildren(selectedId) per level.
import { ApiService } from './api.js';

export async function getProvinces() {
  const res = await ApiService.locations.provinces();
  return res.data || [];
}

export async function getChildren(parentId) {
  if (!parentId) return [];
  const res = await ApiService.locations.children(parentId);
  return res.data || [];
}
