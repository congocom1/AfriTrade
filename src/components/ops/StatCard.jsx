import React from 'react';

/** Small KPI tile shared by the operations dashboards. */
const TONES = {
  default: 'border-t-border',
  good: 'border-t-primary',
  warn: 'border-t-amber-600 dark:border-t-amber-400',
  bad: 'border-t-destructive',
};

export default function StatCard({ label, value, hint, tone = 'default' }) {
  return (
    <div className={`rounded-lg border border-border border-t-2 bg-card p-5 ${TONES[tone] || TONES.default}`}>
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-3xl font-semibold leading-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}