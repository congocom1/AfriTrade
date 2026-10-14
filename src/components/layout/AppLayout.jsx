import { useEffect } from 'react';
import { applyTenantBranding, clearTenantBranding, resolveTenantByHost } from '@/lib/tenancy';

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
}