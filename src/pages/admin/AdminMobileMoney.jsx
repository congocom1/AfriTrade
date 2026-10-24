import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import MobileMoneyStats from '@/components/payments/MobileMoneyStats';
import MobileMoneyOrderRow from '@/components/payments/MobileMoneyOrderRow';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { notifyLoadError } from '@/lib/safeList';

const EMPTY_TOTALS = { collectedUsd: 0, paidCount: 0, pendingCount: 0, failedCount: 0 };

/** Live view of every order paid through the MainMoney aggregator. */
export default function AdminMobileMoney() {
  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const [page, paid, pending, failed] = await Promise.all([
      base44.entities.Order.filter({ payment_method: 'mainmoney' }, { sort: '-created_date', limit: 100 }),
      base44.entities.Order.aggregate({ query: { payment_method: 'mainmoney', payment_status: 'PAID' }, sum: ['total_usd'] }),
      base44.entities.Order.aggregate({ query: { payment_method: 'mainmoney', payment_status: 'PENDING' } }),
      base44.entities.Order.aggregate({ query: { payment_method: 'mainmoney', payment_status: 'FAILED' } }),
    ]);
    const paidRow = paid?.rows?.[0] || {};
    const pendingRow = pending?.rows?.[0] || {};
    const failedRow = failed?.rows?.[0] || {};
    setOrders(page?.items || []);
    setTotals({
      collectedUsd: Number(paidRow.sum_total_usd || 0),
      paidCount: Number(paidRow.count || 0),
      pendingCount: Number(pendingRow.count || 0),
      failedCount: Number(failedRow.count || 0),
    });
  }, []);

  useEffect(() => {
    load().catch(notifyLoadError).finally(() => setLoading(false));
  }, [load]);

  // Real time: any order created or updated anywhere refreshes the figures.
  useEffect(() => base44.entities.Order.subscribe(() => { load().catch(() => {}); }), [load]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const verify = async (order) => {
    setBusyId(order.id);
    setMessage('');
    try {
      const res = await base44.functions.invoke('mainmoney', {
        route: 'verifyOrder',
        body: { order_number: order.order_number },
      });
      setMessage(res?.data?.paid
        ? `Commande ${order.order_number} confirmée payée.`
        : `Commande ${order.order_number} : paiement toujours en attente.`);
      await load();
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-secondary" />;

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title="Paiements Mobile Money" links={ADMIN_LINKS} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Suivi en direct des encaissements MainMoney · mise à jour automatique
        </p>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Actualiser
        </button>
      </div>

      <MobileMoneyStats {...totals} />

      {message && <p className="text-xs font-semibold text-primary">{message}</p>}

      <div className="space-y-2.5">
        {orders.map((order) => (
          <MobileMoneyOrderRow
            key={order.id}
            order={order}
            busy={busyId === order.id}
            onVerify={verify}
          />
        ))}
        {!orders.length && (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
            Aucun paiement Mobile Money pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}