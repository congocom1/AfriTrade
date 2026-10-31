import React, { useEffect, useState } from 'react';
import { Banknote, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { formatUSD, formatDateTime } from '@/lib/format';
import { useTranslation } from 'react-i18next';
import { notifyLoadError } from '@/lib/safeList';

const TAB_IDS = ['pending', 'posted', 'reversed'];

export default function AdminPayouts() {
  const { t } = useTranslation();
  const TABS = TAB_IDS.map((id) => ({ id, label: t(`adminPayouts.tab_${id}`) }));
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [message, setMessage] = useState('');

  const load = async () => {
    const rows = await base44.entities.WalletTransaction.filter(
      { type: 'PAYOUT', direction: 'debit', status: { $ne: 'preparing' } },
      '-created_date',
      100,
    ).catch(notifyLoadError);
    setRequests(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const settle = async (tx, approve) => {
    setMessage('');
    try {
      await base44.functions.invoke('settle-wallet-payout', { transactionId: tx.id, approve });
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Décision indisponible. Réessayez la même action.');
      return;
    }

    setMessage(
      approve
        ? t('adminPayouts.paidMsg', { amount: formatUSD(Math.round(Number(tx.amount_usd) * 100)), owner: tx.owner_name })
        : t('adminPayouts.rejectedMsg', { amount: formatUSD(Math.round(Number(tx.amount_usd) * 100)) }),
    );
    await load();
  };

  const visible = requests.filter((r) => r.status === tab);
  const pendingTotalCents = requests
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + (Math.round(Number(r.amount_usd) * 100)), 0);

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-secondary" />;

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title={t('adminPayouts.title')} links={ADMIN_LINKS} />

      <section className="rounded-2xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Banknote className="h-4 w-4 text-primary" /> {t('adminPayouts.pendingTitle')}
        </p>
        <p className="mt-1 text-2xl font-black">{formatUSD(pendingTotalCents)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t('adminPayouts.description')}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tx) => (
          <button
            key={tx.id}
            type="button"
            onClick={() => setTab(tx.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === tx.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            {tx.label} ({requests.filter((r) => r.status === tx.id).length})
          </button>
        ))}
      </div>

      {message && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}

      <div className="space-y-2.5">
        {visible.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{r.owner_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {r.owner_type} · {r.reference || '—'} · {formatDateTime(r.created_date)}
                </p>
                <p className="text-[11px] text-muted-foreground">{r.description}</p>
              </div>
              <span className="text-sm font-bold">{formatUSD(Math.round(Number(r.amount_usd) * 100))}</span>
            </div>

            {r.status === 'pending' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => settle(r, true)}
                  className="flex items-center gap-1 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-900"
                >
                  <Check className="h-3.5 w-3.5" /> {t('adminPayouts.markPaid')}
                </button>
                <button
                  type="button"
                  onClick={() => settle(r, false)}
                  className="flex items-center gap-1 rounded-full bg-red-100 px-3.5 py-1.5 text-xs font-semibold text-red-900"
                >
                  <X className="h-3.5 w-3.5" /> {t('adminPayouts.reject')}
                </button>
              </div>
            )}
          </div>
        ))}
        {!visible.length && (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
            {t('adminPayouts.empty')}
          </p>
        )}
      </div>
    </div>
  );
}