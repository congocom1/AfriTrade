import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, FileText } from 'lucide-react';
import './storefront.css';

// The business side of the marketplace: bulk buying and importing. Kept next
// to the retail feed because that is how trade actually starts here, with a
// shop owner sourcing stock.
export default function WholesaleBand() {
  const { t } = useTranslation();

  const points = ['market.wholesalePoint1', 'market.wholesalePoint2', 'market.wholesalePoint3'];

  return (
    <section className="market-band" aria-labelledby="market-wholesale-title">
      <h2 id="market-wholesale-title" className="market-band__title">{t('market.wholesaleTitle')}</h2>
      <p className="market-band__text">{t('market.wholesaleText')}</p>
      <ul className="market-band__list">
        {points.map((key) => (
          <li key={key}>
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
      <div className="market-band__actions">
        <Link to="/b2b" className="market-cta market-cta--primary">
          {t('market.wholesaleCta')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link to="/b2b/quotes" className="market-cta market-cta--ghost">
          <FileText className="h-4 w-4" aria-hidden="true" />
          {t('market.wholesaleCta2')}
        </Link>
      </div>
    </section>
  );
}