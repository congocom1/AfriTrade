import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { applyTenantBranding, clearTenantBranding, resolveTenantByHost } from '@/lib/tenancy';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import BackButton from '@/components/BackButton';
import LegalFooter from '@/components/legal/LegalFooter';

export default function AppLayout() {
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
        <BackButton fallback="/" className="mb-4 md:hidden" />
        <Outlet />
        <LegalFooter />
      </main>
      <BottomNav />
    </div>
  );
}