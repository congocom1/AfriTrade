// Department artwork ships with the app as static SVG under
// public/assets/marketplace/categories. Categories live in the database with
// free-form slugs and names, so a slug is matched first, then the words of the
// name, and anything unmatched keeps the neutral mark.
import { familyPhoto } from '@/lib/unsplashImages';

const BASE = '/assets/marketplace/categories';

export const DEPARTMENT_ART = [
  'smartphones',
  'computers',
  'electronics',
  'home-appliances',
  'furniture',
  'home-decor',
  'fashion',
  'beauty',
  'agricultural-equipment',
  'automotive-parts',
  'construction-materials',
  'industrial-equipment',
  'manufacturing-machinery',
  'medical-equipment',
  'packaging-supplies',
  'solar-energy',
];

// Order matters: the first family that matches wins, so the more specific
// departments are listed before the broader ones.
const KEYWORDS = {
  smartphones: ['phone', 'phones', 'smartphone', 'smartphones', 'telephone', 'telephones', 'mobile', 'gsm', 'android'],
  computers: ['computer', 'computers', 'ordinateur', 'ordinateurs', 'laptop', 'laptops', 'informatique', 'pc'],
  electronics: ['electronics', 'electronique', 'electroniques', 'tv', 'television', 'audio', 'camera', 'cameras'],
  'home-appliances': ['appliance', 'appliances', 'electromenager', 'fridge', 'refrigerateur', 'cuisiniere', 'mixer'],
  furniture: ['furniture', 'meuble', 'meubles', 'mobilier'],
  'home-decor': ['decor', 'decoration', 'maison', 'home', 'interieur'],
  fashion: ['fashion', 'mode', 'vetement', 'vetements', 'clothing', 'textile', 'textiles', 'habit', 'habits', 'chaussures', 'shoes'],
  beauty: ['beauty', 'beaute', 'cosmetic', 'cosmetiques', 'soin', 'soins', 'parfum', 'maquillage'],
  'agricultural-equipment': ['agriculture', 'agricole', 'agri', 'farm', 'ferme', 'semence', 'semences', 'engrais'],
  'automotive-parts': ['auto', 'automobile', 'moto', 'motos', 'vehicule', 'vehicules', 'pneu', 'pneus', 'piece', 'pieces'],
  'construction-materials': ['construction', 'materiaux', 'ciment', 'brique', 'briques', 'bois', 'quincaillerie'],
  'industrial-equipment': ['industrial', 'industriel', 'equipement', 'equipements', 'outillage'],
  'manufacturing-machinery': ['machine', 'machines', 'machinery', 'fabrication', 'usine', 'production'],
  'medical-equipment': ['medical', 'medicale', 'sante', 'pharma', 'pharmacie', 'clinique'],
  'packaging-supplies': ['packaging', 'emballage', 'emballages', 'carton', 'cartons', 'sachet'],
  'solar-energy': ['solar', 'solaire', 'energie', 'panneau', 'panneaux', 'batterie', 'batteries', 'groupe'],
};

const fold = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Accepts a category record or bare text (slug, name, product title).
export function resolveCategoryFamily(category) {
  if (!category) return null;

  const text = fold(typeof category === 'string' ? category : `${category.slug || ''} ${category.name || ''}`).trim();
  if (!text) return null;

  const direct = DEPARTMENT_ART.find((slug) => text.includes(slug));
  if (direct) return direct;

  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  const match = Object.entries(KEYWORDS).find(([, keys]) => keys.some((key) => words.includes(key)));
  return match ? match[0] : null;
}

// A department shows real photography when the family is known; the flat SVG
// stays as the fallback for anything the keyword map cannot place.
export function resolveCategoryArt(category) {
  if (!category) return null;
  if (typeof category === 'object' && category.image_url) return category.image_url;

  const family = resolveCategoryFamily(category);
  if (!family) return null;
  return familyPhoto(family, 400) || `${BASE}/${family}.svg`;
}