import PortalRefresh from '@/components/portal/PortalRefresh';
import React from 'react';
import { usePortalData } from '@/hooks/usePortalData';
import PortalStatus from '@/components/PortalStatus';
import { Link } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import StatCard from '@/components/ops/StatCard';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { formatUsdAmount } from '@/lib/format';
import { loadCommandCenter } from '@/lib/commandCenter';
import { useTranslation } from 'react-i18next';

const Section = ({ title, to, children }) => {
  const { t } = useTranslation();
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{title}</h2>
        {to && <Link to={to} className="text-[11px] font-semibold underline">{t('commandCenter.open')}</Link>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
    </section>
  );
};
const bad = (n) => (n > 0 ? 'bad' : 'good');

export default function CommandCenter() {
  const { t, i18n } = useTranslation();
  const { data: d, loading, error, reload, updatedAt } = usePortalData(['command-center'], loadCommandCenter, { refreshInterval: 60_000 });
  const at = updatedAt ? new Date(updatedAt) : null;

  return (
    <div className="portal-page space-y-6 pb-8">
      <DashboardNav title={t('commandCenter.title')} links={ADMIN_LINKS} />
      <PortalRefresh onRefresh={reload} updatedAt={updatedAt} />
      <p className="text-[11px] text-muted-foreground">{at ? t('commandCenter.fresh', { time: at.toLocaleTimeString(i18n.language) }) : t('commandCenter.loading')}</p>
      {loading || error || !d ? <PortalStatus loading={loading} retry={reload} /> : (
        <>
          <Section title={t('commandCenter.commerce')} to="/admin/orders">
            <StatCard label={t('commandCenter.ordersToday')} value={d.commerce.ordersToday} />
            <StatCard label={t('commandCenter.gmvToday')} value={formatUsdAmount(d.commerce.gmvToday)} />
            <StatCard label={t('commandCenter.revenueToday')} value={formatUsdAmount(d.commerce.revenueToday)} />
            <StatCard label={t('commandCenter.activeCustomers')} value={d.commerce.activeCustomers} />
          </Section>
          <Section title={t('commandCenter.finance')} to="/payout-ledger">
            <StatCard label={t('commandCenter.paymentsToday')} value={d.finance.paymentsToday} />
            <StatCard label={t('commandCenter.failedPayments')} value={d.finance.failedPayments} tone={bad(d.finance.failedPayments)} />
            <StatCard label={t('commandCenter.refunds')} value={d.finance.refunds} />
            <StatCard label={t('commandCenter.mrr')} value={formatUsdAmount(d.finance.mrr)} />
          </Section>
          <Section title={t('commandCenter.logistics')} to="/delivery-map">
            <StatCard label={t('commandCenter.inTransit')} value={d.logistics.inTransit} />
            <StatCard label={t('commandCenter.deliveredToday')} value={d.logistics.deliveredToday} tone="good" />
            <StatCard label={t('commandCenter.failedDeliveries')} value={d.logistics.failedDeliveries} tone={bad(d.logistics.failedDeliveries)} />
            <StatCard label={t('commandCenter.openReturns')} value={d.logistics.openReturns} />
          </Section>
          <Section title={t('commandCenter.network')}>
            <StatCard label={t('commandCenter.sellers')} value={d.network.sellers} />
            <StatCard label={t('commandCenter.creators')} value={d.network.creators} />
            <StatCard label={t('commandCenter.suppliers')} value={d.network.suppliers} />
            <StatCard label={t('commandCenter.subscriptions')} value={d.network.subscriptions} />
          </Section>
          <Section title={t('commandCenter.risk')} to="/platform-health">
            <StatCard label={t('commandCenter.fraud')} value={d.risk.fraud} tone={bad(d.risk.fraud)} />
            <StatCard label={t('commandCenter.supportBacklog')} value={d.risk.supportBacklog} tone={d.risk.supportBacklog ? 'warning' : 'good'} />
            <StatCard label={t('commandCenter.failedSyncs')} value={d.risk.failedSyncs} tone={bad(d.risk.failedSyncs)} />
            <StatCard label={t('commandCenter.failedJobs')} value={d.risk.failedJobs} tone={bad(d.risk.failedJobs)} />
          </Section>
        </>
      )}
    </div>
  );
}