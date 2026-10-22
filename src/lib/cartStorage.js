/**
 * Storage key for the cart in localStorage
 */
export const CART_STORAGE_KEY = 'congo_commerce:cart';

/**
 * Maximum allowed quantity per cart item
 */
export const MAX_CART_QUANTITY = 999;

/**
 * Normalize a cart quantity value to a safe integer within allowed bounds
 * @param {number|string} value - The quantity value to normalize
 * @returns {number} Normalized quantity (0 if invalid)
 */
export function normalizeCartQuantity(value) {
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity > 0
    ? Math.min(quantity, MAX_CART_QUANTITY) : 0;
}

/**
 * Parse and validate stored cart data from localStorage
 * @param {string} raw - Raw JSON string from localStorage
 * @returns {Array} Array of validated cart items
 */
export function parseStoredCart(raw) {
  try {
    const value = JSON.parse(raw || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item) => item && typeof item.product_id === 'string' && item.product_id)
      .map((item) => ({ ...item, quantity: normalizeCartQuantity(item.quantity),
        price_usd: Number.isFinite(Number(item.price_usd)) && Number(item.price_usd) >= 0 ? Number(item.price_usd) : 0 }))
      .filter((item) => item.quantity > 0);
  } catch { return []; }
}
