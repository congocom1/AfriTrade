import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, TrendingUp } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatUsdAmount } from '@/lib/format';
import { salesOverview } from '@/lib/sellerDashboard';

export default function SellerSalesOverview({ fulfillments = [], loading }) {
  const { t } = useTranslation();
  const sales = salesOverview(fulfillments);

  return (
    <section className="paper-section paper-orders">
      <h2 className="paper-label">{t('seller.recentSales', { defaultValue: 'Ventes récentes' })}</h2>
      {loading ? (
        <p role="status" className="paper-caption">{t('portalStatus.loading')}</p>
      ) : (
        <>
          <div className="paper-stats">
            <div className="paper-stat">
              <TrendingUp className="paper-stat-icon" />
              <p className="paper-value">{formatUsdAmount(sales.revenue)}</p>
              <p className="paper-caption">
                {t('seller.salesWindow', { count: sales.days, defaultValue: 'Ventes sur {{count}} jours' })}
              </p>
            </div>
            <div className="paper-stat">
              <ShoppingBag className="paper-stat-icon" />
              <p className="paper-value">{sales.count}</p>
              <p className="paper-caption">
                {t('seller.ordersWindow', { count: sales.days, defaultValue: 'Commandes sur {{count}} jours' })}
              </p>
            </div>
          </div>

          {sales.rows.length ? (
            <>
              <div className="paper-orderlist">
                {sales.rows.map((f) => (
                  <div key={f.id} className="paper-order">
                    <div className="min-w-0">
                      <div className="paper-orderno">{f.order_number}</div>
                      <div className="paper-meta">
                        {f.fulfillment_number} · {formatDate(f.created_date)}
                      </div>
                    </div>
                    <div className="paper-details">
                      <StatusBadge status={f.status} variant="paper" />
                      <span className="paper-money">{formatUsdAmount(f.subtotal_usd)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/seller/orders" className="paper-all">{t('seller.viewAllOrders')}</Link>
            </>
          ) : (
            <p className="paper-caption">{t('seller.noOrders')}</p>
          )}
        </>
      )}
    </section>
  );
}