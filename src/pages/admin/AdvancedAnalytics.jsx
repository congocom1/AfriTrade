import { usePortalData } from '@/hooks/usePortalData';
import { functionData } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import PortalRefresh from '@/components/portal/PortalRefresh';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, DollarSign, Users, Package } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { formatUsdAmount } from '@/lib/format';

export default function AdvancedAnalytics() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState(30);
  const { data, loading, error, reload, updatedAt } = usePortalData(['advanced-analytics', period], async () => {
    const [dashboard, funnel, cohort, revenue] = await Promise.all([
      ['dashboard', period], ['conversion-funnel', period], ['cohort', period * 3], ['revenue', period],
    ].map(async ([action, days]) => functionData(await base44.functions.invoke('advancedAnalytics', { action, days }))));
    if (!Array.isArray(funnel.funnel) || !Array.isArray(cohort.cohort) || !revenue.revenue_by_status || typeof dashboard.total_orders !== 'number') throw new Error('Invalid analytics response');
    return { dashboard, funnel, cohort, revenue };
  });
  if (loading || error) return <div className="space-y-5"><DashboardNav title={t('analytics.title', 'Analytics')} links={ADMIN_LINKS} /><PortalStatus loading={loading} retry={reload} /></div>;

  const d = data?.dashboard || {};
  const f = data?.funnel?.funnel || [];
  const r = data?.revenue?.revenue_by_status || {};
  const c = data?.cohort?.cohort || [];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 md:px-6">
      <DashboardNav title={t('analytics.title', 'Analytics avancée')} links={ADMIN_LINKS} />

      <PortalRefresh onRefresh={reload} updatedAt={updatedAt} />
      <p className="text-xs text-muted-foreground">{t('portalComponents.recordScope')}</p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: ShoppingCart, label: 'Commandes', value: d.total_orders, color: 'text-blue-600' },
          { icon: DollarSign, label: 'Revenus', value: formatUsdAmount(d.total_revenue), color: 'text-emerald-600' },
          { icon: Users, label: 'Clients', value: d.new_customers, color: 'text-purple-600' },
          { icon: Package, label: 'Produits', value: d.total_products, color: 'text-amber-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <k.icon className={`h-5 w-5 ${k.color}`} />
            <p className="mt-2 text-2xl font-bold">{k.value}</p>
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-bold">{t('analytics.funnel', 'Entonnoir de conversion')}</h3>
        <div className="space-y-2">
          {f.map((step) => (
            <div key={step.step} className="flex items-center gap-3">
              <span className="w-24 text-xs text-muted-foreground">{step.step}</span>
              <div className="flex-1 rounded-full bg-secondary h-4 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${step.rate}%` }} />
              </div>
              <span className="w-16 text-right text-xs font-semibold">{step.count} ({step.rate}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold">{t('analytics.revenue', 'Revenus par statut')}</h3>
          <div className="space-y-2">
            {Object.entries(r).map(([status, amount]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="capitalize text-muted-foreground">{status}</span>
                <span className="font-semibold">{formatUsdAmount(Number(amount) || 0)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-bold">{t('analytics.cohort', 'Cohortes (mois)')}</h3>
          <div className="space-y-2">
            {c.slice(-6).map((coh) => (
              <div key={coh.month} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{coh.month}</span>
                <span className="font-semibold">{coh.count} commandes · {formatUsdAmount(coh.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {[7, 14, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => setPeriod(d)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${period === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{d}j</button>
        ))}
      </div>
    </div>
  );
}
