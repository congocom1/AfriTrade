import { useEffect, useRef } from 'react';
import { useOutlet, useLocation, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { navigationDirection, routeMotion } from '@/lib/navigationDirection';
import { applyTenantBranding, clearTenantBranding, resolveTenantByHost } from '@/lib/tenancy';
import { PORTAL_BUYER, portalForPath } from '@/lib/portals';
import { usePortalIdentity } from '@/hooks/usePortalIdentity';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';
import LegalFooter from '@/components/legal/LegalFooter';

export default function AppLayout() {
  const location = useLocation();
  // Capture this route's element. A live <Outlet /> inside an exiting wrapper
  // follows the new router context, mounting the next page twice during exit.
  const outlet = useOutlet();
  // The shop keeps the storefront bar; a console portal gets its own header and
  // navigation, so an operator never sees shop links inside their console.
  // The front page carries its own masthead inside the hero, so the storefront
  // bar stays out of its way.
  const isFrontPage = location.pathname === '/';
  const portal = portalForPath(location.pathname);
  const isConsole = portal.id !== PORTAL_BUYER;
  // A seller, creator or courier is taken into its own space once per session.
  usePortalIdentity();
  const navigationType = useNavigationType();
  const reducedMotion = useReducedMotion();
  const lastRoute = useRef({ key: location.key, index: window.history.state?.idx });
  const currentIndex = window.history.state?.idx;
  const direction = lastRoute.current.key === location.key
    ? 0
    : navigationDirection(lastRoute.current.index, currentIndex, navigationType);
  if (lastRoute.current.key !== location.key) {
    lastRoute.current = { key: location.key, index: currentIndex };
  }
  const variants = reducedMotion ? {
    initial: { opacity: 1, x: 0 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 1, x: 0 },
  } : routeMotion;

  useEffect(() => {
    let alive = true;
    resolveTenantByHost()
      .then((tenant) => { if (alive && tenant) applyTenantBranding(tenant); })
      .catch(() => {});
    return () => {
      alive = false;
      clearTenantBranding();
    };
  }, []);

  return (
    <div className={`brand-app-shell min-h-screen bg-background ${isConsole || isFrontPage ? 'pb-8' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8'}`}>
      {isConsole ? (
        <>
          <PortalHeader portal={portal} />
          <PortalNav portal={portal} />
        </>
      ) : isFrontPage ? null : (
        <TopBar />
      )}
      <main data-webview-scroll className="mx-auto w-full min-w-0 max-w-6xl px-3 py-6 md:px-6 md:py-9">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={location.pathname}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
        <LegalFooter />
      </main>
      {!isConsole && !isFrontPage && <BottomNav />}
    </div>
  );
}