import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Truck } from 'lucide-react';

/** The upcoming deliveries and relay-point appointments a sync would push. */
export default function CalendarSyncList({ items }) {
  const { t } = useTranslation();
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">{t('deliveryCalendar.empty')}</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
          {item.type === 'pickup'
            ? <CalendarCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            : <Truck className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{item.title}</span>
            <span className="block text-[11px] text-muted-foreground">{item.date}</span>
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            item.synced ? 'bg-emerald-100 text-emerald-900' : 'bg-secondary text-muted-foreground'
          }`}>
            {item.synced ? t('deliveryCalendar.synced') : t('deliveryCalendar.pending')}
          </span>
        </li>
      ))}
    </ul>
  );
}