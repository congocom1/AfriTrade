import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import SectionHeader from '@/components/SectionHeader';
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function Categories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isActive = () => true) => {
    setLoading(true);
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
      // Keep the last successful feed visible on intermittent mobile networks.
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    load(() => active);
    return () => { active = false; };
  }, [load]);
  const { handlers: pullHandlers, indicator: pullIndicator } = usePullToRefresh(load, { disabled: loading });

  return (
    <div className="space-y-4 pb-6" {...pullHandlers}>
      {pullIndicator}
      <SectionHeader title={t('categories.title')} subtitle={t('categories.subtitle')} />
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/search?category=${c.slug}`}
              className="group overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                <Image
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-2.5">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{t('categories.count', { count: counts[c.id] || 0 })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}