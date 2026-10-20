import { usePortalData } from '@/hooks/usePortalData';
import { loadRecordGroups } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, ShoppingBag, Wallet as WalletIcon, TrendingUp, Sparkles, Store, Upload, Settings, BarChart3, Boxes, Banknote, CreditCard, FileDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useActiveSeller } from '@/lib/seller';
import { sellerInsights } from '@/lib/ai';
import DashboardShell from '@/components/DashboardShell';
import StatusBadge from '@/components/StatusBadge';
import { Image } from '@/components/ui/image';
import { formatUSD } from '@/lib/format';

const HERO_IMAGE = 'https://media.base44.com/images/public/6ab43a1371d65d1a911b0fe7/5c6b76710_generated_016c1e6f.jpg';

const LINKS = [
  { to: '/seller', key: 'sellerNav.dashboard', end: true },
  { to: '/seller/products', key: 'sellerNav.products' },
  { to: '/seller/orders', key: 'sellerNav.orders' },
  { to: '/seller/import', key: 'seller.import' },
  { to: '/seller/wallet', key: 'sellerNav.wallet' },
  { to: '/seller/settings', key: 'seller.shop' },
];

const TILES = [
  { to: '/seller/products', key: 'seller.tileProducts', icon: Package },
  { to: '/seller/orders', key: 'seller.tileOrders', icon: ShoppingBag },
  { to: '/seller/import', key: 'seller.tileImport', icon: Upload },
  { to: '/seller/wallet', key: 'seller.tileWallet', icon: WalletIcon },
  { to: '/seller/settings', key: 'seller.tileSettings', icon: Settings },
  { to: '/seller-portal', key: 'seller.tilePortal', icon: Store },
  { to: '/inventory-management', key: 'seller.tileInventory', icon: Boxes },
  { to: '/payout-history', key: 'seller.tilePayouts', icon: Banknote },
  { to: '/payout-settings', key: 'seller.tilePayment', icon: CreditCard },
  { to: '/data-export', key: 'seller.tileExport', icon: FileDown },
];

export default function SellerDashboard() {
  const { t } = useTranslation();
  const { sellers, seller, isAdmin, loading: loadingSeller, error: scopeError, reload: reloadScope, selectSeller } = useActiveSeller();
  const { data, loading, error, reload } = usePortalData(['seller-overview', seller?.id], () => loadRecordGroups({
    products: () => base44.entities.Product.filter({ seller_id: seller.id }, '-created_date', 200),
    fulfillments: () => base44.entities.FulfillmentOrder.filter({ seller_id: seller.id }, '-created_date', 50),
    wallets: () => base44.entities.Wallet.filter({ owner_type: 'seller', owner_id: seller.id }),
  }), { enabled: Boolean(seller) });
  const products = data?.products || [];
  const fulfillments = data?.fulfillments || [];
  const wallet = data?.wallets?.[0] || null;
  const [insights, setInsights] = useState([]);
  useEffect(() => {
    let alive = true;
    setInsights([]);
    if (seller) sellerInsights({ sellerId: seller.id }).then((tips) => {
      if (alive) setInsights(tips || []);
    }).catch(() => {});
    return () => { alive = false; };
  }, [seller?.id]);

  if (loadingSeller) {
    return (
      <div className="paper-console">
        <div className="paper-skeleton-block h-40 animate-pulse" />
      </div>
    );
  }

  if (scopeError) return <PortalStatus retry={reloadScope} />;

  if (!seller) {
    return (
      <div className="paper-console">
        <div className="paper-empty">
          <Store className="paper-empty-icon" />
          <p className="paper-empty-title">{t('seller.noShop')}</p>
          <p className="paper-empty-desc">{t('seller.noShopDesc')}</p>
          {isAdmin && (
            <Link to="/admin/users" className="paper-empty-cta">{t('seller.createShop')}</Link>
          )}
        </div>
      </div>
    );
  }

  if (error) return <PortalStatus retry={reload} />;

  const revenue = fulfillments.reduce((s, f) => s + (Number(f.subtotal_usd) || 0), 0);
  const pending = fulfillments.filter((f) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(f.status));
  const published = products.filter((p) => p.status === 'published').length;

  const stats = [
    { icon: Package, key: 'seller.publishedProducts', value: `${published}/${products.length}` },
    { icon: TrendingUp, key: 'seller.revenue', value: formatUSD(revenue) },
    { icon: ShoppingBag, key: 'seller.toProcess', value: pending.length },
    { icon: WalletIcon, key: 'wallet.available', value: formatUSD(wallet?.balance_usd || 0) },
  ];

  return (
    <DashboardShell nav={LINKS} title={t('seller.title')} variant="paper" className="paper-console">
      <div className="paper-hero">
        <Image src={HERO_IMAGE} alt="" />
      </div>

      <div className="paper-shop">
        <span className="paper-shopmark" />
        <strong>{t('seller.managedShop')}</strong>
        {isAdmin ? (
          <select
            value={seller.id}
            onChange={(e) => selectSeller(e.target.value)}
            aria-label={t('seller.managedShop')}
            className="paper-shop-select"
          >
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        ) : (
          <span className="paper-shopname">{seller.name}</span>
        )}
      </div>

      <main className="paper-main">
        <div className="paper-col">
          <section className="paper-section">
            <h2 className="paper-label">{t('seller.overview', { defaultValue: 'Aperçu' })}</h2>
            {loading ? (
              <div role="status" aria-label={t('portalStatus.loading')} aria-busy="true" className="paper-stats">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="paper-stat paper-skeleton-block animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="paper-stats">
                {stats.map((k) => (
                  <div key={k.key} className="paper-stat">
                    <k.icon className="paper-stat-icon" />
                    <p className="paper-value">{k.value}</p>
                    <p className="paper-caption">{t(k.key)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {!!insights.length && (
            <section className="paper-section paper-ai">
              <h2 className="paper-label">
                <Sparkles className="paper-stat-icon" /> {t('seller.aiTips')}
              </h2>
              <ul className="paper-tips">
                {insights.map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="paper-col paper-col-right">
          <section className="paper-section paper-orders">
            <h2 className="paper-label">{t('seller.latestOrders')}</h2>
            {loading ? <p role="status" className="paper-caption">{t('portalStatus.loading')}</p> : fulfillments.length ? (
              <>
                <div className="paper-orderlist">
                  {fulfillments.slice(0, 6).map((f) => (
                    <div key={f.id} className="paper-order">
                      <div className="min-w-0">
                        <div className="paper-orderno">{f.order_number}</div>
                        <div className="paper-meta">
                          {f.fulfillment_number} · {t('seller.itemCount', { count: (f.items || []).length })}
                        </div>
                      </div>
                      <div className="paper-details">
                        <StatusBadge status={f.status} variant="paper" />
                        <span className="paper-money">{formatUSD(f.subtotal_usd)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/seller/orders" className="paper-all">
                  {t('seller.viewAllOrders')}
                </Link>
              </>
            ) : (
              <p className="paper-caption">{t('seller.noOrders')}</p>
            )}
          </section>
        </div>

        <section className="paper-tiles">
          {TILES.map((tile) => (
            <Link key={tile.to} to={tile.to} className="paper-tile">
              <tile.icon className="paper-tile-icon" />
              <span>{t(tile.key)}</span>
            </Link>
          ))}
          {isAdmin && <Link to="/admin" className="paper-tile">
                      <BarChart3 className="paper-tile-icon" />
                      <span>{t('seller.adminView')}</span>
                    </Link>}
        </section>
      </main>
    </DashboardShell>
  );
}