/**
 * SEARCH UTILITIES
 * Enhanced search functionality with improved relevance scoring and filtering
 *
 * Features:
 * - TF-IDF inspired relevance scoring
 * - Better typo tolerance with edit distance
 * - Field-weighted scoring (title, brand, category, etc.)
 * - Faceted filtering helpers
 * - Performance optimizations with memoization
 */

// Simple LRU cache implementation for memoization
const CACHE_MAX_SIZE = 500;
const editDistanceCache = new Map();
const similarityScoreCache = new Map();
const scoreProductRelevanceCache = new Map();

function getCached(cache, key) {
  if (cache.has(key)) {
    // Move to end (most recently used)
    const value = cache.get(key);
    cache.delete(key);
    cache.set(key, value);
    return value;
  }
  return undefined;
}

function setCached(cache, key, value) {
  if (cache.size >= CACHE_MAX_SIZE) {
    // Remove least recently used (first entry)
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}

/**
 * Calculate edit distance (Levenshtein distance) between two strings
 * Used for typo tolerance in search
 * Memoized for performance
 */
export function editDistance(a, b) {
  // Normalize: lowercase for cache key (since similarityScore lowercases anyway)
  const key = `${a.toLowerCase()}|${b.toLowerCase()}`;
  const cached = getCached(editDistanceCache, key);
  if (cached !== undefined) return cached;

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

  const result = matrix[b.length][a.length];
  setCached(editDistanceCache, key, result);
  return result;
}

/**
 * Calculate similarity score based on edit distance
 * Returns a score between 0 and 1, where 1 is identical
 * Memoized for performance
 */
export function similarityScore(a, b) {
  const key = `${a.toLowerCase()}|${b.toLowerCase()}`;
  const cached = getCached(similarityScoreCache, key);
  if (cached !== undefined) return cached;

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = editDistance(a.toLowerCase(), b.toLowerCase());
  const result = 1 - (distance / maxLen);
  setCached(similarityScoreCache, key, result);
  return result;
}

/**
 * Clear all search utility caches (useful for testing or memory management)
 */
export function clearSearchCaches() {
  editDistanceCache.clear();
  similarityScoreCache.clear();
  scoreProductRelevanceCache.clear();
}

/**
 * Enhanced product scoring function for search relevance
 * Uses field weighting and improved matching algorithms
 * Memoized for performance
 */
export function scoreProductRelevance(product, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') return 0;

  const term = searchTerm.trim().toLowerCase();
  // Cache key based on product fields that affect scoring and search term
  // Include ID if available, plus sold_count, rating, and field values
  const productKey = [
    product.id || product._id || '',
    product.sold_count || 0,
    product.rating || 0,
    product.title || '',
    product.brand || '',
    product.category_name || '',
    product.seller_name || '',
    Array.isArray(product.tags) ? product.tags.join(',') : (product.tags || '')
  ].join('|');
  const cacheKey = `${productKey}|${term}`;
  const cached = getCached(scoreProductRelevanceCache, cacheKey);
  if (cached !== undefined) return cached;

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

  // Boost score for popular/more sold products (only if there's a base relevance score)
  if (totalScore > 0) {
    const popularityBoost = Math.min((product.sold_count || 0) / 100, 0.2); // Max 20% boost

    // Boost score for highly rated products
    const ratingBoost = Math.min(((product.rating || 0) - 3) / 2 * 0.1, 0.1); // Max 10% boost for ratings above 3

    // Apply boosts
    totalScore = Math.min(totalScore + popularityBoost + ratingBoost, 1.0);
  }

  setCached(scoreProductRelevanceCache, cacheKey, totalScore);
  return totalScore;
}

/**
 * Filter products by category ID
 */
export function filterByCategory(products, categoryId) {
  if (!categoryId) return products;
  return products.filter(product => product.category_id === categoryId);
}

/**
 * Filter products by source (local/international/all)
 */
export function filterBySource(products, source) {
  if (source === 'all' || !source) return products;

  if (source === 'local') {
    return products.filter(product => product.source_type !== 'international_supplier');
  }

  if (source === 'international') {
    return products.filter(product => product.source_type === 'international_supplier');
  }

  return products;
}

/**
 * Filter products by maximum price
 */
export function filterByMaxPrice(products, maxPrice) {
  if (!maxPrice || maxPrice === '') return products;

  const maxPriceNum = parseFloat(maxPrice);
  if (isNaN(maxPriceNum)) return products;

  return products.filter(product =>
    parseFloat(product.price_usd) <= maxPriceNum
  );
}

/**
 * Filter products by minimum rating
 */
export function filterByMinRating(products, minRating) {
  if (!minRating || minRating === 0) return products;

  const minRatingNum = parseFloat(minRating);
  if (isNaN(minRatingNum)) return products;

  return products.filter(product =>
    parseFloat(product.rating || 0) >= minRatingNum
  );
}

/**
 * Filter products by stock availability
 */
export function filterByInStock(products, inStock) {
  if (!inStock) return products;
  return products.filter(product =>
    parseInt(product.stock || 0) > 0
  );
}

/**
 * Sort products based on sort criteria
 */
export function sortProducts(products, sortCriteria) {
  if (!sortCriteria || sortCriteria === 'relevance') {
    // For relevance sort, we'll rely on the scoring function
    return [...products];
  }

  const sorted = [...products];

  switch (sortCriteria) {
    case 'price_asc':
      sorted.sort((a, b) => parseFloat(a.price_usd) - parseFloat(b.price_usd));
      break;
    case 'price_desc':
      sorted.sort((a, b) => parseFloat(b.price_usd) - parseFloat(a.price_usd));
      break;
    case 'rating':
      sorted.sort((a, b) =>
        (parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
      );
      break;
    case 'sold':
      sorted.sort((a, b) =>
        (parseInt(b.sold_count || 0) - parseInt(a.sold_count || 0))
      );
      break;
    case 'new':
      sorted.sort((a, b) =>
        new Date(b.created_date) - new Date(a.created_date)
      );
      break;
    default:
      // Default to relevance (no change)
      break;
  }

  return sorted;
}

/**
 * Calculate faceted counts for search results
 */
export function calculateFacets(products) {
  const facets = {
    categories: {},
    sources: {},
    priceRanges: {
      '0-25': 0,
      '25-50': 0,
      '50-100': 0,
      '100-200': 0,
      '200+': 0
    },
    ratings: {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    }
  };

  products.forEach(product => {
    // Category facet
    const categoryId = product.category_id || 'unknown';
    facets.categories[categoryId] = (facets.categories[categoryId] || 0) + 1;

    // Source facet
    const source = product.source_type === 'international_supplier' ? 'international' : 'local';
    facets.sources[source] = (facets.sources[source] || 0) + 1;

    // Price range facet
    const price = parseFloat(product.price_usd) || 0;
    if (price < 25) facets.priceRanges['0-25']++;
    else if (price < 50) facets.priceRanges['25-50']++;
    else if (price < 100) facets.priceRanges['50-100']++;
    else if (price < 200) facets.priceRanges['100-200']++;
    else facets.priceRanges['200+']++;

    // Rating facet
    const rating = Math.floor(parseFloat(product.rating || 0));
    const ratingKey = Math.max(1, Math.min(5, rating)) || '1';
    facets.ratings[ratingKey.toString()] = (facets.ratings[ratingKey.toString()] || 0) + 1;
  });

  return facets;
}

/**
 * Get all unique categories for filter dropdown
 */
export function getUniqueCategories(products, categoriesMap) {
  const categoryIds = [...new Set(products.map(p => p.category_id))];
  return categoryIds
    .map(id => categoriesMap.find(cat => cat.id === id) || { id, name: 'Unknown' })
    .filter(cat => cat.id !== undefined);
}