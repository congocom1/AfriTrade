import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Truck } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

// The business side of the marketplace: importing and buying in bulk. Kept on
// the front page because that is how trade starts here, with a shop owner
// sourcing stock.
export default function ComptoirBusiness({ intl = [] }) {
  const { t } = useTranslation();
  const points = ['market.wholesalePoint1', 'market.wholesalePoint2', 'market.wholesalePoint3'];

  return (
    <>
      {!!intl.length && (
        <section className="k-sec k-blk" aria-labelledby="comptoir-intl">
          <div className="k-sh">
            <h2 id="comptoir-intl" className="k-serif">
              <Truck className="k-accent-text" aria-hidden="true" />
              {t('home.intlTitle')}
            </h2>
          </div>
          <p>{t('home.intlNote')}</p>
          <div className="k-hs mt-4">
            {intl.map((product) => (
              <ProductCard key={product.id} product={product} variant="kiosk" />
            ))}
          </div>
        </section>
      )}

      <section className="k-sec k-kraft" aria-labelledby="comptoir-wholesale">
        <div className="k-sh">
          <h2 id="comptoir-wholesale" className="k-serif">{t('market.wholesaleTitle')}</h2>
        </div>
        <p>{t('market.wholesaleText')}</p>
        <ul>
          {points.map((key) => (
            <li key={key}>
              <Check aria-hidden="true" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
        <div className="k-row">
          <Link to="/b2b" className="k-btn k-btn--pri">{t('market.wholesaleCta')}</Link>
          <Link to="/b2b/quotes" className="k-btn k-btn--ln">{t('market.wholesaleCta2')}</Link>
        </div>
      </section>
    </>
  );
}