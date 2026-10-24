import React from 'react';
import { useTranslation } from 'react-i18next';
import { HEALTH_LABELS } from '@/lib/platformHealth';

const DOT = {
  ok: 'bg-success-500',
  degraded: 'bg-warning-500',
  down: 'bg-destructive-500',
  unknown: 'bg-muted-foreground/40',
};

const PILL = {
  ok: 'bg-success-100 text-success-900',
  degraded: 'bg-warning-100 text-warning-900',
  down: 'bg-destructive-100 text-destructive-900',
  unknown: 'bg-muted text-muted-foreground',
};

/** One monitored service, gateway or logistics partner. */
export default function ServiceStatusRow({ name, detail, meta, status = 'unknown', right }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[status] || DOT.unknown}`} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-[11px] text-muted-foreground">{detail}</p>
          {meta ? <p className="text-[11px] text-muted-foreground">{meta}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right}
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PILL[status] || PILL.unknown}`}>
          {t(HEALTH_LABELS[status] || 'healthStatus.unknown')}
        </span>
      </div>
    </div>
  );
}