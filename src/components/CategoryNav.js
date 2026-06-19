import { ApiService } from '../api.js';
import { appState, setState } from '../store.js';

export async function render() {
  const res = await ApiService.products.getCategories();
  const categories = res.data;
  const activeCategoryId = appState.activeCategory;

  return `
    <ul class="category-nav-list">
      <li class="category-nav-item ${activeCategoryId === null ? 'active' : ''}" data-cat-id="all">All Catalog</li>
      ${categories.map(c => `
        <li class="category-nav-item ${activeCategoryId === c.id ? 'active' : ''}" data-cat-id="${c.id}">
          ${c.name}
        </li>
      `).join('')}
      <li class="category-nav-item hot-deals" data-cat-id="hot">Hot Deals 🔥</li>
    </ul>
  `;
}

export function bindEvents(helpers) {
  const { navigate } = helpers;

  document.querySelectorAll('.category-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const catId = item.getAttribute('data-cat-id');
      if (catId === 'all') {
        setState({ activeCategory: null, currentView: 'home' });
      } else if (catId === 'hot') {
        setState({ activeCategory: null, searchQuery: 'ASUS', currentView: 'home' });
      } else {
        setState({ activeCategory: catId, currentView: 'home' });
      }
      navigate('home');
    });
  });
}
