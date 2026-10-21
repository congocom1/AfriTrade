import LegacySelect from '@/components/ui/legacy-select';
import { usePortalData } from '@/hooks/usePortalData';
import { loadRecordGroups } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import PortalRefresh from '@/components/portal/PortalRefresh';
import ConfirmActionDialog from '@/components/portal/ConfirmActionDialog';
import React, { useMemo, useRef, useState } from 'react';
import { Search, Eye, EyeOff, Trash2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import StatusBadge from '@/components/StatusBadge';
import { Image } from '@/components/ui/image';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { formatUsdAmount, } from '@/lib/format';
import { useTranslation } from 'react-i18next';

export default function AdminProducts() {
  const { t } = useTranslation();
  const { data, loading, error, reload, updatedAt } = usePortalData(['admin-products'], () => loadRecordGroups({
    products: () => base44.entities.Product.list('-created_date', 300),
  }));
  const products = data?.products || [];
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [actionError, setActionError] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');

  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    return products.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (source === 'local' && p.source_type === 'international_supplier') return false;
      if (source === 'international' && p.source_type !== 'international_supplier') return false;
      if (q && !`${p.title} ${p.seller_name || ''} ${p.supplier_name || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, term, status, source]);

  const mutate = async (operation) => {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setActionError(false);
    try { await operation(); await reload(); return true; }
    catch { setActionError(true); return false; }
    finally { pending.current = false; setBusy(false); }
  };
  const setStatusOf = (p, next) => mutate(() => base44.entities.Product.update(p.id, { status: next }));
  const toggleFlash = (p) => mutate(() => base44.entities.Product.update(p.id, { is_flash_sale: !p.is_flash_sale }));
  const remove = () => mutate(() => base44.entities.Product.delete(deleting.id));
  if (loading || error) return <div className="space-y-5"><DashboardNav title={t('adminProducts.title')} links={ADMIN_LINKS} /><PortalStatus loading={loading} retry={reload} /></div>;

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title={t('adminProducts.title')} links={ADMIN_LINKS} />
      <PortalRefresh onRefresh={reload} updatedAt={updatedAt} />
      {actionError && <p role="alert" className="text-sm text-destructive">{t('portalStatus.actionFailed')}</p>}
      <ConfirmActionDialog open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title={t('adminProducts.delete')} description={deleting?.title || ''} confirmLabel={t('adminProducts.delete')} onConfirm={remove} />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label={t('adminProducts.search')}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('adminProducts.search')}
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm"
          />
        </div>
        <LegacySelect aria-label={t('adminProducts.allStatuses')} value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-xs">
          <option value="all">{t('adminProducts.allStatuses')}</option>
          <option value="published">{t('adminProducts.published')}</option>
          <option value="draft">{t('adminProducts.drafts')}</option>
          <option value="archived">{t('adminProducts.archived')}</option>
        </LegacySelect>
        <LegacySelect aria-label={t('adminProducts.allSources')} value={source} onChange={(e) => setSource(e.target.value)} className="h-10 rounded-lg border border-border bg-card px-3 text-xs">
          <option value="all">{t('adminProducts.allSources')}</option>
          <option value="local">{t('adminProducts.local')}</option>
          <option value="international">{t('adminProducts.intl')}</option>
        </LegacySelect>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={p.images?.[0]} alt={p.title} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t('adminProducts.meta', { seller: p.seller_name || p.supplier_name, ref: p.external_product_id || t('adminProducts.localRef'), stock: p.stock ?? 0 })}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs font-bold">{formatUsdAmount(p.price_usd)}</span>
                  <StatusBadge status={p.status} />
                  {p.is_flash_sale && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">Flash</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" disabled={busy} onClick={() => toggleFlash(p)} className="rounded-lg p-2 hover:bg-secondary" title={t('adminProducts.flash')}>
                  <Zap className={`h-4 w-4 ${p.is_flash_sale ? 'text-amber-500' : ''}`} />
                </button>
                <button
                  type="button" disabled={busy}
                  onClick={() => setStatusOf(p, p.status === 'published' ? 'archived' : 'published')}
                  className="rounded-lg p-2 hover:bg-secondary"
                  title={t('adminProducts.publishArchive')}
                >
                  {p.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button type="button" disabled={busy} onClick={() => setDeleting(p)} className="rounded-lg p-2 text-destructive hover:bg-secondary" title={t('adminProducts.delete')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {!visible.length && (
            <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              {t('adminProducts.empty')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}