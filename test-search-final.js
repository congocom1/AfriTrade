// Copy the essential functions from searchUtils.js for testing
/**
 * Calculate edit distance (Levenshtein distance) between two strings
 * Used for typo tolerance in search
 */
export function editDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize the matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score based on edit distance
 * Returns a score between 0 and 1, where 1 is identical
 */
export function similarityScore(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = editDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - (distance / maxLen);
}

/**
 * Enhanced product scoring function for search relevance
 * Uses field weighting and improved matching algorithms
 */
export function scoreProductRelevance(product, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') return 0;

  const term = searchTerm.trim().toLowerCase();
  const words = term.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return 0;

  // Field weights - title and brand are most important
  const FIELD_WEIGHTS = {
    title: 0.4,
    brand: 0.25,
    category_name: 0.15,
    seller_name: 0.1,
    tags: 0.1
  };

  let totalScore = 0;

  // Score each field
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    let value = product[field] || '';
    // Handle array values (like tags) by joining them into a string
    if (Array.isArray(value)) {
      value = value.join(' ');
    }
    if (!value) continue;

    let fieldScore = 0;

    // Check for exact phrase match first (highest relevance)
    if (value.toLowerCase().includes(term)) {
      fieldScore = 1.0;
    } else {
      // Check for individual word matches
      const wordMatches = words.filter(word =>
        value.toLowerCase().includes(word)
      ).length;

      // Calculate word match ratio
      const wordMatchRatio = wordMatches / words.length;

      // Check for fuzzy matches (typo tolerance)
      const fuzzyMatches = words.filter(word => {
        const valueWords = value.toLowerCase().split(/\s+/);
        return valueWords.some(vWord =>
          similarityScore(word, vWord) > 0.8
        );
      }).length;

      const fuzzyMatchRatio = fuzzyMatches / words.length;

      // Combine exact, word, and fuzzy matches
      fieldScore = Math.max(
        wordMatchRatio * 0.7,      // Word matches
        fuzzyMatchRatio * 0.9      // Fuzzy matches (slightly higher weight for typo tolerance)
      );
    }

    totalScore += fieldScore * weight;
  }

  // Boost score for popular/more sold products
  const popularityBoost = Math.min((product.sold_count || 0) / 100, 0.2); // Max 20% boost

  // Boost score for highly rated products
  const ratingBoost = Math.min(((product.rating || 0) - 3) / 2 * 0.1, 0.1); // Max 10% boost for ratings above 3

  // Apply boosts
  totalScore = Math.min(totalScore + popularityBoost + ratingBoost, 1.0);

  return totalScore;
}

// Test data
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

// Test with different products to show field weighting
const dressProduct = {
  id: 2,
  title: 'Summer Cotton Dress',
  brand: 'Fashion Store',
  category_name: 'Women\'s Clothing',
  seller_name: 'Konga Store',
  tags: ['summer', 'dress'],
  sold_count: 30,
  rating: 4.0
};

console.log('Additional tests with dress product:');
console.log('Exact match - "summer cotton dress":', scoreProductRelevance(dressProduct, 'summer cotton dress'));
console.log('Brand match - "Fashion Store":', scoreProductRelevance(dressProduct, 'Fashion Store'));
console.log("Category match - 'Women\\'s Clothing':", scoreProductRelevance(dressProduct, "Women\\'s Clothing"));
console.log('Tags match - "summer dress":', scoreProductRelevance(dressProduct, 'summer dress'));
console.log('Popularity boost test - high sold count:', scoreProductRelevance({...dressProduct, sold_count: 200}, 'summer cotton dress'));
console.log('Rating boost test - high rating:', scoreProductRelevance({...dressProduct, rating: 5.0}, 'summer cotton dress'));