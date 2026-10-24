import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { resolveCategoryArt } from '@/lib/categoryArt';
import './storefront.css';

// Departments come from the real catalogue, so the rail can never advertise a
// section the marketplace does not carry. Categories with artwork show it;
// the rest fall back to a neutral mark.
export default function DepartmentRail({ categories = [], loading = false }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <section aria-label={t('market.departments')}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">{t('market.departments')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-[106px] animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section aria-label={t('market.departments')}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight md:text-xl">{t('market.departments')}</h2>
        <Link to="/categories" className="flex min-h-11 shrink-0 items-center gap-1 px-2 text-sm font-semibold text-primary hover:underline">
          {t('market.allDepartments')}
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 lg:grid-cols-6">
        {categories.slice(0, 11).map((category) => {
          const art = resolveCategoryArt(category);
          return (
            <Link key={category.id} to={`/search?category=${category.slug}`} className="market-dept rounded-lg">
              {art ? (
                <Image src={art} alt="" className="market-dept__thumb" />
              ) : (
                <span className="market-dept__icon">
                  <Package className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <span className="market-dept__name">{category.name}</span>
            </Link>
          );
        })}
        <Link to="/categories" className="market-dept rounded-lg">
          <span className="market-dept__icon">
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="market-dept__name">{t('market.allDepartments')}</span>
        </Link>
      </div>
    </section>
  );
}