import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { LayoutGrid, Package } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SectionHeader from '@/components/SectionHeader';
import { resolveCategoryArt } from '@/lib/categoryArt';
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const load = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [cats, products] = await Promise.all([
        base44.entities.Category.list('sort_order', 40),
        base44.entities.Product.filter({ status: 'published' }, '-created_date', 200),
      ]);
      const map = {};
      products.forEach(p => {
        if (p.category_id) map[p.category_id] = (map[p.category_id] || 0) + 1;
      });
      if (isActive()) { setCategories(cats); setCounts(map); }
    } catch {
      // Keep the last successful feed visible and offer a retry on mobile networks.
      if (isActive()) setLoadFailed(true);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    load(() => active);
    return () => { active = false; };
  }, [load, reloadToken]);
  const { handlers: pullHandlers, indicator: pullIndicator } = usePullToRefresh(load, { disabled: loading });

  return (
    <div className="space-y-4 pb-6" {...pullHandlers}>
      {pullIndicator}
      {loadFailed && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm">
          <span>{t('home.loadFailed')}</span>
          <button type="button" onClick={() => setReloadToken(x => x + 1)} className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground">{t('common.retry')}</button>
        </div>
      )}
      <SectionHeader
        headingLevel="h1"
        title={t('categories.title')}
        subtitle={t('categories.subtitle')}
      />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
            <LayoutGrid className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-base font-semibold">{t('categories.empty')}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{t('categories.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => {
            const art = resolveCategoryArt(c);
            return (
              <Link
                key={c.id}
                to={`/search?category=${c.slug}`}
                className="group overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                  {art ? (
                    <Image
                      src={art}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Package className="h-7 w-7" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">{t('categories.count', { count: counts[c.id] || 0 })}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}