import PortalHome from '@/components/portal/PortalHome';
import { PORTAL_LOGISTICS } from '@/lib/portals';

/** Landing page of the logistics space. */
export default function LogisticsPortal() {
  return <PortalHome portalId={PORTAL_LOGISTICS} />;
}