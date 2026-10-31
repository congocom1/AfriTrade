/**
 * Platform role helpers.
 *
 * Base44 issues exactly two platform roles: `admin` and `user`. A seller, creator
 * or courier identity lives in its own tenant record (Seller, Creator, CourierFleet),
 * never in `user.role` — so `role` only decides who may open the back-office, while
 * workspace membership is decided by the tenant record that the workspace page loads
 * itself. This file is the single source of truth so every call site uses one pattern.
 *
 * (`src/lib/permissions.js` covers the other notion of role: the members of a
 * tenant team and what each of them may do inside that tenant.)
 */

export const ADMIN_ROLE = 'admin';

/** True when the account holds the platform administrator role. */
export const isAdmin = (user) => String(user?.role ?? '') === ADMIN_ROLE;

/**
 * Workspaces a signed-in account can open. Every entry is a `RequireLogin` route,
 * so the workspace page itself renders an empty state when the account owns no
 * matching tenant record. Administrators reach all of them.
 */
export const WORKSPACES = [
  { key: 'nav.sellerSpace', path: '/seller' },
  { key: 'nav.creatorSpace', path: '/creator' },
  { key: 'nav.courierSpace', path: '/courier' },
  { key: 'nav.employeeSpace', path: '/employee' },
];
