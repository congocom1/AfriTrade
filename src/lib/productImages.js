// Products reach the marketplace from local sellers, supplier imports and CSV
// uploads, so a missing photo is normal rather than exceptional. One shared
// fallback keeps every surface (storefront grid, cart, wholesale list, seller
// and admin tables) from rendering an empty frame.
export const PRODUCT_PLACEHOLDER =
  'https://media.base44.com/images/public/6ad35f967cfc0088309e830b/d174c8dff_generated_image.png';

export function productImage(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  return images.find(Boolean) || PRODUCT_PLACEHOLDER;
}