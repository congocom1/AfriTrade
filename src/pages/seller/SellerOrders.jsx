import { usePortalData } from '@/hooks/usePortalData';
import { loadRecordGroups } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import PortalRefresh from '@/components/portal/PortalRefresh';
import { SELLER_LINKS } from '@/lib/navLinks';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, PackageCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useActiveSeller } from '@/lib/seller';
import { advanceFulfillment } from '@/lib/orderService';
import { SHIPMENT_STATUS_FLOW, SHIPMENT_STATUS_LABELS } from '@/lib/logistics';
import DashboardNav from '@/components/DashboardNav';
import StatusBadge from '@/components/StatusBadge';
import { formatUsdAmount, } from '@/lib/format';



const SELLER_FLOW = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function SellerOrders() {
  const { t } = useTranslation();
  const { seller, loading: loadingSeller, error: scopeError, reload: reloadScope } = useActiveSeller();
  const { data, loading, error, reload, updatedAt } = usePortalData(['seller-orders', seller?.id], () => loadRecordGroups({
    orders: () => base44.entities.FulfillmentOrder.filter({ seller_id: seller.id }, '-created_date', 100),
  }), { enabled: Boolean(seller) });
  const orders = data?.orders || [];
  const [filter, setFilter] = useState('open');
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState(false);

  const next = (status) => {
    const i = SELLER_FLOW.indexOf(status);
    if (i < 0 || i >= SELLER_FLOW.length - 1) return null;
    return SELLER_FLOW[i + 1];
  };

  const advance = async (f) => {
    const target = next(f.status);
    if (!target) return;
    if (busy) return;
    setActionError(false);
    setBusy(f.id);
    try {
      await advanceFulfillment(base44, f, target);
      await reload();
    } catch {
      setActionError(true);
    } finally {
      setBusy('');
    }
  };

  const cancel = async (f) => {
    if (busy) return;
    setActionError(false);
    setBusy(f.id);
    try {
      await advanceFulfillment(base44, f, 'CANCELLED');
      await reload();
    } catch {
      setActionError(true);
    } finally {
      setBusy('');
    }
  };

  const visible = orders.filter((f) =>
    filter === 'open' ? !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(f.status) : true,
  );

  if (loadingSeller || scopeError) return <PortalStatus loading={loadingSeller} retry={reloadScope} />;
  if (!seller) return <p>{t('seller.noShop')}</p>;
  if (loading || error) return <PortalStatus loading={loading} retry={reload} />;

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title={t('sellerOrders.title')} links={SELLER_LINKS} />

      <PortalRefresh onRefresh={reload} updatedAt={updatedAt} />
      {actionError && <p role="alert" className="text-sm text-destructive">{t('portalStatus.actionFailed')}</p>}
      <div className="flex gap-2">
        {[
          { id: 'open', label: t('sellerOrders.filterOpen') },
          { id: 'all', label: t('sellerOrders.filterAll') },
        ].map((tx) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => setFilter(tx.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              filter === tx.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            {tx.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : visible.length ? (
        <div className="space-y-2.5">
          {visible.map((f) => (
            <div key={f.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{f.order_number}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.fulfillment_number} · {f.courier_name} {f.tracking_number ? `· ${f.tracking_number}` : ''}
                  </p>
                </div>
                <StatusBadge status={f.status} />
              </div>

              <div className="mt-3 space-y-1.5">
                {(f.items || []).map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="min-w-0 flex-1 truncate">{it.title} {it.variant ? `(${it.variant})` : ''}</span>
                    <span className="text-muted-foreground">× {it.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary/50 p-2.5 text-xs md:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">{t('sellerOrders.sale')}</p>
                  <p className="font-bold">{formatUsdAmount(f.subtotal_usd)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('sellerOrders.myShare')}</p>
                  <p className="font-bold text-emerald-600">{formatUsdAmount(f.seller_payout_usd)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('sellerOrders.delivery')}</p>
                  <p className="font-bold">{f.estimated_delivery || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('sellerOrders.payout')}</p>
                  <p className="font-bold">{f.payout_released ? t('sellerOrders.released') : t('sellerOrders.pending')}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {next(f.status) && (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => advance(f)}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    {t('sellerOrders.advanceTo', { status: t(SHIPMENT_STATUS_LABELS[next(f.status)] || 'status.UNKNOWN') })}
                  </button>
                )}
                {f.status === 'DELIVERED' && f.payout_released && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-900">
                    <PackageCheck className="h-3.5 w-3.5" /> {t('sellerOrders.payoutReleased')}
                  </span>
                )}
                {!['DELIVERED', 'CANCELLED', 'RETURNED'].includes(f.status) && (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => cancel(f)}
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-destructive disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
          {t('sellerOrders.empty')}
        </p>
      )}

      <p className="text-[11px] text-muted-foreground">
        {t('sellerOrders.lifecycle', { flow: SHIPMENT_STATUS_FLOW.slice(0, 8).map((s) => t(SHIPMENT_STATUS_LABELS[s] || 'status.UNKNOWN')).join(' → ') })}
      </p>
    </div>
  );
}