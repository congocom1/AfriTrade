import { SELLER_LINKS } from '@/lib/navLinks';
import PortalRefresh from '@/components/portal/PortalRefresh';
import { usePortalData } from '@/hooks/usePortalData';
import { loadRecordGroups } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Store, Package, ShoppingBag, Wallet as WalletIcon, TrendingUp, AlertTriangle, Boxes, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useActiveSeller } from '@/lib/seller';
import DashboardNav from '@/components/DashboardNav';
import StatusBadge from '@/components/StatusBadge';
import { formatUsdAmount, formatUSD } from '@/lib/format';

const LOW_STOCK = 5;



export default function SellerPortal() {
  const { t } = useTranslation();
  const { seller, isAdmin, loading: loadingSeller, error: scopeError, reload: reloadScope } = useActiveSeller();
  const { data, loading, error, reload, updatedAt } = usePortalData(['seller-overview', seller?.id], () => loadRecordGroups({
    products: () => base44.entities.Product.filter({ seller_id: seller.id }, '-created_date', 200),
    fulfillments: () => base44.entities.FulfillmentOrder.filter({ seller_id: seller.id }, '-created_date', 50),
    wallets: () => base44.entities.Wallet.filter({ owner_type: 'seller', owner_id: seller.id }),
  }), { enabled: Boolean(seller) });
  const products = data?.products || [];
  const fulfillments = data?.fulfillments || [];
  const wallet = data?.wallets?.[0] || null;

  if (loadingSeller || (seller && loading)) {
    return (
      <div role="status" aria-label={t('portalStatus.loading')} aria-busy="true" className="space-y-3 pb-8">
        <div className="h-9 w-64 animate-pulse rounded-full bg-secondary" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (scopeError) return <PortalStatus retry={reloadScope} />;

  if (!seller) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Store className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 font-semibold">{t('sellerPortal.noShop')}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('sellerPortal.noShopDesc')}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/seller-application" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
            {t('sellerPortal.becomeSeller')}
          </Link>
          {isAdmin && (
            <Link to="/admin/users" className="rounded-full border border-border px-5 py-2 text-sm font-semibold">
              {t('sellerPortal.createShop')}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (error) return <PortalStatus retry={reload} />;

  const revenue = fulfillments.reduce((s, f) => s + (Number(f.subtotal_usd) || 0), 0);
  const toProcess = fulfillments.filter((f) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(f.status));
  const inTransit = fulfillments.filter((f) => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'].includes(f.status));
  const delivered = fulfillments.filter((f) => f.status === 'DELIVERED');
  const published = products.filter((p) => p.status === 'published');
  const lowStock = products.filter((p) => (Number(p.stock) || 0) <= LOW_STOCK);
  const conversion = published.length ? Math.round((delivered.length / published.length) * 100) : 0;

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title={t('sellerPortal.title', { name: seller.name })} links={SELLER_LINKS} />
      <PortalRefresh onRefresh={reload} updatedAt={updatedAt} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: TrendingUp, label: t('sellerPortal.kpiRevenue'), value: formatUSD(revenue) },
          { icon: ShoppingBag, label: t('sellerPortal.kpiToProcess'), value: toProcess.length },
          { icon: Package, label: t('sellerPortal.kpiInTransit'), value: inTransit.length },
          { icon: WalletIcon, label: t('sellerPortal.kpiBalance'), value: formatUsdAmount(wallet?.balance_usd || 0) },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-3.5">
            <k.icon className="h-4 w-4 text-primary" />
            <p className="mt-1.5 text-lg font-bold">{k.value}</p>
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">{t('sellerPortal.perfTitle')}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">{published.length}</p>
            <p className="text-[11px] text-muted-foreground">{t('sellerPortal.onlineProducts', { count: products.length })}</p>
          </div>
          <div>
            <p className="text-lg font-bold">{delivered.length}</p>
            <p className="text-[11px] text-muted-foreground">{t('sellerPortal.deliveredOrders')}</p>
          </div>
          <div>
            <p className="text-lg font-bold">{conversion} %</p>
            <p className="text-[11px] text-muted-foreground">{t('sellerPortal.deliveryRatio')}</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, published.length ? (delivered.length / Math.max(published.length, 1)) * 100 : 0)}%` }}
          />
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="flex items-center justify-between gap-2 text-sm font-bold">
          <span className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" /> {t('sellerPortal.inventory')}
          </span>
          <Link to="/inventory-management" className="text-xs font-semibold text-primary">
            {t('sellerPortal.manageStock')}
          </Link>
        </h2>
        {lowStock.length ? (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {t('sellerPortal.lowStockCount', { count: lowStock.length })}
            </p>
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <span className="truncate text-xs">{p.title}</span>
                <span className={`text-xs font-semibold ${(Number(p.stock) || 0) <= 0 ? 'text-destructive' : 'text-amber-600'}`}>
                  {(Number(p.stock) || 0) <= 0 ? t('sellerPortal.outOfStock') : t('sellerPortal.remaining', { count: p.stock })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('sellerPortal.stockOk')}</p>
        )}
      </section>

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="flex items-center justify-between gap-2 text-sm font-bold">
          <span>{t('sellerPortal.incomingOrders')}</span>
          <Link to="/seller/orders" className="text-xs font-semibold text-primary">
            {t('sellerPortal.viewAll')}
          </Link>
        </h2>
        {fulfillments.length ? (
          fulfillments.slice(0, 6).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{f.order_number}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t('sellerPortal.orderMeta', { num: f.fulfillment_number, count: (f.items || []).length })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={f.status} />
                <span className="text-sm font-semibold">{formatUsdAmount(f.subtotal_usd)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">{t('sellerPortal.noOrders')}</p>
        )}
      </section>

      <section className="grid gap-2 md:grid-cols-2">
        {[
          { to: '/seller/products', label: t('sellerPortal.tileProducts'), icon: Package },
          { to: '/inventory-management', label: t('sellerPortal.tileStock'), icon: Boxes },
          { to: '/seller/orders', label: t('sellerPortal.tileOrders'), icon: ShoppingBag },
          { to: '/seller/wallet', label: t('sellerPortal.tileWallet'), icon: WalletIcon },
        ].map((t) => (
          <Link key={t.to} to={t.to} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5">
            <span className="flex items-center gap-3">
              <t.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t.label}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </section>
    </div>
  );
}