import React from 'react';
import { formatUsdAmount } from '@/lib/format';

/**
 * Headline figures for the MainMoney payments dashboard.
 * Totals come from server-side aggregates, not from the visible list.
 */
export default function MobileMoneyStats({ collectedUsd, paidCount, pendingCount, failedCount }) {
  const cards = [
    { label: 'Total encaissé', value: formatUsdAmount(collectedUsd), tone: 'text-primary' },
    { label: 'Commandes payées', value: paidCount, tone: 'text-success-900' },
    { label: 'En attente', value: pendingCount, tone: 'text-warning-900' },
    { label: 'Échecs', value: failedCount, tone: 'text-destructive-900' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className={`mt-1 text-2xl font-black tracking-tight ${card.tone}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}