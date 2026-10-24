import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { applyTenantBranding, clearTenantBranding, resolveTenantByHost } from '@/lib/tenancy';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import BackButton from '@/components/BackButton';
import LegalFooter from '@/components/legal/LegalFooter';

const CUSTOM_BACK_BUTTON_PREFIXES = [
  '/checkout',
  '/customer-loyalty',
  '/order/',
  '/order-tracking',
  '/payment-methods',
  '/product/',
  '/profile',
  '/returns',
  '/saved-addresses',
  '/user-profile',
  '/wallet',
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const hasPageBackButton =
    pathname === '/' ||
    CUSTOM_BACK_BUTTON_PREFIXES.some((prefix) =>
      prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

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
    <div className="brand-app-shell min-h-screen bg-background pb-8 md:pb-8">
      <TopBar />
      <main className="mx-auto w-full min-w-0 max-w-6xl px-3 py-6 md:px-6 md:py-9">
        {!hasPageBackButton && <BackButton fallback="/" className="mb-4 md:hidden" />}
        <Outlet />
        <LegalFooter />
      </main>
      <BottomNav />
    </div>
  );
}