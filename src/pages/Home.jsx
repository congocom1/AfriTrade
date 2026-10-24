import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Truck, Play, Store as StoreIcon } from 'lucide-react';
import CommerceIntro from '@/components/CommerceIntro';
import AssuranceStrip from '@/components/home/AssuranceStrip';
import { base44 } from '@/api/base44Client';
import { loadPlatformConfig } from '@/lib/config';
import { Image } from '@/components/ui/image';
import SectionHeader from '@/components/SectionHeader';
import ProductRow from '@/components/ProductRow';
import ProductGrid from '@/components/ProductGrid';
import SellerCard from '@/components/SellerCard';
import CategoryCard from '@/components/categories/CategoryCard';
import EmptyState from '@/components/EmptyState';
import { resolveStorefrontScope, scopeRecords } from '@/lib/tenancy';
import usePullToRefresh from '@/hooks/usePullToRefresh';

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
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

  return (
    <div className="brand-home space-y-10 pb-6 md:space-y-14" {...pullHandlers}>
      {pullIndicator}
      {loadFailed && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">
            {t('home.loadFailed')}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      <CommerceIntro />
      <AssuranceStrip />
      <section aria-label={t("homeCollections.title")} className="grid gap-4 sm:grid-cols-2">
        {[          { image: "electronics", title: t("homeCollections.electronics"), text: t("homeCollections.electronicsText") },          { image: "home-decor", title: t("homeCollections.home"), text: t("homeCollections.homeText") },        ].map((collection) => (          <CategoryCard            key={collection.image}            image={collection.image}            title={collection.title}            text={collection.text}          />        ))}
      </section>
      {/* Category chips */}
      {!!categories.length && (
        <section>
          <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/search?category=${c.slug}`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Show promotions only when there is an active offer. */}
      {!!sections.flash.length && <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">{t('home.flashSale')}</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">{t('home.limitedTime')}</span>
        </div>
        <ProductRow products={sections.flash} loading={loading} />
      </section>}

      {/* Discovery feed */}
      {(loading || content.length > 0) && <section>
        <SectionHeader title={t('home.discovery')} subtitle={t('home.discoverySub')} to="/discover" />
        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-52 w-32 shrink-0 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : (
          <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 md:mx-0 md:px-0">
            {content.slice(0, 8).map((c) => (
              <Link key={c.id} to="/discover" className="relative h-52 w-32 shrink-0 overflow-hidden rounded-xl md:h-64 md:w-40">
                <Image src={c.thumbnail_url || c.media_url} alt={c.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-background">
                  <p className="line-clamp-2 text-[10px] font-medium leading-tight">{c.title}</p>
                  <p className="mt-0.5 text-[10px] opacity-80">@{c.creator_handle}</p>
                </div>
                <Play className="absolute left-2 top-2 h-5 w-5 text-background drop-shadow" />
              </Link>
            ))}
          </div>
        )}
      </section>}

      {/* Trending */}
      <section>
        <SectionHeader title={t('home.trending')} subtitle={t('home.trendingSub')} to="/search?sort=sold" />
        <ProductGrid products={sections.trending} loading={loading} skeletonCount={4} />
      </section>

      {/* Local sellers */}
      <section>
        <SectionHeader title={t('home.localSellers')} subtitle={t('home.localSellersSub')} />
        {loading ? (
          <div className="grid gap-2.5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : sellers.length ? (
          <div className="grid gap-2.5 md:grid-cols-2">
            {sellers.slice(0, 6).map((s) => (
              <SellerCard key={s.id} seller={s} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={StoreIcon}
            title={t('home.noSellers')}
            description={t('home.noSellersDesc')}
            actionTo="/seller"
            actionLabel={t('home.openShop')}
          />
        )}
      </section>

      {/* New arrivals */}
      {!!sections.fresh.length && (
        <section>
          <SectionHeader title={t('home.newArrivals')} to="/search?sort=new" />
          <ProductRow products={sections.fresh} />
        </section>
      )}

      {/* International */}
      {!!sections.intl.length && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold tracking-tight md:text-xl">{t('home.intlTitle')}</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('home.intlNote')}
          </p>
          <ProductRow products={sections.intl} />
        </section>
      )}

      <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div>
          <h2 className="text-lg font-semibold">{t('common.sellCtaTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('common.sellCtaText')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/seller-application" className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{t('home.openShop')}</Link>
          <Link to="/creator-showcase" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary hover:underline">{t('home.becomeCreator')}</Link>
          <Link to="/assistant" className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary hover:underline">{t('commerceIntro.assistant')}</Link>
        </div>
      </section>
    </div>
  );
}