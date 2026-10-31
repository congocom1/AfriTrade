import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { deliveryAlerts } from '@/lib/sellerDashboard';

const TONES = {
  danger: 'bg-destructive-100 text-destructive-900',
  warning: 'bg-warning-100 text-warning-900',
};

export default function DeliveryAlerts({ fulfillments = [], loading }) {
  const { t } = useTranslation();
  const alerts = deliveryAlerts(fulfillments);

  return (
    <section className="paper-section">
      <h2 className="paper-label">{t('seller.deliveryAlerts', { defaultValue: 'Alertes de livraison' })}</h2>
      {loading ? (
        <p role="status" className="paper-caption">{t('portalStatus.loading')}</p>
      ) : alerts.length ? (
        <ul className="paper-orderlist">
          {alerts.map((alert, i) => (
            <li key={`${alert.id}-${i}`} className="paper-order">
              <div className="min-w-0">
                <div className="paper-orderno">{alert.label}</div>
                <div className="paper-meta">
                  {alert.order_number} · {alert.detail}
                </div>
              </div>
              <span className={`paper-badge ${TONES[alert.tone] || TONES.warning}`}>
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="paper-caption">
          <CheckCircle2 className="paper-stat-icon" />{' '}
          {t('seller.noDeliveryAlerts', { defaultValue: 'Aucune alerte : toutes vos livraisons sont à jour.' })}
        </p>
      )}
    </section>
  );
}