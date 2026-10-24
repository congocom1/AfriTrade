import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import LoadingFallback from '@/components/LoadingFallback';
import { useAccess } from '@/hooks/useAccess';
import { accessForPath, accessLabels, canOpen } from '@/lib/access';

/**
 * Role gate for the back-office consoles. Nested inside RequireLogin, so the
 * account is already signed in here; this only decides which pages it may open.
 * The rule for the current path comes from ROUTE_ACCESS.
 */
export default function RequireAccess() {
  const { pathname } = useLocation();
  const access = useAccess();

  if (access.loading) return <LoadingFallback />;

  if (!canOpen(pathname, access)) {
    const labels = accessLabels(accessForPath(pathname));
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-base font-bold">Accès réservé</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Votre compte n'a pas les droits nécessaires pour ouvrir cette page.
        </p>
        {labels.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Réservé à : {labels.join(', ')}.</p>
        )}
      </div>
    );
  }

  return <Outlet />;
}