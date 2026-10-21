import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import './commerce-intro.css';

export default function CommerceIntro() {
  const { t } = useTranslation();
  const [heroImage, setHeroImage] = useState('/images/realistic/homepage-hero.webp');
  return (
    <div className="commerce-intro">
      <section className="commerce-intro__hero" aria-labelledby="commerce-title">
        <h1 id="commerce-title">{t('commerceIntro.title')}</h1>
        <p className="commerce-intro__description">{t('commerceIntro.description')}</p>
        <div className="commerce-intro__actions">
          <Link className="commerce-intro__primary" to="/search">{t('commerceIntro.start')}<ArrowRight size={16} aria-hidden="true" /></Link>
          <Link className="commerce-intro__secondary" to="/seller-application">{t('commerceIntro.sell')}</Link>
        </div>
        <img
          className="commerce-intro__visual"
          src={heroImage}
          alt="AfriTrade commerce marketplace and parcel delivery"
          loading="eager"
          decoding="async"
          onError={() => {
            if (heroImage !== '/images/afritrade_web_hero_1600x900.png') {
              setHeroImage('/images/afritrade_web_hero_1600x900.png');
            }
          }}
        />
      </section>

      <section className="commerce-intro__workspace" id="trade-workspace" aria-labelledby="workspace-title">
        <h2 id="workspace-title">{t('commerceIntro.workspace')}</h2>
        <div className="commerce-intro__tools">
          {['orders', 'freight', 'finance'].map((key) => (
            <Link key={key} to={{ orders: '/order-history', freight: '/shipping-calculator', finance: '/wallet' }[key]}>
              <span>{t(`commerceIntro.${key}`)}</span>
              <small>{t(`commerceIntro.${key}Description`)}</small>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
