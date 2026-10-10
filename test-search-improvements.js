import { scoreProductRelevance } from './lib/searchUtils.js';

// Copy of the normalize and score functions from Search.jsx for testing
function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Lightweight typo tolerance: direct hit, prefix hit, or ≥60% character overlap. */
function score(product, term) {
  if (!term || !term.trim()) return 0;
  const haystack = normalize(
    [product.title, product.brand, product.category_name, product.seller_name, (product.tags || []).join(' ')].join(' '),
  );
  if (haystack.includes(term)) return 3;
  const words = haystack.split(/\s+/);
  if (words.some((w) => w.startsWith(term) || term.startsWith(w))) return 2;
  const grams = new Set(term.split(''));
  const hit = [...grams].filter((ch) => haystack.includes(ch)).length;
  return grams.size && hit / grams.size >= 0.6 ? 1 : 0;
}

const product = {
  title: 'African Print Dress',
  brand: 'Konga Fashion',
  category_name: 'Women\'s Clothing',
  seller_name: 'Konga Store',
  tags: ['summer', 'cotton', 'vibrant'],
  sold_count: 50,
  rating: 4.5
};

console.log('=== COMPARISON: OLD SCORE vs NEW SCORE PRODUCT RELEVANCE ===\n');

console.log('Test 1: african print dress (exact match)');
console.log('Old score:', score(product, 'african print dress'));
console.log('New score:', scoreProductRelevance(product, 'african print dress'));
console.log();

console.log('Test 2: african (prefix match)');
console.log('Old score:', score(product, 'african'));
console.log('New score:', scoreProductRelevance(product, 'african'));
console.log();

console.log('Test 3: kot (prefix of konga)');
console.log('Old score:', score(product, 'kot'));
console.log('New score:', scoreProductRelevance(product, 'kot'));
console.log();

console.log('Test 4: dresx (typo - close to dress)');
console.log('Old score:', score(product, 'dresx'));
console.log('New score:', scoreProductRelevance(product, 'dresx'));
console.log();

console.log('Test 5: (empty)');
console.log('Old score:', score(product, ''));
console.log('New score:', scoreProductRelevance(product, ''));
console.log();

console.log('Test 6: xyz (no match)');
console.log('Old score:', score(product, 'xyz'));
console.log('New score:', scoreProductRelevance(product, 'xyz'));
console.log();

console.log('Test 7: african print drss (typo in dress)');
console.log('Old score:', score(product, 'african print drss'));
console.log('New score:', scoreProductRelevance(product, 'african print drss'));
console.log();

console.log('Test 8: konga fashion (brand match)');
console.log('Old score:', score(product, 'konga fashion'));
console.log('New score:', scoreProductRelevance(product, 'konga fashion'));
console.log();