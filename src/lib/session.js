/**
 * Lightweight local session: identity, wishlist, follows and order history for
 * this device. Keeps the storefront usable on low bandwidth / intermittent data.
 */
const PREFIX = 'afritrade:';
const LEGACY_PREFIX = 'congo_commerce:';

/**
 * Read a value from localStorage with fallback, migrating from legacy keys
 * @param {string} key - Storage key
 * @param {*} fallback - Default value if key not found or parse fails
 * @returns {*} Parsed value or fallback
 */
function read(key, fallback) {
  try {
    // Try new prefix first
    let raw = localStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw);

    // Fallback to legacy prefix for migration
    raw = localStorage.getItem(LEGACY_PREFIX + key);
    if (raw) {
      const value = JSON.parse(raw);
      // Migrate to new prefix
      write(key, value);
      // Remove legacy key
      try { localStorage.removeItem(LEGACY_PREFIX + key); } catch { /* ignore migration cleanup error */ }
      return value;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a value to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store (will be JSON stringified)
 */
function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — non-blocking */
  }
}

/**
 * Generate a unique ID with optional prefix
 * @param {string} [prefix='id'] - Prefix for the ID
 * @returns {string} Unique ID string
 */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get or create the current session ID
 * @returns {string} Session ID
 */
export function getSessionId() {
  let id = read('session_id', null);
  if (!id) {
    id = uid('sess');
    write('session_id', id);
  }
  return id;
}

/**
 * Get the current user profile from localStorage
 * @returns {Object} User profile object
 */
export function getProfile() {
  return read('profile', { name: '', phone: '', email: '', city: 'Kinshasa', address: '' });
}

/**
 * Save user profile to localStorage
 * @param {Object} profile - Profile data to merge
 */
export function saveProfile(profile) {
  write('profile', { ...getProfile(), ...profile });
}

/**
 * Get the current currency preference
 * @returns {string} Currency code (default: 'USD')
 */
export function getCurrency() {
  return read('currency', 'USD');
}

/**
 * Set the currency preference
 * @param {string} currency - Currency code
 */
export function setCurrency(currency) {
  write('currency', currency);
}

/**
 * Get the current wishlist
 * @returns {Array} Array of product IDs
 */
export function getWishlist() {
  return read('wishlist', []);
}

/**
 * Toggle a product in the wishlist
 * @param {string} productId - Product ID to toggle
 * @returns {Array} Updated wishlist
 */
export function toggleWishlist(productId) {
  const list = getWishlist();
  const next = list.includes(productId) ? list.filter((id) => id !== productId) : [...list, productId];
  write('wishlist', next);
  return next;
}

/**
 * Check if a product is in the wishlist
 * @param {string} productId - Product ID to check
 * @returns {boolean} True if product is wishlisted
 */
export function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

/**
 * Get stored order IDs
 * @returns {Array} Array of order objects
 */
export function getOrderIds() {
  return read('order_ids', []);
}

/**
 * Remember an order in local history
 * @param {Object} order - Order object with id, order_number, total_usd, created_date
 */
export function rememberOrder(order) {
  const ids = getOrderIds();
  if (!ids.some((o) => o.id === order.id)) {
    write('order_ids', [{ id: order.id, order_number: order.order_number, total_usd: order.total_usd, created_date: order.created_date || new Date().toISOString() }, ...ids].slice(0, 50));
  }
}

/**
 * Get liked content IDs
 * @returns {Array} Array of content IDs
 */
export function getLikedContent() {
  return read('liked_content', []);
}

/**
 * Toggle a content item in liked content
 * @param {string} contentId - Content ID to toggle
 * @returns {Array} Updated liked content list
 */
export function toggleLikedContent(contentId) {
  const list = getLikedContent();
  const next = list.includes(contentId) ? list.filter((id) => id !== contentId) : [...list, contentId];
  write('liked_content', next);
  return next;
}

/**
 * Get followed seller/creator IDs
 * @returns {Array} Array of followed IDs
 */
export function getFollowedIds() {
  return read('follows', []);
}

/**
 * Toggle following a seller/creator
 * @param {string} targetId - Target ID to follow/unfollow
 * @returns {Array} Updated follows list
 */
export function toggleFollowId(targetId) {
  const list = getFollowedIds();
  const next = list.includes(targetId) ? list.filter((id) => id !== targetId) : [...list, targetId];
  write('follows', next);
  return next;
}

/**
 * Get the referral code
 * @returns {string} Referral code
 */
export function getReferralCode() {
  return read('referral_code', '');
}

/**
 * Set the referral code
 * @param {string} code - Referral code to store
 */
export function setReferralCode(code) {
  write('referral_code', code || '');
}

/**
 * Get privacy preferences
 * @returns {Object} Privacy preferences object
 */
export function getPrivacyPreferences() {
  return read('privacy', {
    personalized_tracking: true,
    anonymous_analytics: true,
    share_with_partners: true,
    marketing_emails: false,
  });
}

/**
 * Save privacy preferences
 * @param {Object} preferences - Privacy preferences to merge
 * @returns {Object} Updated preferences
 */
export function savePrivacyPreferences(preferences) {
  const next = { ...getPrivacyPreferences(), ...preferences };
  write('privacy', next);
  return next;
}

/**
 * Get seller application data
 * @returns {Object|null} Seller application or null
 */
export function getSellerApplication() {
  return read('seller_application', null);
}

/**
 * Save seller application data
 * @param {Object} application - Application data
 * @returns {Object} Saved application
 */
export function saveSellerApplication(application) {
  write('seller_application', application);
  return application;
}

/**
 * Clear all local session data except currency and referral code
 */
export function clearLocalSession() {
  ['wishlist', 'liked_content', 'follows', 'order_ids', 'profile', 'privacy'].forEach((k) => {
    try {
      localStorage.removeItem(PREFIX + k);
      localStorage.removeItem(LEGACY_PREFIX + k);
    } catch {
      /* ignore */
    }
  });
}