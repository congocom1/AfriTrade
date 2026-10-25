import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { loadPlatformConfig } from '@/lib/config';
import { resolveStorefrontScope, scopeRecords } from '@/lib/tenancy';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import ComptoirHero from '@/components/home/ComptoirHero';
import ComptoirRayons from '@/components/home/ComptoirRayons';
import ComptoirTrust from '@/components/home/ComptoirTrust';
import ComptoirOffers from '@/components/home/ComptoirOffers';
import ComptoirDiscovery from '@/components/home/ComptoirDiscovery';
import ComptoirToday from '@/components/home/ComptoirToday';
import ComptoirShops from '@/components/home/ComptoirShops';
import ComptoirNew from '@/components/home/ComptoirNew';
import ComptoirBusiness from '@/components/home/ComptoirBusiness';
import ComptoirSellCta from '@/components/home/ComptoirSellCta';
import '@/components/home/comptoir.css';

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadedAt, setLoadedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setLoadFailed(false);
    try {
      // Independent public collections should not take down the entire storefront.
      // Keep successful results visible when an optional feed is unavailable.
      const [config, scopeResult, productResult, categoryResult, sellerResult, contentResult] = await Promise.allSettled([
        loadPlatformConfig(),
        resolveStorefrontScope(),
        base44.entities.Product.filter({ status: 'published' }, '-created_date', 60),
        base44.entities.Category.list('sort_order', 20),
        base44.entities.Seller.filter({ status: 'active' }, '-rating', 8),
        base44.entities.Content.filter({ status: 'published' }, '-likes_count', 10),
      ]);
      if (!isActive()) return;
      const resultRows = [config, scopeResult, productResult, categoryResult, sellerResult, contentResult];
      const failed = resultRows.some((result) => result.status === 'rejected');
      if (failed) {
        console.warn('[Home] One or more storefront data sources could not be loaded',
          resultRows.map((result, index) => result.status === 'rejected' ? index : null).filter((index) => index !== null));
      }
      const scope = scopeResult.status === 'fulfilled' ? scopeResult.value : null;
      // If scope lookup fails, do not display unscoped records from another tenant.
      if (scopeResult.status === 'fulfilled' && productResult.status === 'fulfilled') {
        setProducts(scopeRecords(productResult.value, scope));
      }
      if (categoryResult.status === 'fulfilled') setCategories(categoryResult.value);
      if (scopeResult.status === 'fulfilled' && sellerResult.status === 'fulfilled') {
        setSellers(scopeRecords(sellerResult.value, scope));
      }
      if (contentResult.status === 'fulfilled') setContent(contentResult.value);
      setLoadFailed(failed);
      setLoadedAt(Date.now());
    } catch {
      if (isActive()) setLoadFailed(true);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    load(() => alive);
    return () => { alive = false; };
  }, [reloadKey, load]);
  const { handlers: pullHandlers, indicator: pullIndicator } = usePullToRefresh(load, { disabled: loading });

  const sections = useMemo(() => {
    const intl = products.filter((p) => p.source_type === 'international_supplier');
    return {
      flash: products.filter((p) => p.is_flash_sale).slice(0, 8),
      trending: [...products].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 8),
      fresh: products.slice(0, 8),
      intl: intl.slice(0, 8),
    };
  }, [products]);

  // The catalogue's own freshness, rather than a figure the page cannot back.
  const updatedLabel = useMemo(() => {
    if (!loadedAt) return '';
    const minutes = Math.max(0, Math.round((Date.now() - loadedAt) / 60000));
    return minutes < 1 ? t('market.updatedNow') : t('market.updatedAgo', { count: minutes });
  }, [loadedAt, t]);

  return (
    <div className="k-page -mx-3 -mt-6 md:-mx-6 md:-mt-9" {...pullHandlers}>
      {pullIndicator}

      {loadFailed && (
        <div className="k-note">
          <p>{t('home.loadFailed')}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="k-btn k-btn--ln"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      <ComptoirHero
        productCount={products.length}
        categoryCount={categories.length}
        sellerCount={sellers.length}
      />

      <ComptoirRayons categories={categories} loading={loading} updatedLabel={updatedLabel} />

      <ComptoirTrust />

      {!!sections.flash.length && <ComptoirOffers products={sections.flash} />}

      {(loading || content.length > 0) && <ComptoirDiscovery content={content} loading={loading} />}

      <ComptoirToday products={sections.trending} loading={loading} updatedLabel={updatedLabel} />

      <ComptoirShops sellers={sellers} loading={loading} />

      {!!sections.fresh.length && <ComptoirNew products={sections.fresh} />}

      <ComptoirBusiness intl={sections.intl} />

      <ComptoirSellCta />
    </div>
  );
}