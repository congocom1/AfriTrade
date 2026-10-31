import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function OverviewList({ title, href, items, render }) {
  const { t } = useTranslation();
  return <section className="min-w-0 rounded-xl border border-border bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-semibold">{title}</h2>
      <Link to={href} className="text-xs font-semibold text-primary">{t('backoffice.viewAll')}</Link>
    </div>
    {items.length ? <ul className="divide-y divide-border">{items.map(item => <li key={item.id} className="py-2 text-sm">{render(item)}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t('backoffice.noActivity')}</p>}
  </section>;
}
