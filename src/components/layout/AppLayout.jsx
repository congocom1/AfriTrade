// eslint-disable-next-line no-unused-imports
import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import LegalFooter from '@/components/legal/LegalFooter';
import { applyTenantBranding, clearTenantBranding, resolveTenantByHost } from '@/lib/tenancy';
import BackButton from '@/components/BackButton';

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
    <div className="min-h-screen bg-background pb-8 md:pb-8">
      <TopBar />
      <main className="mx-auto w-full min-w-0 max-w-6xl px-3 py-5 md:px-6 md:py-7">
        <BackButton fallback="/" className="mb-4 md:hidden" />
        <Outlet />
        <LegalFooter />
      </main>
    </div>
  );
}
