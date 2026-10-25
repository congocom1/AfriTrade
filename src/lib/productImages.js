import { familyPhoto } from '@/lib/unsplashImages';
import { resolveCategoryFamily } from '@/lib/categoryArt';

// Products reach the marketplace from local sellers, supplier imports and CSV
// uploads, so a missing photo is normal rather than exceptional. One shared
// fallback keeps every surface (storefront grid, cart, wholesale list, seller
// and admin tables) from rendering an empty frame.
export const PRODUCT_PLACEHOLDER =
  'https://media.base44.com/images/public/6ad35f967cfc0088309e830b/d7ddc9f4d_generated_image.png';

export function productImage(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const own = images.find(Boolean);
  if (own) return own;

  // No photo of its own: show real photography of the department it belongs to.
  const family = resolveCategoryFamily(`${product?.category_name || ''} ${product?.title || ''}`);
  return familyPhoto(family, 600) || PRODUCT_PLACEHOLDER;
}