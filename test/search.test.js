import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreProductRelevance } from '../lib/searchUtils';

describe('Search functionality', () => {
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

  it('should return score > 0.6 for exact title match', () => {
    const score = scoreProductRelevance(testProduct, 'african print dress');
    // With field weights: title(0.4) + popularity boost(0.2) + rating boost(0.075) = 0.675
    assert.ok(score > 0.6);
  });

  it('should return score > 0.5 for brand match', () => {
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