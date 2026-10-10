// Mock the format module
jest.mock('../src/lib/format', () => ({
  round2Cents: (value) => Math.round(value)
}));

// Import the searchUtils functions
import {
  editDistance,
  similarityScore,
  scoreProductRelevance,
  filterByCategory,
  filterBySource,
  filterByMaxPrice,
  filterByMinRating,
  filterByInStock,
  sortProducts,
  calculateFacets,
  getUniqueCategories
} from './lib/searchUtils.js';

// Test data
const testProduct = {
  id: 1,
  title: 'African Print Dress',
  brand: 'Konga Fashion',
  category_name: 'Women\'s Clothing',
  seller_name: 'Konga Store',
  tags: ['summer', 'cotton', 'vibrant'],
  sold_count: 50,
  rating: 4.5,
  price_usd: '25.00',
  stock: '10'
};

console.log('=== SEARCH FUNCTIONALITY TESTS ===\n');

// Test editDistance
console.log('editDistance tests:');
console.log('editDistance("kitten", "sitting"):', editDistance('kitten', 'sitting')); // Expected: 3
console.log('editDistance("hello", "hello"):', editDistance('hello', 'hello')); // Expected: 0
console.log('editDistance("abc", "def"):', editDistance('abc', 'def')); // Expected: 3
console.log();

// Test similarityScore
console.log('similarityScore tests:');
console.log('similarityScore("hello", "hello"):', similarityScore('hello', 'hello')); // Expected: 1
console.log('similarityScore("abc", "def"):', similarityScore('abc', 'def')); // Expected: 0
console.log('similarityScore("abcd", "abce"):', similarityScore('abcd', 'abce')); // Expected: 0.75
console.log('similarityScore("", ""):', similarityScore('', '')); // Expected: 1
console.log();

// Test scoreProductRelevance
console.log('scoreProductRelevance tests:');
console.log('Exact match - "african print dress":', scoreProductRelevance(testProduct, 'african print dress'));
console.log('Brand match - "Konga Fashion":', scoreProductRelevance(testProduct, 'Konga Fashion'));
console.log('Partial match - "african":', scoreProductRelevance(testProduct, 'african'));
console.log('Typo tolerance - "african print drss":', scoreProductRelevance(testProduct, 'african print drss'));
console.log('No match - "xyz":', scoreProductRelevance(testProduct, 'xyz'));
console.log('Empty term - "":', scoreProductRelevance(testProduct, ''));
console.log();

// Test filters
console.log('Filter tests:');
const products = [
  { id: 1, category_id: 'cat1', title: 'Product 1', source_type: 'local_seller', price_usd: '10.00', rating: '4.0', stock: '5' },
  { id: 2, category_id: 'cat2', title: 'Product 2', source_type: 'international_supplier', price_usd: '50.00', rating: '3.0', stock: '0' },
  { id: 3, category_id: 'cat1', title: 'Product 3', source_type: 'local_seller', price_usd: '150.00', rating: '5.0', stock: '3' }
];

console.log('filterByCategory(products, "cat1"):', filterByCategory(products, 'cat1').length);
console.log('filterBySource(products, "local"):', filterBySource(products, 'local').length);
console.log('filterBySource(products, "international"):', filterBySource(products, 'international').length);
console.log('filterByMaxPrice(products, "30"):', filterByMaxPrice(products, '30').length);
console.log('filterByMinRating(products, "3"):', filterByMinRating(products, '3').length);
console.log('filterByInStock(products, true):', filterByInStock(products, true).length);
console.log();

// Test sort
console.log('Sort tests:');
console.log('sortProducts(products, "price_asc")[0].title:', sortProducts(products, 'price_asc')[0].title);
console.log('sortProducts(products, "price_desc")[0].title:', sortProducts(products, 'price_desc')[0].title);
console.log('sortProducts(products, "rating")[0].rating:', sortProducts(products, 'rating')[0].rating);
console.log('sortProducts(products, "sold")[0].sold_count:', sortProducts(products, 'sold')[0].sold_count);
console.log();

// Test facets
console.log('Facets test:');
const facets = calculateFacets(products);
console.log('Categories:', facets.categories);
console.log('Sources:', facets.sources);
console.log('Price ranges:', facets.priceRanges);
console.log('Ratings:', facets.ratings);
console.log();

// Test unique categories
console.log('Unique categories test:');
const categoriesMap = [
  { id: 'cat1', name: 'Category 1' },
  { id: 'cat2', name: 'Category 2' },
  { id: 'cat3', name: 'Category 3' }
];
const uniqueCategories = getUniqueCategories(products, categoriesMap);
console.log('Unique categories count:', uniqueCategories.length);
console.log('Category IDs:', uniqueCategories.map(c => c.id));