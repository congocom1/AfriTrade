import { usePortalData } from '@/hooks/usePortalData';
import { functionData } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { respondToShipment, courierUpdateShipment } from '@/lib/orderService';
import { useTenantScope } from '@/lib/tenant';
import DashboardShell from '@/components/DashboardShell';
import CourierHeader from '@/components/courier/CourierHeader';
import CourierJobCard from '@/components/courier/CourierJobCard';
import CourierTrackingView from '@/components/courier/CourierTrackingView';
import CourierEarnings from '@/components/courier/CourierEarnings';

const TERMINAL = ['DELIVERED', 'FAILED', 'RETURNED', 'CANCELLED'];

export default function CourierConsole() {
  const { t } = useTranslation();
  const { tenants: couriers, tenant: courier, isAdmin, loading: loadingCourier, selectTenant, error: scopeError, reload: reloadScope } = useTenantScope('Courier');
  const [user, setUser] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [fulfillments, setFulfillments] = useState({});
  const [orders, setOrders] = useState({});
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('offers');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  // A courier may work for several fleets: their console covers every fleet they
  // are bound to, an admin inspects one fleet at a time through the switcher.
  const fleets = useMemo(
    () => (isAdmin ? (courier ? [courier] : []) : couriers),
    [isAdmin, courier, couriers],
  );
  const fleetNames = useMemo(() => fleets.map((f) => f.name).filter(Boolean), [fleets]);
  const fleetKey = fleets.map((f) => f.id).join(',');

  const { data, loading, error: loadError, reload } = usePortalData(['courier', fleetKey], async () => {
    const names = fleetNames;
    if (!names.length) return { ships: [], fulfillments: {}, orders: {}, wallet: null, transactions: [] };
      const [shipGroups, foGroups, allOrders, walletGroups] = await Promise.all([
        Promise.all(names.map((n) => base44.entities.Shipment.filter({ courier_name: n }, '-created_date', 100))),
        Promise.all(names.map((n) => base44.entities.FulfillmentOrder.filter({ courier_name: n }, '-created_date', 100))),
        base44.functions
          .invoke('deliveryDesk', { action: 'orders', courier_names: names })
          .then((r) => { const payload = functionData(r); if (!Array.isArray(payload.orders)) throw new Error('Invalid orders'); return payload.orders; })
          ,
        Promise.all(names.map((n) => base44.entities.Wallet.filter({ owner_type: 'courier', owner_name: n }))),
      ]);

    const wallets = walletGroups.flat();
    const txGroups = await Promise.all(wallets.map((wallet) => base44.entities.WalletTransaction.filter({ wallet_id: wallet.id, status: { $ne: 'preparing' } }, '-created_date', 20)));
    return {
      ships: shipGroups.flat().sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || ''))),
      fulfillments: Object.fromEntries(foGroups.flat().map((row) => [row.id, row])),
      orders: Object.fromEntries(allOrders.map((order) => [order.order_number, order])),
      wallet: wallets.length ? {
        balance_usd: wallets.reduce((sum, wallet) => sum + (Number(wallet.balance_usd) || 0), 0),
        lifetime_credit_usd: wallets.reduce((sum, wallet) => sum + (Number(wallet.lifetime_credit_usd) || 0), 0),
      } : null,
      transactions: txGroups.flat().sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || ''))).slice(0, 20),
    };
  }, { enabled: !loadingCourier && !scopeError });
  useEffect(() => {
    setShipments(data?.ships || []); setFulfillments(data?.fulfillments || {}); setOrders(data?.orders || {});
    setWallet(data?.wallet || null); setTransactions(data?.transactions || []);
  }, [data]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const pickCourier = (id) => selectTenant(id);

  const buckets = useMemo(
    () => ({
      offers: shipments.filter(
        (s) => s.courier_response !== 'accepted' && s.courier_response !== 'declined' && !TERMINAL.includes(s.status),
      ),
      active: shipments.filter((s) => s.courier_response === 'accepted' && !TERMINAL.includes(s.status)),
      done: shipments.filter((s) => TERMINAL.includes(s.status)),
    }),
    [shipments],
  );

  const respond = async (shipment, accepted) => {
    setBusy(shipment.id);
    setError('');
    try {
      const updated = await respondToShipment({ shipment, accepted });
      setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (accepted) setTab('active');
      return true;
    } catch {
      setError(t('courierConsole.actionFailed'));
      return false;
    } finally {
      setBusy('');
    }
  };

  const advance = async (shipment, status, label, extra) => {
    setBusy(shipment.id);
    setError('');
    try {
      await courierUpdateShipment({
        shipment,
        fulfillment: fulfillments[shipment.fulfillment_order_id],
        status,
        label,
        extra,
      });
      await reload();
      return true;
    } catch {
      setError(t('courierConsole.actionFailed'));
      return false;
    } finally {
      setBusy('');
    }
  };

  const TABS = [
    { id: 'offers', label: t('courierConsole.tabOffers', { count: buckets.offers.length }) },
    { id: 'active', label: t('courierConsole.tabActive', { count: buckets.active.length }) },
    { id: 'tracking', label: t('courierConsole.tabTracking', { count: buckets.active.length }) },
    { id: 'done', label: t('courierConsole.tabDone', { count: buckets.done.length }) },
  ];

  const visible = buckets[tab];

  if (scopeError || loadError) return <DashboardShell nav={[]} title={t('courierConsole.title')}><PortalStatus retry={scopeError ? reloadScope : reload} /></DashboardShell>;

  return (
    <DashboardShell nav={[]} title={t('courierConsole.title')}>
      <>
        {!loadingCourier && (
          <CourierHeader
            user={user}
            fleets={fleets}
            activeFleet={isAdmin ? courier : fleets[0] || null}
            isAdmin={isAdmin}
            couriers={couriers}
            onSelectFleet={pickCourier}
          />
        )}

        <CourierEarnings wallet={wallet} transactions={transactions} />

        <div className="flex flex-wrap gap-2">
          {TABS.map((tx) => (
            <button
              key={tx.id}
              type="button"
              aria-pressed={tab === tx.id}
              onClick={() => setTab(tx.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                tab === tx.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              }`}
            >
              {tx.label}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive bg-card p-3 text-xs font-medium text-destructive">{error}</p>
        )}

        {loading || loadingCourier ? (
          <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
        ) : !courier ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
{t('courierConsole.noFleet')}
          </p>
        ) : tab === 'tracking' ? (
          <CourierTrackingView
            shipments={buckets.active}
            fulfillments={fulfillments}
            orders={orders}
            busy={busy}
            showFleet={fleets.length > 1}
            onAdvance={advance}
          />
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
            {tab === 'offers'
              ? t('courierConsole.emptyOffers')
              : tab === 'active'
                ? t('courierConsole.emptyActive')
                : t('courierConsole.emptyDone')}
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((s) => (
              <CourierJobCard
                key={s.id}
                shipment={s}
                fulfillment={fulfillments[s.fulfillment_order_id]}
                order={orders[s.order_number]}
                busy={busy}
                showFleet={fleets.length > 1}
                onRespond={respond}
                onAdvance={advance}
              />
            ))}
          </div>
        )}
      </>
    </DashboardShell>
  );
}