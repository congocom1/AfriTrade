import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { PORTALS, PORTAL_BUYER, PORTAL_LOGISTICS, PORTAL_PRO } from '@/lib/portals';

const enteredKey = (email) => `afritrade.portal.${String(email || '').trim().toLowerCase()}`;

/**
 * The space an account belongs to, read from the email it signs in with:
 * a courier record means the logistics space, a seller or creator record means
 * the business space, anyone else the shop. Administrators keep the back office
 * and are never moved.
 *
 * A partner is taken into their own space once per session, when they open the
 * shop home. After that the shop stays reachable as usual, and no menu ever asks
 * them to pick a space.
 */
export function usePortalIdentity() {
  const { user } = useAuth();
  const access = useAccess();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const entered = useRef(false);

  const partner = !access.loading && !access.isAdmin && access.roles?.length
    ? (access.roles.includes('courier') && !access.roles.includes('seller') && !access.roles.includes('creator')
      ? PORTAL_LOGISTICS
      : access.roles.includes('seller') || access.roles.includes('creator')
        ? PORTAL_PRO
        : PORTAL_BUYER)
    : PORTAL_BUYER;

  useEffect(() => {
    if (entered.current || access.loading || partner === PORTAL_BUYER) return;
    if (pathname !== '/' || !user?.email) return;
    const key = enteredKey(user.email);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, partner);
    entered.current = true;
    navigate(PORTALS[partner].home, { replace: true });
  }, [access.loading, partner, pathname, user?.email, navigate]);

  return PORTALS[partner];
}