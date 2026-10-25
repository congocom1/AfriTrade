import LegacySelect from '@/components/ui/legacy-select';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductGrid from '@/components/ProductGrid';
import EmptyState from '@/components/EmptyState';
import AsyncState from '@/components/ui/async-state';
import { resolveStorefrontScope, scopeRecords } from '@/lib/tenancy';
import usePullToRefresh from '@/hooks/usePullToRefresh';
import {
  scoreProductRelevance,
  filterByCategory,
  filterBySource,
  filterByMaxPrice,
  filterByMinRating,
  filterByInStock,
  filterByProvider,
  filterByPickup,
  providerName,
  sortProducts,
} from '@/lib/searchUtils';

const SORT_IDS = ['relevance', 'new', 'sold', 'price_asc', 'price_desc', 'rating'];

export default function Search() {
  const { t } = useTranslation();
  const SORTS = SORT_IDS.map((id) => ({ id, label: t(`search.sort_${id}`) }));
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [visible, setVisible] = useState(24);
  const [showFilters, setShowFilters] = useState(false);

  const [term, setTerm] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [source, setSource] = useState(params.get('source') || 'all');
  const [sort, setSort] = useState(params.get('sort') || 'relevance');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [provider, setProvider] = useState('');
  const [pickupOnly, setPickupOnly] = useState(false);

  const load = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setLoadError(false);
    try {
      const scope = await resolveStorefrontScope();
      const [p, c] = await Promise.all([
        base44.entities.Product.filter({ status: 'published' }, '-created_date', 200),
        base44.entities.Category.list('sort_order', 40),
      ]);
      if (isActive()) {
        setProducts(scopeRecords(p, scope));
        setCategories(c);
      }
    } catch {
      if (isActive()) setLoadError(true);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    load(() => alive);
    return () => { alive = false; };
  }, [reloadToken, load]);
  const { handlers: pullHandlers, indicator: pullIndicator } = usePullToRefresh(load, { disabled: loading });

  useEffect(() => {
    setTerm(params.get('q') || '');
    setCategory(params.get('category') || '');
    setSource(params.get('source') || 'all');
    setSort(params.get('sort') || 'relevance');
    setVisible(24);
  }, [params]);

  // The URL carries the category slug; the catalogue stores category ids.
  const categoryId = useMemo(() => {
    if (!category) return '';
    return categories.find((c) => c.slug === category)?.id || category;
  }, [category, categories]);

  // Providers present in the catalogue, so the filter never lists an empty name.
  const providers = useMemo(() => {
    const names = new Set(products.map(providerName).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [products]);

  const results = useMemo(() => {
    const trimmed = (params.get('q') || '').trim();
    // Score once so relevance sort reflects the query, then filter.
    const scored = new Map(
      products.map((product) => [product, trimmed ? scoreProductRelevance(product, trimmed) : 0]),
    );

    let productsList = trimmed
      ? products.filter((product) => (scored.get(product) ?? 0) > 0)
      : [...products];

    productsList = filterByCategory(productsList, categoryId);

    // Apply source filter
    productsList = filterBySource(productsList, source);

    // Apply price filter
    productsList = filterByMaxPrice(productsList, maxPrice);

    // Apply rating filter
    productsList = filterByMinRating(productsList, minRating);

    // Apply stock filter
    productsList = filterByInStock(productsList, inStock);

    // Apply provider filter
    productsList = filterByProvider(productsList, provider);

    // Apply relay-point pickup filter
    productsList = filterByPickup(productsList, pickupOnly);

    // Sort: relevance uses the query score, other modes use sortProducts.
    if ((!sort || sort === 'relevance') && trimmed) {
      return [...productsList].sort((a, b) => (scored.get(b) ?? 0) - (scored.get(a) ?? 0));
    }
    return sortProducts(productsList, sort);
  }, [products, params, categoryId, source, sort, maxPrice, minRating, inStock, provider, pickupOnly]);

  const applyTerm = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next);
  };

  const clearFilters = () => {
    setCategory('');
    setSource('all');
    setMaxPrice('');
    setMinRating(0);
    setInStock(false);
    setProvider('');
    setPickupOnly(false);
    const next = new URLSearchParams();
    if (params.get('q')) next.set('q', params.get('q'));
    setParams(next);
  };

  const activeFilters = [category, source !== 'all' ? source : '', maxPrice, minRating, inStock, provider, pickupOnly].filter(Boolean).length;

  return (
    <div className="space-y-4 pb-6" {...pullHandlers}>
      {pullIndicator}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyTerm(term.trim());
        }}
        className="flex min-w-0 gap-2"
      >
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-11 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          aria-expanded={showFilters}
          aria-controls="catalog-filters"
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
          aria-label={t('search.filters')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold leading-4 text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>
      </form>

      {showFilters && (
        <div id="catalog-filters" className="space-y-3 rounded-xl border border-border bg-card p-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('search.category')}</p>
            <LegacySelect
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">{t('search.all')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </LegacySelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('search.maxPrice')}</p>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={t('search.maxPricePh')}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('search.minRating')}</p>
              <LegacySelect
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value={0}>{t('search.all')}</option>
                <option value={3}>{t('search.rate3')}</option>
                <option value={4}>{t('search.rate4')}</option>
                <option value={4.5}>{t('search.rate45')}</option>
              </LegacySelect>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('search.origin')}</p>
            <div className="flex gap-2">
              {[
                { id: 'all', label: t('search.originAll') },
                { id: 'local', label: t('search.originLocal') },
                { id: 'international', label: t('search.originIntl') },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSource(o.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    source === o.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{t('search.provider')}</p>
            <LegacySelect
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">{t('search.all')}</option>
              {providers.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </LegacySelect>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            {t('search.inStockOnly')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pickupOnly} onChange={(e) => setPickupOnly(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            {t('search.pickupOnly', { defaultValue: 'Retrait en point relais' })}
          </label>
          <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs font-semibold text-primary">
            <X className="h-3.5 w-3.5" /> {t('search.resetFilters')}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {loading ? t('common.loading') : t('search.resultsCount', { count: results.length })}
          {params.get('q') ? t('search.resultsForTerm', { term: params.get('q') }) : ''}
        </p>
        <LegacySelect
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-2 text-xs"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </LegacySelect>
      </div>

      {loadError && <AsyncState error onRetry={() => setReloadToken(v => v + 1)} errorTitle={t('asyncState.errorTitle')} errorDescription={t('asyncState.errorDescription')} />}
      {!loadError && <ProductGrid
        products={results.slice(0, visible)}
        loading={loading}
        skeletonCount={8}
        emptyState={
          <EmptyState
            icon={SearchIcon}
            title={t('search.emptyTitle')}
            description={t('search.emptyDesc')}
            actionTo="/categories"
            actionLabel={t('search.emptyAction')}
          />
        }
      /> }

      {!loading && !loadError && results.length > visible && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + 24)}
          className="mx-auto block rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold"
        >
          {t('search.loadMore')}
        </button>
      )}
    </div>
  );
}