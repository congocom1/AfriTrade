import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Coins, MapPin, ShieldCheck, Store } from 'lucide-react';
import { Image } from '@/components/ui/image';
import './storefront.css';

// A trade platform's first screen has to answer three questions at once:
// what can I buy, who is selling it, and how does it reach me. The hero states
// all three and hands off to the two journeys that matter (buy, sell).
const HERO_IMAGE = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=70';

export default function MarketHero({ productCount = 0, categoryCount = 0, sellerCount = 0 }) {
  const { t } = useTranslation();

  const chips = [
    [ShieldCheck, 'market.chipVerified'],
    [Coins, 'market.chipCurrency'],
    [MapPin, 'market.chipDelivery'],
  ];

  // Only figures the marketplace can actually stand behind. A live platform
  // showing "0 products" reads as broken, so empty counts are left out.
  const stats = [
    [productCount, 'market.statProducts'],
    [categoryCount, 'market.statCategories'],
    [sellerCount, 'market.statSellers'],
  ].filter(([value]) => Number(value) > 0);

  return (
    <section className="market-hero" aria-labelledby="market-hero-title">
      <div className="market-hero__grid">
        <div className="market-hero__copy">
          <p className="market-eyebrow">{t('market.eyebrow')}</p>
          <h1 id="market-hero-title" className="market-hero__title">{t('market.title')}</h1>
          <p className="market-hero__sub">{t('market.subtitle')}</p>
          <div className="market-hero__actions">
            <Link to="/search" className="market-cta market-cta--primary">
              {t('market.buyCta')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/sell-with-us" className="market-cta market-cta--ghost">
              <Store className="h-4 w-4" aria-hidden="true" />
              {t('market.sellCta')}
            </Link>
          </div>
          <ul className="market-hero__chips">
            {chips.map(([Icon, key]) => (
              <li key={key}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>
          {!!stats.length && (
            <dl className="market-hero__stats">
              {stats.map(([value, key]) => (
                <div key={key}>
                  <dt>{t(key)}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="market-hero__media">
          <Image src={HERO_IMAGE} alt="" className="market-hero__image" fittingType="fill" />
          <div className="market-hero__card">
            <p className="market-hero__card-label">{t('market.cardEtaLabel')}</p>
            <p className="market-hero__card-value">{t('market.cardEta')}</p>
            <p className="market-hero__card-note">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t('market.cardPickup')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}