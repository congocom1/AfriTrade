/**
 * Role-based access control for the back-office.
 *
 * A signed-in account reaches a console through one of three identities:
 *  - platform administrator (`user.role === 'admin'`) — every console;
 *  - staff — the departments on the account's EmployeeMembership record;
 *  - partner — seller, creator or courier, resolved from the account's own
 *    Seller / Creator / Courier record or from its tenant team membership.
 *
 * ROUTE_ACCESS is the single source of truth for the page rules. A path that is
 * not listed stays open to every signed-in account, so the account pages
 * (profile, addresses, messages, subscriptions) keep working for buyers.
 *
 * Pages are gated here; rows are gated by each entity's `rls`. The two are
 * deliberately separate: this file never grants access to data.
 */

export const STAFF_DEPARTMENTS = [
  'sales',
  'support',
  'warehouse',
  'logistics',
  'finance',
  'administration',
  'procurement',
  'marketing',
  'people',
  'technology',
];

export const DEPARTMENT_LABELS = {
  sales: 'Ventes',
  support: 'Support',
  warehouse: 'Entrepôt',
  logistics: 'Logistique',
  finance: 'Finance',
  administration: 'Administration',
  procurement: 'Achats',
  marketing: 'Marketing',
  people: 'Personnel',
  technology: 'Technologie',
};

export const ROLE_LABELS = {
  seller: 'Vendeur',
  creator: 'Créateur',
  courier: 'Livreur',
};

/**
 * Path → who may open it.
 *   departments: the staff departments that own the console
 *   roles:       the partner identities that own the console
 *   staff:       any account with an active staff membership
 *   admin:       platform administrators only
 * Administrators always pass; a rule with none of these keys is admin-only.
 */
export const ROUTE_ACCESS = {
  // Platform administration — no department owns these.
  '/backoffice': { admin: true },
  '/backoffice/sales': { admin: true },
  '/backoffice/mobile-money': { admin: true },
  '/admin/users': { admin: true },
  '/admin/settings': { admin: true },
  '/admin/tenants': { admin: true },
  '/admin/compliance': { admin: true },
  '/admin/access-matrix': { admin: true },
  '/developers': { admin: true },

  // Administration
  '/admin': { departments: ['administration'] },
  '/admin/command-center': { departments: ['administration'] },
  '/admin/products': { departments: ['administration'] },
  '/admin/fraud': { departments: ['administration'] },
  '/fraud-alerts': { departments: ['administration'] },

  // Sales
  '/admin/orders': { departments: ['sales'] },
  '/admin/returns': { departments: ['sales'] },
  '/admin/b2b': { departments: ['sales'] },
  '/admin/disputes': { departments: ['sales', 'support'] },

  // Support
  '/support-inbox': { departments: ['support'] },
  '/ticket-automation': { departments: ['support'] },

  // Warehouse
  '/warehouse': { departments: ['warehouse'] },
  '/china-warehouse': { departments: ['warehouse'] },
  '/shipping-labels': { departments: ['warehouse'] },
  '/inventory-sheets': { departments: ['warehouse'] },
  '/pickup-manager': { departments: ['warehouse'] },

  // Logistics
  '/logistics-hub': { departments: ['logistics'] },
  '/logistics-rates': { departments: ['logistics'] },
  '/delivery-map': { departments: ['logistics'] },
  '/shipping-config': { departments: ['logistics'] },
  '/admin/logistics': { departments: ['logistics'] },

  // Finance
  '/finance': { departments: ['finance'] },
  '/admin/payouts': { departments: ['finance'] },
  '/admin/billing': { departments: ['finance'] },

  // Procurement
  '/admin/suppliers': { departments: ['procurement'] },
  '/supplier-portal': { departments: ['procurement'] },

  // Marketing
  '/admin/promotions': { departments: ['marketing'] },
  '/marketing-analytics': { departments: ['marketing'] },
  '/platform-analytics': { departments: ['marketing'] },
  '/analytics': { departments: ['marketing'] },
  '/category-manager': { departments: ['marketing'] },
  '/admin/notifications': { departments: ['marketing'] },

  // People
  '/admin/employees': { departments: ['people'] },

  // Technology
  '/admin/events': { departments: ['technology'] },
  '/admin/workflows': { departments: ['technology'] },
  '/integration-logs': { departments: ['technology'] },
  '/platform-health': { departments: ['technology'] },
  '/service-level-monitor': { departments: ['technology'] },
  '/workflow-monitor': { departments: ['technology'] },

  // Staff workspace — any active staff membership.
  '/employee': { staff: true },
  '/employee/:department': { staff: true },

  // Seller console
  '/seller': { roles: ['seller'] },
  '/seller/products': { roles: ['seller'] },
  '/seller/orders': { roles: ['seller'] },
  '/seller/import': { roles: ['seller'] },
  '/seller/wallet': { roles: ['seller'] },
  '/seller/settings': { roles: ['seller'] },
  '/seller/messages': { roles: ['seller'] },
  '/seller/quotes': { roles: ['seller'] },
  '/seller-portal': { roles: ['seller'] },
  '/seller-reports': { roles: ['seller'] },
  '/inventory-management': { roles: ['seller'] },
  '/inventory-alerts': { roles: ['seller'], departments: ['warehouse'] },
  '/partner-ai-settings': { roles: ['seller'] },
  '/payout-history': { roles: ['seller'] },
  '/payout-settings': { roles: ['seller'] },
  '/payout-ledger': { roles: ['seller'], departments: ['finance'] },
  '/tax-reports': { roles: ['seller'], departments: ['finance'] },
  '/merchant-disputes': { roles: ['seller'], departments: ['support'] },
  '/data-export': { roles: ['seller'] },
  '/bulk-import': { roles: ['seller'] },
  '/b2b/quotes': { roles: ['seller'] },

  // Creator and courier consoles
  '/creator': { roles: ['creator'] },
  '/courier': { roles: ['courier'] },
};

const segments = (path) => String(path || '').split('/').filter(Boolean);

/** The rule protecting a path, or null when any signed-in account may open it. */
export function accessForPath(pathname) {
  const parts = segments(pathname);
  for (const [pattern, rule] of Object.entries(ROUTE_ACCESS)) {
    const shape = segments(pattern);
    if (shape.length !== parts.length) continue;
    if (shape.every((part, i) => part.startsWith(':') || part === parts[i])) return rule;
  }
  return null;
}

/** True when the account's resolved access satisfies the rule for this path. */
export function canOpen(pathname, access) {
  const rule = accessForPath(pathname);
  if (!rule) return true;
  if (access?.isAdmin) return true;
  if (rule.admin) return false;
  if (rule.staff && (access?.departments?.length || 0) > 0) return true;
  if ((rule.departments || []).some((d) => access?.departments?.includes(d))) return true;
  if ((rule.roles || []).some((r) => access?.roles?.includes(r))) return true;
  return false;
}

/** Readable labels for the refusal panel. */
export function accessLabels(rule) {
  if (!rule) return [];
  const labels = [];
  (rule.departments || []).forEach((d) => labels.push(DEPARTMENT_LABELS[d] || d));
  (rule.roles || []).forEach((r) => labels.push(ROLE_LABELS[r] || r));
  if (rule.staff) labels.push('Personnel');
  return labels;
}