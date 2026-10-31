import PortalHome from '@/components/portal/PortalHome';
import { PORTAL_PRO } from '@/lib/portals';

/** Landing page of the business space. */
export default function ProPortal() {
  return <PortalHome portalId={PORTAL_PRO} />;
}