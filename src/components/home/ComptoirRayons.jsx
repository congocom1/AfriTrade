import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Departments come from the real catalogue, so the list can never advertise a
// section the marketplace does not carry.
export default function ComptoirRayons({ categories = [], loading = false, updatedLabel }) {
  const { t } = useTranslation();

  if (!loading && !categories.length) return null;

  return (
    <section className="k-sec" aria-labelledby="comptoir-rayons">
      <div className="k-sh">
        <div>
          <p className="k-cap k-accent-text k-eyebrow">{t('market.eyebrow')}</p>
          <h2 id="comptoir-rayons" className="k-serif">{t('market.departments')}</h2>
          {updatedLabel && <p className="k-upd">{updatedLabel}</p>}
        </div>
        <Link to="/categories" className="k-sh__all">{t('market.allDepartments')}</Link>
      </div>

      <ul className="k-rays">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
            <li key={index}>
              <span className="flex min-h-11 items-center py-3">
                <span className="h-3 w-2/3 animate-pulse rounded bg-[var(--k-line)]" />
              </span>
            </li>
          ))
          : categories.slice(0, 8).map((category) => (
            <li key={category.id}>
              <Link to={`/search?category=${category.slug}`}>
                {category.name}
                <span className="k-accent-text" aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        {!loading && (
          <li>
            <Link to="/categories">
              {t('market.allDepartments')}
              <span className="k-accent-text" aria-hidden="true">›</span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}