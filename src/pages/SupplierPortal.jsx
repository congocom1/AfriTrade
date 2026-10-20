import { useCollectionView } from '@/hooks/useCollectionView';
import CollectionToolbar from '@/components/portal/CollectionToolbar';
import CollectionPagination from '@/components/portal/CollectionPagination';
import PortalRefresh from '@/components/portal/PortalRefresh';
import EmptyState from '@/components/EmptyState';
import React, { useState } from 'react';
import { usePortalData } from '@/hooks/usePortalData';
import PortalStatus from '@/components/PortalStatus';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import StatCard from '@/components/ops/StatCard';
import { ADMIN_LINKS } from '@/lib/navLinks';
import SupplierHealthCard, { feedHealth } from '@/components/suppliers/SupplierHealthCard';

export default function SupplierPortal() {
  const { t } = useTranslation();
  const { data: suppliers, loading, error, reload, updatedAt } = usePortalData(['suppliers'], () => base44.entities.Supplier.list('name', 200));
  const view = useCollectionView(suppliers, ['name', 'code', 'country', 'adapter'], (supplier, filter) => filter === 'all' || (filter === 'active' && supplier.enabled) || (filter === 'inactive' && !supplier.enabled) || (filter === 'healthy' && feedHealth(supplier)[0] === 'healthOk'));
  const [actionError, setActionError] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [checks, setChecks] = useState({});
  const [checking, setChecking] = useState(null);

  const verify = async (s) => {
    setChecking(s.id);
    setActionError(false);
    try {
    const products = await base44.entities.Product.filter({ supplier_id: s.id }, '-updated_date', 500);
    const withRef = products.filter((p) => p.external_product_id).length;
    const stale = s.last_sync_at ? (Date.now() - new Date(s.last_sync_at)) / 36e5 > 72 : true;
    setChecks((previous) => ({ ...previous, [s.id]: [
      [s.enabled, s.enabled ? t('supplierPortal.checkActive') : t('supplierPortal.checkInactive')],
      [s.adapter !== 'manual', s.adapter === 'manual' ? t('supplierPortal.checkManual') : t('supplierPortal.checkConnector', { adapter: s.adapter })],
      [!s.is_mock, s.is_mock ? t('supplierPortal.checkDemo') : t('supplierPortal.checkReal')],
      [!stale, stale ? t('supplierPortal.checkStale') : t('supplierPortal.checkFresh')],
      [products.length > 0, t('supplierPortal.checkProducts', { count: products.length, ref: withRef })],
    ] }));
    } catch { setActionError(true); } finally { setChecking(null); }
  };
  const toggle = async (s, on) => {
    setUpdating(s.id); setActionError(false);
    try { await base44.entities.Supplier.update(s.id, { enabled: on }); await reload(); }
    catch { setActionError(true); } finally { setUpdating(null); }
  };

  const healthy = (suppliers || []).filter((s) => feedHealth(s)[0] === 'healthOk').length;
  return (
    <div className="portal-page space-y-6 pb-8">
      <DashboardNav title={t('supplierPortal.title')} links={ADMIN_LINKS} />
      {actionError && <p role="alert" className="text-sm text-destructive">{t('portalStatus.actionFailed')}</p>}
      {loading || error ? <PortalStatus loading={loading} retry={reload} /> : <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={t('supplierPortal.statSuppliers')} value={suppliers?.length ?? '–'} />
        <StatCard label={t('supplierPortal.statActive')} value={(suppliers || []).filter((s) => s.enabled).length} />
        <StatCard label={t('supplierPortal.statHealthy')} value={healthy} tone={healthy ? 'good' : 'warning'} />
      </div>
      <CollectionToolbar query={view.query} onQueryChange={view.setQuery} filter={view.filter} onFilterChange={view.setFilter} options={['all', 'active', 'inactive', 'healthy'].map((value) => ({ value, label: t(`portalComponents.${value}`) }))}>
        <PortalRefresh onRefresh={reload} updatedAt={updatedAt} />
      </CollectionToolbar>
      <p className="text-xs text-muted-foreground">{t('supplierPortal.hint')}</p>
      {view.count === 0 ? (
        <EmptyState title={t('portalComponents.noResults')} description={t('portalComponents.noResultsDescription')} actionLabel={t('portalComponents.clearFilters')} onAction={view.reset} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {view.records.map((s) => (
            <SupplierHealthCard key={s.id} supplier={s} check={checks[s.id]} checking={checking === s.id} updating={updating === s.id} onCheck={() => verify(s)} onToggle={(on) => toggle(s, on)} />
          ))}
        </div>
      )}
      <CollectionPagination view={view} onPageChange={view.setPage} />
      </>}
    </div>
  );
}