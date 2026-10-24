import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import ProductRow from '@/components/ProductRow';
import './storefront.css';

// Deals band. It only renders when the catalogue actually has a reduced item,
// so the storefront never promises an offer that is not there.
export default function DealStrip({ products = [], loading = false }) {
  const { t } = useTranslation();

  return (
    <section className="market-band" aria-labelledby="market-deals-title">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Zap className="h-5 w-5 text-[#19c48d]" aria-hidden="true" />
        <h2 id="market-deals-title" className="market-band__title">{t('market.deals')}</h2>
        <span className="market-tag">{t('market.dealsTag')}</span>
      </div>
      <p className="market-band__text">{t('market.dealsSub')}</p>
      <div className="mt-5">
        <ProductRow products={products} loading={loading} skeletonCount={4} />
      </div>
    </section>
  );
}