import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
} from '../lib/searchUtils';

describe('Search Utils', () => {
  describe('editDistance function', () => {
    it('should calculate correct edit distance', () => {
      assert.strictEqual(editDistance('kitten', 'sitting'), 3);
      assert.strictEqual(editDistance('hello', 'hello'), 0);
      assert.strictEqual(editDistance('abc', 'def'), 3);
      assert.strictEqual(editDistance('', 'abc'), 3);
      assert.strictEqual(editDistance('abc', ''), 3);
    });
  });

  describe('similarityScore function', () => {
    it('should return 1 for identical strings', () => {
      assert.strictEqual(similarityScore('hello', 'hello'), 1);
    });

    it('should return 0 for completely different strings', () => {
      assert.strictEqual(similarityScore('abc', 'def'), 0);
    });

    it('should handle empty strings', () => {
      assert.strictEqual(similarityScore('', ''), 1);
      assert.strictEqual(similarityScore('abc', ''), 0);
      assert.strictEqual(similarityScore('', 'abc'), 0);
    });

    it('should calculate partial similarity', () => {
      const score = similarityScore('abc', 'ab');
      console.log('score for abc, ab:', score);
      assert.strictEqual(similarityScore('abcd', 'abce'), 0.75); // 3/4 match
      // Using closeTo for floating point comparison
      assert.ok(Math.abs(score - 0.6666666666666666) < 0.000001);
    });
  });

  describe('scoreProductRelevance function', () => {
    const testProduct = {
      id: 1,
      title: 'African Print Dress',
      brand: 'Konga Fashion',
      category_name: 'Women\'s Clothing',
      seller_name: 'Konga Store',
      tags: ['summer', 'cotton', 'vibrant'],
      sold_count: 50,
      rating: 4.5
    };

    it('should score exact title match highly', () => {
      const score = scoreProductRelevance(testProduct, 'african print dress');
      // With field weights: title(0.4) + popularity boost(0.2) + rating boost(0.075) = 0.675
      assert.ok(score > 0.6);
    });

    it('should score brand match well', () => {
      const score = scoreProductRelevance(testProduct, 'Konga Fashion');
      // Brand field weight is 0.25, plus some boost from popularity/rating
      assert.ok(score > 0.5);
    });

    it('should handle typo tolerance', () => {
      const score1 = scoreProductRelevance(testProduct, 'african print drss'); // typo in dress
      const score2 = scoreProductRelevance(testProduct, 'african print dress'); // correct
      // Typo version should still score reasonably high
      assert.ok(score1 > 0.5);
      // Correct version should score higher
      assert.ok(score2 > score1);
    });

    it('should boost popular products', () => {
      const normalProduct = { ...testProduct, sold_count: 10 };
      const popularProduct = { ...testProduct, sold_count: 1000 };

      const normalScore = scoreProductRelevance(normalProduct, 'african print dress');
      const popularScore = scoreProductRelevance(popularProduct, 'african print dress');

      assert.ok(popularScore > normalScore);
    });

    it('should boost highly rated products', () => {
      const lowRating = { ...testProduct, rating: 2.0 };
      const highRating = { ...testProduct, rating: 5.0 };

      const lowScore = scoreProductRelevance(lowRating, 'african print dress');
      const highScore = scoreProductRelevance(highRating, 'african print dress');

      assert.ok(highScore > lowScore);
    });

    it('should return 0 for empty search term', () => {
      const score = scoreProductRelevance(testProduct, '');
      assert.strictEqual(score, 0);
    });

    it('should return 0 for no match', () => {
      const score = scoreProductRelevance(testProduct, 'xyz nonexistent product');
      assert.strictEqual(score, 0);
    });
  });

  describe('filterByCategory function', () => {
    const products = [
      { id: 1, category_id: 'cat1', title: 'Product 1' },
      { id: 2, category_id: 'cat2', title: 'Product 2' },
      { id: 3, category_id: 'cat1', title: 'Product 3' }
    ];

    it('should filter by category ID', () => {
      const filtered = filterByCategory(products, 'cat1');
      assert.strictEqual(filtered.length, 2);
      assert.ok(filtered.every(p => p.category_id === 'cat1'));
    });

    it('should return all products when no category specified', () => {
      const filtered = filterByCategory(products, '');
      assert.strictEqual(filtered.length, 3);
    });
  });

  describe('filterBySource function', () => {
    const products = [
      { id: 1, source_type: 'local_seller', title: 'Local Product' },
      { id: 2, source_type: 'international_supplier', title: 'International Product' },
      { id: 3, source_type: 'local_seller', title: 'Another Local Product' }
    ];

    it('should filter local products', () => {
      const filtered = filterBySource(products, 'local');
      assert.strictEqual(filtered.length, 2);
      assert.ok(filtered.every(p => p.source_type !== 'international_supplier'));
    });

    it('should filter international products', () => {
      const filtered = filterBySource(products, 'international');
      assert.strictEqual(filtered.length, 1);
      assert.ok(filtered.every(p => p.source_type === 'international_supplier'));
    });

    it('should return all products when source is all', () => {
      const filtered = filterBySource(products, 'all');
      assert.strictEqual(filtered.length, 3);
    });
  });

  describe('filterByMaxPrice function', () => {
    const products = [
      { id: 1, price_usd: '10.00', title: 'Cheap Product' },
      { id: 2, price_usd: '50.00', title: 'Medium Product' },
      { id: 3, price_usd: '100.00', title: 'Expensive Product' }
    ];

    it('should filter by maximum price', () => {
      const filtered = filterByMaxPrice(products, '30');
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].title, 'Cheap Product');
    });

    it('should handle empty max price', () => {
      const filtered = filterByMaxPrice(products, '');
      assert.strictEqual(filtered.length, 3);
    });
  });

  describe('filterByMinRating function', () => {
    const products = [
      { id: 1, rating: '2.0', title: 'Low Rating' },
      { id: 2, rating: '4.0', title: 'Medium Rating' },
      { id: 3, rating: '5.0', title: 'High Rating' }
    ];

    it('should filter by minimum rating', () => {
      const filtered = filterByMinRating(products, '3');
      assert.strictEqual(filtered.length, 2);
      assert.ok(filtered.every(p => parseFloat(p.rating) >= 3));
    });

    it('should handle zero min rating', () => {
      const filtered = filterByMinRating(products, '0');
      assert.strictEqual(filtered.length, 3);
    });
  });

  describe('filterByInStock function', () => {
    const products = [
      { id: 1, stock: '0', title: 'Out of Stock' },
      { id: 2, stock: '5', title: 'In Stock' },
      { id: 3, stock: '0', title: 'Also Out of Stock' }
    ];

    it('should filter in-stock products', () => {
      const filtered = filterByInStock(products, true);
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].title, 'In Stock');
    });

    it('should return all products when inStock is false', () => {
      const filtered = filterByInStock(products, false);
      assert.strictEqual(filtered.length, 3);
    });
  });

  describe('sortProducts function', () => {
    const products = [
      { id: 1, price_usd: '100.00', rating: '3.0', sold_count: '10', created_date: '2023-01-01' },
      { id: 2, price_usd: '50.00', rating: '4.0', sold_count: '20', created_date: '2023-06-01' },
      { id: 3, price_usd: '75.00', rating: '5.0', sold_count: '5', created_date: '2023-03-01' }
    ];

    it('should sort by price ascending', () => {
      const sorted = sortProducts(products, 'price_asc');
      assert.strictEqual(sorted[0].price_usd, '50.00');
      assert.strictEqual(sorted[1].price_usd, '75.00');
      assert.strictEqual(sorted[2].price_usd, '100.00');
    });

    it('should sort by price descending', () => {
      const sorted = sortProducts(products, 'price_desc');
      assert.strictEqual(sorted[0].price_usd, '100.00');
      assert.strictEqual(sorted[1].price_usd, '75.00');
      assert.strictEqual(sorted[2].price_usd, '50.00');
    });

    it('should sort by rating', () => {
      const sorted = sortProducts(products, 'rating');
      assert.strictEqual(sorted[0].rating, '5.0');
      assert.strictEqual(sorted[1].rating, '4.0');
      assert.strictEqual(sorted[2].rating, '3.0');
    });

    it('should sort by sold count', () => {
      const sorted = sortProducts(products, 'sold');
      assert.strictEqual(sorted[0].sold_count, '20');
      assert.strictEqual(sorted[1].sold_count, '10');
      assert.strictEqual(sorted[2].sold_count, '5');
    });

    it('should sort by newest first', () => {
      const sorted = sortProducts(products, 'new');
      assert.strictEqual(sorted[0].created_date, '2023-06-01');
      assert.strictEqual(sorted[1].created_date, '2023-03-01');
      assert.strictEqual(sorted[2].created_date, '2023-01-01');
    });
  });

  describe('calculateFacets function', () => {
    const products = [
      {
        id: 1,
        category_id: 'cat1',
        source_type: 'local_seller',
        price_usd: '20.00',
        rating: '4.0',
        stock: '5'
      },
      {
        id: 2,
        category_id: 'cat2',
        source_type: 'international_supplier',
        price_usd: '60.00',
        rating: '3.0',
        stock: '0'
      },
      {
        id: 3,
        category_id: 'cat1',
        source_type: 'local_seller',
        price_usd: '150.00',
        rating: '5.0',
        stock: '3'
      }
    ];

    it('should calculate facets correctly', () => {
      const facets = calculateFacets(products);

      // Check category facets
      assert.strictEqual(facets.categories.cat1, 2);
      assert.strictEqual(facets.categories.cat2, 1);

      // Check source facets
      assert.strictEqual(facets.sources.local, 2);
      assert.strictEqual(facets.sources.international, 1);

      // Check price range facets
      assert.strictEqual(facets.priceRanges['0-25'], 1); // $20
      assert.strictEqual(facets.priceRanges['50-100'], 1); // $60
      assert.strictEqual(facets.priceRanges['100-200'], 1); // $150

      // Check rating facets
      assert.strictEqual(facets.ratings['3'], 1); // 3.0
      assert.strictEqual(facets.ratings['4'], 1); // 4.0
      assert.strictEqual(facets.ratings['5'], 1); // 5.0
    });
  });

  describe('getUniqueCategories function', () => {
    const products = [
      { id: 1, category_id: 'cat1', title: 'Product 1' },
      { id: 2, category_id: 'cat2', title: 'Product 2' },
      { id: 3, category_id: 'cat1', title: 'Product 3' }, // duplicate
      { id: 4, category_id: 'cat3', title: 'Product 4' }
    ];

    const categoriesMap = [
      { id: 'cat1', name: 'Category 1' },
      { id: 'cat2', name: 'Category 2' },
      { id: 'cat3', name: 'Category 3' }
    ];

    it('should return unique categories', () => {
      const unique = getUniqueCategories(products, categoriesMap);
      assert.strictEqual(unique.length, 3);

      const categoryIds = unique.map(c => c.id).sort();
      assert.deepEqual(categoryIds, ['cat1', 'cat2', 'cat3']);
    });
  });
});