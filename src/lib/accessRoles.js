/**
 * The three account roles and what each one may reach: pages and data.
 *
 * One vocabulary for the whole app. An account is an Acheteur, a Vendeur or an
 * Administrateur, and may hold more than one of them.
 *
 * Page rules live in ROUTE_ACCESS (src/lib/access.js) and are enforced by
 * RequireAccess; data rules live in each entity's `rls`, snapshotted into
 * src/lib/rlsMatrixData.js. This module reads both and reports, per role, what
 * is open. It never grants anything itself.
 */
import { ROUTE_ACCESS } from '@/lib/access';
import { ENTITIES, OPERATIONS } from '@/lib/rlsMatrix';
import { ADMIN_LINKS, SELLER_LINKS } from '@/lib/navLinks';

export const ROLES = [
  {
    id: 'buyer',
    label: 'Acheteur',
    tagline: 'Le compte par défaut : acheter, suivre ses commandes, gérer son compte.',
    resolved: 'Tout compte connecté sans fiche vendeur et sans rôle admin.',
    scope: 'Il n’ouvre que la boutique et son espace personnel.',
  },
  {
    id: 'seller',
    label: 'Vendeur',
    tagline: 'Une boutique : produits, commandes, gros, portefeuille.',
    resolved: 'Une fiche Seller, Creator ou Courier, ou une adhésion d’équipe au rôle vendeur.',
    scope: 'Il ouvre en plus sa console vendeur.',
  },
  {
    id: 'admin',
    label: 'Administrateur',
    tagline: 'Le rôle plateforme : toutes les consoles et toutes les données.',
    resolved: 'Le rôle admin de la plateforme.',
    scope: 'Il ouvre tout, back-office et gestion des comptes compris.',
  },
];

/**
 * The shop and personal-space pages. None of them is in ROUTE_ACCESS, so every
 * signed-in account reaches them; they are the whole of what a buyer opens.
 */
export const SHOP_PAGES = [
  { path: '/', label: 'Accueil' },
  { path: '/discover', label: 'Découvrir' },
  { path: '/search', label: 'Recherche' },
  { path: '/categories', label: 'Catégories' },
  { path: '/product/:slug', label: 'Fiche produit' },
  { path: '/store/:slug', label: 'Boutique vendeur' },
  { path: '/cart', label: 'Panier' },
  { path: '/checkout', label: 'Commande' },
  { path: '/order-history', label: 'Mes commandes' },
  { path: '/order-tracking', label: 'Suivi de commande' },
  { path: '/wishlist', label: 'Favoris' },
  { path: '/messages', label: 'Messages' },
  { path: '/profile', label: 'Profil' },
  { path: '/saved-addresses', label: 'Adresses' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/returns', label: 'Retours' },
  { path: '/disputes', label: 'Litiges' },
  { path: '/support', label: 'Support' },
  { path: '/wallet', label: 'Portefeuille' },
  { path: '/sell-with-us', label: 'Devenir vendeur' },
];

/** Labels already written for the navigation, reused so none is duplicated. */
const NAV_LABELS = {};
[...ADMIN_LINKS, ...SELLER_LINKS].forEach((link) => {
  if (link?.to && link.label) NAV_LABELS[link.to] = link.label;
});

const humanize = (path) => {
  const last = String(path).split('/').filter(Boolean).pop() || path;
  return last.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
};

const pageLabel = (path) => NAV_LABELS[path] || humanize(path);

const WRITE_OPERATIONS = ['create', 'update', 'delete'];

/**
 * True when the role's account satisfies the rule protecting a path. A rule
 * naming a staff department answers false: staff membership is a separate axis,
 * not one of the three roles.
 */
function ruleAllows(rule, role) {
  if (!rule) return true;
  if (role === 'admin') return true;
  if (rule.admin) return false;
  if (rule.staff) return false;
  if (role === 'seller' && (rule.roles || []).includes('seller')) return true;
  return false;
}

/** The restricted pages this role may open, on top of the shop. */
export function rolePages(role) {
  return Object.entries(ROUTE_ACCESS)
    .filter(([, rule]) => ruleAllows(rule, role))
    .map(([path]) => ({ path, label: pageLabel(path) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * The entities this role can read or change. The platform knows only two data
 * roles, admin and user, so an acheteur and a vendeur are both "user": they get
 * the same audiences and are separated by owning different records, not by role.
 */
export function roleData(role) {
  const audiences = role === 'admin' ? ['public', 'owner', 'admin'] : ['public', 'owner'];
  return ENTITIES.map((entity) => ({
    name: entity.name,
    ops: Object.fromEntries(
      OPERATIONS.map((op) => [op.id, (entity.access[op.id] || []).some((id) => audiences.includes(id))]),
    ),
  })).filter((row) => OPERATIONS.some((op) => row.ops[op.id]));
}

/** The counters shown above the tables. */
export function roleSummary(role) {
  const restricted = rolePages(role);
  const data = roleData(role);
  return {
    pages: SHOP_PAGES.length + restricted.length,
    restrictedPages: restricted.length,
    readable: data.filter((row) => row.ops.read).length,
    writable: data.filter((row) => WRITE_OPERATIONS.some((op) => row.ops[op])).length,
    data: data.length,
  };
}

export const DATA_NOTE =
  'Acheteur et vendeur partagent les mêmes règles de données : la plateforme ne connaît que deux rôles de données, admin et user. Ce qui les sépare, c’est la propriété des fiches — chacun ne lit et ne modifie que les siennes — et non un rôle distinct.';