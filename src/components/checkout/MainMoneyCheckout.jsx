import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { createCheckout, mountCheckout } from '@mainmoneyapp/js-checkout';
import '@mainmoneyapp/js-checkout/styles.css';
import { POLL_URL, createMainMoneySession, verifyMainMoneyOrder } from '@/lib/mainmoney/client';

/** Mobile money payment panel: the MainMoney wizard, bound to the placed order. */
export default function MainMoneyCheckout({ order, onPaid, onClose }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef(null);
  const paidRef = useRef(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !order) return undefined;

    const session = createMainMoneySession({ locale: i18n.language === 'en' ? 'en' : 'fr' });
    const checkout = createCheckout(session, {
      operation: 'deposit',
      amount: Number(order.total_usd || 0).toFixed(2),
      currency: 'USD',
      reference: order.order_number,
      customerEmail: order.customer_email || '',
      pollStatus: true,
      pollUrl: POLL_URL,
      pollHeaders: {},
    });

    const unmount = mountCheckout(element, checkout, { layout: 'form', defaultCountry: 'CD' });

    const unsubscribe = checkout.subscribe(async (state) => {
      const status = String(state.status?.status || '').toUpperCase();
      if (state.step !== 'terminal' || status !== 'SUCCESS' || paidRef.current) return;
      paidRef.current = true;
      setVerifying(true);
      setError('');
      try {
        const result = await verifyMainMoneyOrder(order.order_number);
        if (result?.paid) {
          onPaidRef.current?.(order);
          return;
        }
        setError(t('pay.mainmoneyUnconfirmed'));
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || t('pay.mainmoneyUnconfirmed'));
      } finally {
        setVerifying(false);
      }
    });

    checkout.loadCountries().catch(() => {});

    return () => {
      unsubscribe();
      unmount();
      checkout.close();
    };
  }, [order?.order_number, i18n.language, t]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-3 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">{t('pay.mainmoneyTitle')}</h2>
            <p className="text-[11px] text-muted-foreground">
              {order?.order_number} · {Number(order?.total_usd || 0).toFixed(2)} USD
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('pay.mainmoneyClose')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div ref={containerRef} />
          {verifying && (
            <p role="status" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('pay.mainmoneyVerifying')}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <p className="flex items-center gap-1.5 border-t border-border p-3 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {t('pay.mainmoneySecure')}
        </p>
      </div>
    </div>
  );
}