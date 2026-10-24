import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Headphones, MapPin, ShieldCheck, Truck } from 'lucide-react';

// The four promises a marketplace has to make on the first screen. Each one
// links to the page that already explains it, so nothing is claimed that the
// app cannot show.
const ITEMS = [
  { icon: ShieldCheck, label: 'footer.protection', to: '/buyer-protection' },
  { icon: Truck, label: 'footer.tracking', to: '/order-tracking' },
  { icon: MapPin, label: 'footer.pickup', to: '/pickup-points' },
  { icon: Headphones, label: 'footer.help', to: '/help-center' },
];

export default function AssuranceStrip() {
  const { t } = useTranslation();
  return (
    <section
      aria-label={t('home.assurance')}
      className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
    >
      {ITEMS.map(({ icon: Icon, label, to }) => (
        <Link key={to} to={to} className="flex min-h-16 items-center gap-3 bg-card px-4 py-3.5 transition-colors hover:bg-accent">
          <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold">{t(label)}</span>
        </Link>
      ))}
    </section>
  );
}