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
  console.log(`Term: "${term}", Haystack: "${haystack}"`);
  if (haystack.includes(term)) {
    console.log('  -> Direct hit!');
    return 3;
  }
  const words = haystack.split(/\s+/);
  if (words.some((w) => w.startsWith(term) || term.startsWith(w))) {
    console.log('  -> Prefix hit!');
    return 2;
  }
  const grams = new Set(term.split(''));
  const hit = [...grams].filter((ch) => haystack.includes(ch)).length;
  console.log(`  -> Grams: ${[...grams]}, Hit: ${hit}, Ratio: ${hit / grams.size}`);
  return grams.size && hit / grams.size >= 0.6 ? 1 : 0;
}

const product = {
  title: 'African Print Dress',
  brand: 'Konga Fashion',
  category_name: 'Women\'s Clothing',
  seller_name: 'Konga Store',
  tags: ['summer', 'cotton', 'vibrant']
};

console.log('Test 1: african print dress');
console.log(score(product, 'african print dress'));

console.log('\nTest 2: african');
console.log(score(product, 'african'));

console.log('\nTest 3: kot');
console.log(score(product, 'kot'));

console.log('\nTest 4: dresx');
console.log(score(product, 'dresx'));

console.log('\nTest 5: (empty)');
console.log(score(product, ''));