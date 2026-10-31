import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, PackageCheck } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { relayPointDeposits } from '@/lib/sellerDashboard';

export default function RelayPointDeposits({ fulfillments = [], loading }) {
  const { t } = useTranslation();
  const deposits = relayPointDeposits(fulfillments);

  return (
    <section className="paper-section">
      <h2 className="paper-label">{t('seller.relayDeposits', { defaultValue: 'Dépôts en point relais' })}</h2>
      {loading ? (
        <p role="status" className="paper-caption">{t('portalStatus.loading')}</p>
      ) : (
        <>
          <div className="paper-stats">
            <div className="paper-stat">
              <MapPin className="paper-stat-icon" />
              <p className="paper-value">{deposits.waitingCount}</p>
              <p className="paper-caption">{t('seller.awaitingPickup', { defaultValue: 'En attente au point relais' })}</p>
            </div>
            <div className="paper-stat">
              <PackageCheck className="paper-stat-icon" />
              <p className="paper-value">{deposits.collectedCount}</p>
              <p className="paper-caption">{t('seller.collectedPickup', { defaultValue: 'Retirés par le client' })}</p>
            </div>
          </div>

          {deposits.waiting.length ? (
            <div className="paper-orderlist">
              {deposits.waiting.map((f) => (
                <div key={f.id} className="paper-order">
                  <div className="min-w-0">
                    <div className="paper-orderno">{f.order_number}</div>
                    <div className="paper-meta">
                      {f.fulfillment_number} ·{' '}
                      {t('seller.waitingDays', { count: f.daysWaiting, defaultValue: 'En attente depuis {{count}} j' })}
                    </div>
                  </div>
                  <div className="paper-details">
                    <StatusBadge status="READY_FOR_PICKUP" variant="paper" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="paper-caption">
              {t('seller.noRelayDeposits', { defaultValue: 'Aucun colis en attente au point relais.' })}
            </p>
          )}
        </>
      )}
    </section>
  );
}