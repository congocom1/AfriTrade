import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Coins, MapPin, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Image } from '@/components/ui/image';

// The front page opens on the street the marketplace serves: one photograph,
// the marketplace's own figures, and the search a buyer came for.
const HERO_IMAGE = 'https://media.base44.com/images/public/6ad35f967cfc0088309e830b/207973e06_generated_527bfcfe.jpg';

export default function ComptoirHero({ productCount = 0, categoryCount = 0, sellerCount = 0 }) {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const night = resolvedTheme === 'dark';

  const chips = [
  [ShieldCheck, 'market.chipVerified'],
  [Coins, 'market.chipCurrency'],
  [MapPin, 'market.chipDelivery']];


  // Only figures the marketplace can stand behind: a live platform showing
  // "0 products" reads as broken, so empty counts are left out.
  const stats = [
  [productCount, 'market.statProducts'],
  [categoryCount, 'market.statCategories'],
  [sellerCount, 'market.statSellers']].
  filter(([value]) => Number(value) > 0);

  return (
    <section className="k-hero" aria-labelledby="comptoir-title">
      <div className="k-hero__bg" aria-hidden="true">
        <Image src={HERO_IMAGE} alt="" className="k-hero__bg-image" fittingType="fill" />
      </div>
      <div className="k-hero__scrim" aria-hidden="true" />

      <div className="k-util k-d1">
        <span className="k-brand k-serif">Afri<span>Trade</span></span>
        <span className="flex items-center gap-2">
          <span className="k-cap k-brand-accent">Kinshasa</span>
          <button
            type="button"
            className="k-theme"
            onClick={() => setTheme(night ? 'light' : 'dark')}
            aria-label={night ? t('market.themeDay') : t('market.themeNight')}>
            
            {night ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
        </span>
      </div>

      <h1 id="comptoir-title" className="k-hero__title k-serif k-d2 font-light [font-family:'JetBrains_Mono',_monospace]">{t('market.title')}</h1>
      <p className="k-hero__sub k-d3">{t('market.subtitle')}</p>

      <Link to="/search" className="k-search k-d4">
        <span className="k-search__field">{t('market.searchHint')}</span>
        <span className="k-btn k-btn--pri">{t('common.search')}</span>
      </Link>

      <div className="k-row k-d5">
        <Link to="/search" className="k-btn k-btn--pri">{t('market.buyCta')}</Link>
        <Link to="/sell-with-us" className="k-btn k-btn--gh">{t('market.sellCta')}</Link>
      </div>

      <ul className="k-chips k-d6">
        {chips.map(([Icon, key]) =>
        <li key={key}>
            <Icon aria-hidden="true" />
            {t(key)}
          </li>
        )}
      </ul>

      {!!stats.length &&
      <dl className="k-stats k-d7">
          {stats.map(([value, key]) =>
        <div key={key}>
              <dt>{t(key)}</dt>
              <dd className="k-serif">{value}</dd>
            </div>
        )}
        </dl>
      }

      <div className="k-eta k-d8">
        <p className="k-cap k-accent-text">{t('market.cardEtaLabel')}</p>
        <p className="k-eta__value k-serif">{t('market.cardEta')}</p>
        <p className="k-eta__note">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('market.cardPickup')}
        </p>
      </div>
    </section>);

}