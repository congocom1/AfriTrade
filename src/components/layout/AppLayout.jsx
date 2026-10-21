import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { navigationDirection, routeMotion } from '@/lib/navigationDirection';
import { applyTenantBranding, clearTenantBranding, resolveTenantByHost } from '@/lib/tenancy';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import LegalFooter from '@/components/legal/LegalFooter';

export default function AppLayout() {
  const location = useLocation();
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
    <div className="brand-app-shell min-h-screen bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <TopBar />
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
            <Outlet />
          </motion.div>
        </AnimatePresence>
        <LegalFooter />
      </main>
      <BottomNav />
    </div>
  );
}