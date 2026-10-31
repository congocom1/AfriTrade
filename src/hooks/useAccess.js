import { base44 } from '@/api/base44Client';
import { usePortalData } from '@/hooks/usePortalData';
import { isAdmin } from '@/lib/roles';
import { STAFF_DEPARTMENTS } from '@/lib/access';

const EMPTY = { isAdmin: false, departments: [], roles: [] };

const list = (value) => (Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : []);

/**
 * What the signed-in account may open: its platform role, its staff departments
 * and its partner identities. Resolved once per account and cached, so every
 * console on the way in shares one lookup.
 */
export function useAccess() {
  const { data, loading } = usePortalData(['access-identities'], async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me?.id) return EMPTY;
    if (isAdmin(me)) return { isAdmin: true, departments: STAFF_DEPARTMENTS, roles: ['seller', 'creator', 'courier'] };

    const email = String(me.email || '').trim().toLowerCase();
    const [sellers, creators, couriers, memberships, team] = await Promise.all([
      email ? base44.entities.Seller.filter({ email }).catch(() => []) : [],
      email ? base44.entities.Creator.filter({ email }).catch(() => []) : [],
      email ? base44.entities.Courier.filter({ email }).catch(() => []) : [],
      base44.entities.EmployeeMembership.filter({ user_id: me.id }).catch(() => []),
      email ? base44.entities.TenantMember.filter({ email }).catch(() => []) : [],
    ]);

    // An ambiguous or suspended staff record fails closed, as the workspace does.
    const staff = list(memberships);
    const member = staff.length === 1 && staff[0].active === true ? staff[0] : null;
    const departments = (member?.departments || []).filter((d) => STAFF_DEPARTMENTS.includes(d));

    const roles = [];
    const tenantRoles = list(team)
      .filter((m) => m.status !== 'suspended')
      .map((m) => m.role);

    if (list(sellers).length || tenantRoles.some((r) => ['SELLER', 'TENANT_ADMIN'].includes(r))) roles.push('seller');
    if (list(creators).length || tenantRoles.includes('CREATOR')) roles.push('creator');
    if (list(couriers).length || tenantRoles.includes('COURIER')) roles.push('courier');

    return { isAdmin: false, departments, roles };
  });

  return { ...(data || EMPTY), loading };
}