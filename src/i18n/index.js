import { en } from './locales/en.js';
import { fr } from './locales/fr.js';
import { rw } from './locales/rw.js';

const STORAGE_KEY = 'luz_locale';
const catalogs = { en, fr, rw };
let translationObserver = null;
let translating = false;

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'EN', name: 'English', flag: 'gb' },
  { code: 'fr', label: 'FR', name: 'Francais', flag: 'fr' },
  { code: 'rw', label: 'Kinya', name: 'Kinyarwanda', flag: 'rw' },
];

function normalizeLocale(locale) {
  const code = (locale || '').toLowerCase().split('-')[0];
  return catalogs[code] ? code : 'en';
}

let currentLocale = normalizeLocale(localStorage.getItem(STORAGE_KEY) || navigator.language || 'en');

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  currentLocale = normalizeLocale(locale);
  localStorage.setItem(STORAGE_KEY, currentLocale);
  document.documentElement.lang = currentLocale === 'rw' ? 'rw' : currentLocale;
  window.dispatchEvent(new CustomEvent('luz-locale-change', { detail: currentLocale }));
  return currentLocale;
}

export function t(key, params = {}) {
  const value = catalogs[currentLocale]?.[key] ?? catalogs.en[key] ?? key;
  if (typeof value !== 'string') return value;
  return value.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}

export function translateText(text) {
  const raw = String(text ?? '');
  const trimmed = raw.trim();
  if (!trimmed) return raw;

  let translated = catalogs[currentLocale]?.[trimmed] ?? catalogs.en[trimmed];
  if (!translated) translated = translateDynamic(trimmed);
  if (!translated && /\d+\s+products?$/i.test(trimmed)) {
    translated = t('products.count', { count: trimmed.match(/\d+/)?.[0] || '0' });
  }
  if (!translated && /\d+\s+orders?$/i.test(trimmed)) {
    translated = t('orders.count', { count: trimmed.match(/\d+/)?.[0] || '0' });
  }
  if (!translated && /\d+\s+items?$/i.test(trimmed)) {
    translated = t('items.count', { count: trimmed.match(/\d+/)?.[0] || '0' });
  }
  if (!translated && /^Page\s+\d+\s+of\s+\d+$/i.test(trimmed)) {
    const [, page, total] = trimmed.match(/^Page\s+(\d+)\s+of\s+(\d+)$/i) || [];
    translated = t('pagination.pageOf', { page, total });
  }
  if (!translated) return raw;
  return raw.replace(trimmed, translated);
}

function translateDynamic(value) {
  const dynamicRules = [
    [/^Pay\s+(.+)$/i, 'dynamic.pay'],
    [/^Qty\s+(.+)$/i, 'dynamic.qty'],
    [/^Phone:\s*(.+)$/i, 'dynamic.phone'],
    [/^Note:\s*(.+)$/i, 'dynamic.note'],
    [/^Member since\s+(.+)$/i, 'dynamic.memberSince'],
    [/^Order\s+#?(.+)$/i, 'dynamic.order'],
    [/^Receipt\s+No$/i, 'Receipt No'],
    [/^Order\s+No$/i, 'Order No'],
    [/^Payment:\s*(.+)$/i, 'dynamic.payment'],
    [/^Customer:\s*(.+)$/i, 'dynamic.customer'],
    [/^Date:\s*(.+)$/i, 'dynamic.date'],
    [/^Failed to load:\s*(.+)$/i, 'dynamic.failedToLoad'],
    [/^Could not load tracking:\s*(.+)$/i, 'dynamic.couldNotLoadTracking'],
  ];
  for (const [regex, key] of dynamicRules) {
    const match = value.match(regex);
    if (match) {
      if (match.length === 1) return t(key);
      return t(key, { value: match[1] });
    }
  }

  const localized = catalogs[currentLocale] || {};
  const keys = Object.keys(localized)
    .filter(key => key.length > 3 && !key.includes('{') && value.includes(key))
    .sort((a, b) => b.length - a.length);
  if (!keys.length) return '';
  let next = value;
  keys.forEach(key => {
    next = next.split(key).join(localized[key]);
  });
  return next !== value ? next : '';
}

export function translateHtml(root = document) {
  if (currentLocale === 'en') return;
  if (translating) return;
  translating = true;
  const skip = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || skip.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    node.nodeValue = translateText(node.nodeValue);
  });

  root.querySelectorAll?.('[placeholder], [title], [aria-label], [value]').forEach(el => {
    ['placeholder', 'title', 'aria-label'].forEach(attr => {
      if (el.hasAttribute(attr)) el.setAttribute(attr, translateText(el.getAttribute(attr)));
    });
    if ((el.tagName === 'INPUT' || el.tagName === 'BUTTON') && el.hasAttribute('value')) {
      el.setAttribute('value', translateText(el.getAttribute('value')));
    }
  });
  translating = false;
}

setLocale(currentLocale);

export function observeTranslations(root = document.body) {
  if (translationObserver || !root) return;
  translationObserver = new MutationObserver((mutations) => {
    if (translating || currentLocale === 'en') return;
    const targets = new Set();
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) targets.add(node);
          if (node.nodeType === Node.TEXT_NODE && node.parentElement) targets.add(node.parentElement);
        });
      } else if (mutation.type === 'characterData' && mutation.target.parentElement) {
        targets.add(mutation.target.parentElement);
      } else if (mutation.type === 'attributes') {
        targets.add(mutation.target);
      }
    });
    if (!targets.size) return;
    requestAnimationFrame(() => targets.forEach(target => translateHtml(target)));
  });
  translationObserver.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'title', 'aria-label', 'value']
  });
}
