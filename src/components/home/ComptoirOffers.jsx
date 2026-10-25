import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '@/components/ProductCard';
import ComptoirCountdown from './ComptoirCountdown';

// Deals band. It only renders when the catalogue actually has a reduced item,
// so the storefront never promises an offer that is not there.
export default function ComptoirOffers({ products = [] }) {
  const { t } = useTranslation();

  return (
    <section className="k-sec k-kraft" aria-labelledby="comptoir-deals">
      <div className="k-sh">
        <div>
          <h2 id="comptoir-deals" className="k-serif">{t('market.deals')}</h2>
          <p className="mt-1.5 flex items-center gap-2">
            <span className="k-cap">{t('market.dealsTag')}</span>
            <ComptoirCountdown />
          </p>
        </div>
        <Link to="/search?sort=discount" className="k-sh__all">{t('common.seeAll')}</Link>
      </div>
      <p className="mb-3 text-sm text-[var(--k-blk-text)]">{t('market.dealsSub')}</p>
      <div className="k-hs">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="kiosk" />
        ))}
      </div>
    </section>
  );
}