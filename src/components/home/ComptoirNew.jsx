import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductCard from '@/components/ProductCard';

export default function ComptoirNew({ products = [] }) {
  const { t } = useTranslation();

  return (
    <section className="k-sec" aria-labelledby="comptoir-new">
      <div className="k-sh">
        <div>
          <h2 id="comptoir-new" className="k-serif">{t('home.newArrivals')}</h2>
        </div>
        <Link to="/search?sort=new" className="k-sh__all">{t('common.seeAll')}</Link>
      </div>
      <div className="k-hs">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="kiosk" />
        ))}
      </div>
    </section>
  );
}