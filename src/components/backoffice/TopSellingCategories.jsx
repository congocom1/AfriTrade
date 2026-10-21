import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatUSD } from '@/lib/format';

export default function TopSellingCategories({ categories }) {
  const { t } = useTranslation();
  const largest = categories[0]?.units || 0;
  return <section className="min-w-0 rounded-2xl border border-border bg-card p-4">
    <h2 className="text-sm font-bold">{t('backoffice.topCategoriesTitle')}</h2>
    <p className="mt-1 text-xs text-muted-foreground">{t('backoffice.topCategoriesSub')}</p>
    {categories.length ? <ol className="mt-4 space-y-4">
      {categories.map((category, index) => <li key={category.name}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="min-w-0 truncate font-medium">{index + 1}. {category.name}</span>
          <span className="shrink-0 font-semibold">{t('backoffice.topCategoriesUnits', { count: category.units })}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${largest ? category.units / largest * 100 : 0}%` }} /></div>
        <p className="mt-1 text-xs text-muted-foreground">{t('backoffice.topCategoriesRevenue', { amount: formatUSD(category.revenue) })}</p>
      </li>)}
    </ol> : <p className="mt-6 text-sm text-muted-foreground">{t('backoffice.topCategoriesEmpty')}</p>}
  </section>;
}
