import {
  Banknote,
  BarChart3,
  Bike,
  Boxes,
  Building2,
  Calculator,
  ClipboardList,
  CreditCard,
  Factory,
  FileText,
  Globe2,
  Map,
  MapPin,
  MapPinned,
  Printer,
  Ruler,
  Settings2,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Upload,
  Wallet,
  Warehouse,
} from 'lucide-react';

/**
 * The three AfriTrade portals.
 *
 * The platform is one app with one router; a portal is a navigation shell. Each
 * route belongs to exactly one portal, decided by its first path segment, so
 * every existing link keeps working while the header, the navigation and the
 * landing page change with the portal the visitor is in.
 */
export const PORTAL_BUYER = 'buyer';
export const PORTAL_PRO = 'pro';
export const PORTAL_LOGISTICS = 'logistics';

// First path segments owned by each console portal. Anything else is the shop.
const PRO_ROOTS = new Set([
  'pro',
  'seller',
  'seller-portal',
  'seller-reports',
  'b2b',
  'bulk-orders',
  'bulk-import',
  'market-trends',
  'supplier-portal',
  'inventory-management',
  'inventory-alerts',
  'payout-history',
  'payout-settings',
  'payout-ledger',
  'payout-requests',
  'tax-reports',
  'merchant-disputes',
  'partner-ai-settings',
  'creator',
  'tenant',
  'tenant-onboarding',
  'subscription-plans',
  'finance',
  'developers',
]);

const LOGISTICS_ROOTS = new Set([
  'logistics',
  'logistics-hub',
  'logistics-rates',
  'delivery-map',
  'shipping-config',
  'shipping-labels',
  'warehouse',
  'china-warehouse',
  'pickup-manager',
  'coverage-map',
  'courier',
]);

/** Sections shown on a portal landing page and in its navigation. */
const PRO_SECTIONS = [
  { id: 'seller', path: '/seller', icon: Store },
  { id: 'b2b', path: '/b2b', icon: Boxes },
  { id: 'suppliers', path: '/supplier-portal', icon: Factory },
  { id: 'quotes', path: '/b2b/quotes', icon: FileText },
  { id: 'stock', path: '/inventory-management', icon: Warehouse },
  { id: 'sellerWallet', path: '/seller/wallet', icon: Wallet },
  { id: 'payouts', path: '/payout-history', icon: Banknote },
  { id: 'creator', path: '/creator', icon: Sparkles },
  { id: 'reports', path: '/seller-reports', icon: BarChart3 },
  { id: 'trends', path: '/market-trends', icon: TrendingUp },
  { id: 'bulkImport', path: '/bulk-import', icon: Upload },
  { id: 'billing', path: '/subscription-plans', icon: CreditCard },
  { id: 'partner', path: '/tenant', icon: Building2 },
  { id: 'b2bOps', path: '/admin/b2b', icon: ClipboardList },
];

const LOGISTICS_SECTIONS = [
  { id: 'tracking', path: '/order-tracking', icon: MapPin },
  { id: 'hub', path: '/logistics-hub', icon: Truck },
  { id: 'shipments', path: '/shipping-labels', icon: Printer },
  { id: 'rates', path: '/logistics-rates', icon: Calculator },
  { id: 'deliveryMap', path: '/delivery-map', icon: Map },
  { id: 'pickup', path: '/pickup-manager', icon: MapPinned },
  { id: 'warehouses', path: '/warehouse', icon: Warehouse },
  { id: 'chinaWarehouse', path: '/china-warehouse', icon: Ship },
  { id: 'courier', path: '/courier', icon: Bike },
  { id: 'shippingConfig', path: '/shipping-config', icon: Settings2 },
  { id: 'shippingCalculator', path: '/shipping-calculator', icon: Ruler },
  { id: 'coverage', path: '/coverage-map', icon: Globe2 },
];

export const PORTALS = {
  [PORTAL_BUYER]: {
    id: PORTAL_BUYER,
    labelKey: 'portals.buyer.label',
    taglineKey: 'portals.buyer.tagline',
    icon: ShoppingBag,
    home: '/',
    sections: [],
  },
  [PORTAL_PRO]: {
    id: PORTAL_PRO,
    labelKey: 'portals.pro.label',
    taglineKey: 'portals.pro.tagline',
    icon: Factory,
    home: '/pro',
    guestCta: { labelKey: 'portals.becomeSeller', path: '/sell-with-us' },
    sections: PRO_SECTIONS,
  },
  [PORTAL_LOGISTICS]: {
    id: PORTAL_LOGISTICS,
    labelKey: 'portals.logistics.label',
    taglineKey: 'portals.logistics.tagline',
    icon: Truck,
    home: '/logistics',
    guestCta: { labelKey: 'portals.becomeCourier', path: '/contact' },
    sections: LOGISTICS_SECTIONS,
  },
};

/** The three portals, in switcher order. */
export const PORTAL_LIST = [PORTALS[PORTAL_BUYER], PORTALS[PORTAL_PRO], PORTALS[PORTAL_LOGISTICS]];

/** The internal back office, offered to administrators next to the portals. */
export const BACKOFFICE = {
  id: 'backoffice',
  path: '/admin',
  labelKey: 'portals.backoffice.label',
  icon: ShieldCheck,
};

/** The portal that owns a path. */
export function portalForPath(pathname) {
  const [root] = String(pathname || '/').split('/').filter(Boolean);
  if (!root) return PORTALS[PORTAL_BUYER];
  if (LOGISTICS_ROOTS.has(root)) return PORTALS[PORTAL_LOGISTICS];
  if (PRO_ROOTS.has(root)) return PORTALS[PORTAL_PRO];
  return PORTALS[PORTAL_BUYER];
}