import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ComptoirSellCta() {
  const { t } = useTranslation();

  return (
    <section className="k-foot" aria-labelledby="comptoir-sell">
      <h2 id="comptoir-sell" className="k-serif">{t('common.sellCtaTitle')}</h2>
      <p>{t('common.sellCtaText')}</p>
      <Link to="/seller-application" className="k-btn k-btn--pri">{t('home.openShop')}</Link>
      <div className="k-foot__links">
        <Link to="/creator-showcase">{t('home.becomeCreator')}</Link>
        <Link to="/assistant">{t('commerceIntro.assistant')}</Link>
      </div>
    </section>
  );
}