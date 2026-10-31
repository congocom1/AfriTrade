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

export default function ComptoirTrust() {
  const { t } = useTranslation();
  return (
    <section className="k-sec k-sec--tight" aria-label={t('home.assurance')}>
      <div className="k-trust">
        {ITEMS.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to}>
            <Icon aria-hidden="true" />
            {t(label)}
          </Link>
        ))}
      </div>
    </section>
  );
}