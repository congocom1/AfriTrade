import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatUsdAmount, formatDateTime } from '@/lib/format';

/** One Mobile Money order line: who paid, how much, and where the payment stands. */
export default function MobileMoneyOrderRow({ order, onVerify, busy }) {
  const unsettled = order.payment_status === 'PENDING' || order.payment_status === 'AUTHORIZED';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0">
        <p className="text-sm font-bold">{order.order_number}</p>
        <p className="text-[11px] text-muted-foreground">
          {order.customer_name || '—'} · {order.payment_phone || order.customer_phone || '—'} · {formatDateTime(order.created_date)}
        </p>
        {order.payment_reference && (
          <p className="text-[11px] text-muted-foreground">Référence : {order.payment_reference}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={order.payment_status} />
        <span className="text-sm font-bold">{formatUsdAmount(order.total_usd)}</span>
        {unsettled && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onVerify(order)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Vérifier
          </button>
        )}
      </div>
    </div>
  );
}