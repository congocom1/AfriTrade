import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CalendarSyncList from '@/components/calendar/CalendarSyncList';

/** Workspace connector "AfriTrade Agenda" (Google Calendar, per app user). */
const CONNECTOR_ID = '6add60dbed5c9817315dc9f6';

export default function CalendarSyncCard() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [failed, setFailed] = useState(false);
  const [created, setCreated] = useState(null);

  // One call both checks the connection and loads the data.
  const fetchData = async () => {
    try {
      const res = await base44.functions.invoke('deliveryCalendar', { action: 'status' });
      setConnected(Boolean(res.data?.connected));
      setItems(res.data?.items || []);
      setFailed(false);
    } catch {
      setConnected(false);
      setItems([]);
      setFailed(true);
    }
  };

  useEffect(() => {
    (async () => {
      const authed = await base44.auth.isAuthenticated();
      if (authed) {
        setUser(await base44.auth.me());
        await fetchData();
      }
      setLoading(false);
    })();
  }, []);

  // Google's consent screen opens in a new tab: refresh as soon as it closes.
  const connect = async () => {
    setBusy('connect');
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          fetchData();
          setBusy('');
        }
      }, 600);
    } catch {
      setFailed(true);
      setBusy('');
    }
  };

  const disconnect = async () => {
    setBusy('disconnect');
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setItems([]);
      setCreated(null);
    } finally {
      setBusy('');
    }
  };

  const sync = async () => {
    setBusy('sync');
    setCreated(null);
    try {
      const res = await base44.functions.invoke('deliveryCalendar', { action: 'sync' });
      setConnected(Boolean(res.data?.connected));
      setItems(res.data?.items || []);
      setCreated(res.data?.created ?? 0);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <CalendarDays className="h-4 w-4" /> {t('deliveryCalendar.title')}
          </h2>
          <p className="mt-1 max-w-prose text-[11px] text-muted-foreground">{t('deliveryCalendar.subtitle')}</p>
        </div>
        {connected && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-900">
            {t('deliveryCalendar.connected')}
          </span>
        )}
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('deliveryCalendar.connecting')}
        </p>
      ) : !user ? (
        <button
          type="button"
          onClick={() => base44.auth.redirectToLogin()}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          {t('deliveryCalendar.login')}
        </button>
      ) : !connected ? (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={connect}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy === 'connect' ? t('deliveryCalendar.connecting') : t('deliveryCalendar.connect')}
          </button>
          <p className="text-[11px] text-muted-foreground">{t('deliveryCalendar.hint')}</p>
          {failed && <p role="alert" className="text-[11px] text-destructive">{t('deliveryCalendar.failed')}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={sync}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy === 'sync' ? 'animate-spin' : ''}`} />
              {busy === 'sync' ? t('deliveryCalendar.syncing') : t('deliveryCalendar.sync')}
            </button>
            <a
              href="https://calendar.google.com/calendar/u/0/r"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {t('deliveryCalendar.openCalendar')}
            </a>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={disconnect}
              className="rounded-full px-2 py-2 text-xs font-semibold text-muted-foreground underline disabled:opacity-50"
            >
              {t('deliveryCalendar.disconnect')}
            </button>
          </div>

          {created !== null && <p className="text-[11px] text-emerald-700">{t('deliveryCalendar.created', { count: created })}</p>}
          {failed && <p role="alert" className="text-[11px] text-destructive">{t('deliveryCalendar.failed')}</p>}

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('deliveryCalendar.upcoming')}
            </p>
            <CalendarSyncList items={items} />
          </div>
        </div>
      )}
    </section>
  );
}