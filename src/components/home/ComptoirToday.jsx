import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '@/components/ProductCard';

// What the city is buying today: one lead item, the runners-up beside it, and
// the rest of the list alongside rather than hidden.
export default function ComptoirToday({ products = [], loading = false, updatedLabel }) {
  const { t } = useTranslation();

  const lead = products[0];
  const runners = products.slice(1, 3);
  const rest = products.slice(3, 8);

  return (
    <section className="k-sec" aria-labelledby="comptoir-today">
      <div className="k-sh">
        <div>
          <p className="k-cap k-accent-text k-eyebrow">{t('market.todayKinshasa')}</p>
          <h2 id="comptoir-today" className="k-serif">{t('home.trending')}</h2>
          {updatedLabel && <p className="k-upd">{updatedLabel}</p>}
        </div>
        <Link to="/search?sort=sold" className="k-sh__all">{t('common.seeAll')}</Link>
      </div>

      {loading ? (
        <div className="k-today">
          <div className="k-today__big h-64 animate-pulse rounded-[3px] bg-[var(--k-line)]" />
          <div className="k-today__side">
            <div className="animate-pulse rounded-[3px] bg-[var(--k-line)]" />
            <div className="animate-pulse rounded-[3px] bg-[var(--k-line)]" />
          </div>
        </div>
      ) : lead ? (
        <>
          <div className="k-today">
            <ProductCard product={lead} variant="kioskBig" />
            <div className="k-today__side">
              {runners.map((product) => (
                <ProductCard key={product.id} product={product} variant="kioskRow" />
              ))}
            </div>
          </div>
          {!!rest.length && (
            <div className="k-hs mt-4">
              {rest.map((product) => (
                <ProductCard key={product.id} product={product} variant="kiosk" />
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}