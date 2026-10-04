import React, { useEffect } from 'react';
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
}