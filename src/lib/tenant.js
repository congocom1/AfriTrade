import { usePortalData } from '@/hooks/usePortalData';
import { useCallback, useState } from 'react';
import { base44 } from '@/api/base44Client';

const KEY_PREFIX = 'congo_commerce:active_tenant:';

function readStored(key) {
  try {
    return localStorage.getItem(KEY_PREFIX + key) || '';
  } catch {
    return '';
  }
}

function writeStored(key, id) {
  try {
    localStorage.setItem(KEY_PREFIX + key, id || '');
  } catch {
    /* ignore */
  }
}

/**
 * Multitenancy: a signed-in partner only ever reaches the shop, courier fleet or
 * creator account bound to their tenant record.
 * Admins keep the global view and the account switcher.
 */
export function useTenantScope(entityName) {
  const [selectedId, setSelectedId] = useState(() => readStored(entityName));
  const { data, loading, error, reload } = usePortalData(['account-scope', entityName], async () => {
    const me = await base44.auth.me();
    const admin = me?.role === 'admin';
    const tenantId = String(me?.tenant_id || '').trim();
    const all = await base44.entities[entityName].list('name', 100);
    if (!Array.isArray(all)) throw new Error('Invalid account scope');
    return {
      rows: admin ? all : all.filter((row) => tenantId && String(row.tenant_id || '').trim() === tenantId),
      isAdmin: admin,
    };
  });
  const rows = data?.rows || [];
  const isAdmin = data?.isAdmin || false;

  const selectTenant = useCallback(
    (id) => {
      writeStored(entityName, id);
      setSelectedId(id);
    },
    [entityName],
  );

  return {
    tenants: rows,
    tenant: rows.find((r) => r.id === selectedId) || rows[0] || null,
    isAdmin,
    loading,
    error,
    reload,
    selectTenant,
  };
}