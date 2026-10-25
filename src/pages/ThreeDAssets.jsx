import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import BackButton from '@/components/BackButton';
import Product3DViewer from '@/components/Product3DViewer';
import { MODEL_KEYS, modelLabel } from '@/lib/product3d/registry';
import { DEMO_MODEL_CREDIT, DEMO_MODEL_FILES } from '@/lib/product3d/assets';
import { PRODUCT_PLACEHOLDER } from '@/lib/productImages';

/**
 * 3D asset showcase: every model the library can render, plus the real model
 * files, one at a time. Browsers cap how many WebGL scenes a page may open, so
 * the list selects and the viewer mounts a single model.
 */
export default function ThreeDAssets() {
  const { t } = useTranslation();

  const assets = useMemo(() => [
    ...MODEL_KEYS.map((key) => ({ id: `built-${key}`, label: modelLabel(key), kind: 'built', modelKey: key })),
    ...DEMO_MODEL_FILES.map((file) => ({
      id: file.key,
      label: file.label,
      kind: 'file',
      modelUrl: file.url,
      family: file.family,
    })),
  ], []);

  const [term, setTerm] = useState('');
  const [activeId, setActiveId] = useState(assets[0]?.id);
  const needle = term.trim().toLowerCase();
  const visible = needle ? assets.filter((asset) => asset.label.toLowerCase().includes(needle)) : assets;
  const active = assets.find((asset) => asset.id === activeId) || assets[0];

  return (
    <div className="space-y-5 pb-8">
      <BackButton fallback="/admin/products" />

      <header className="space-y-1">
        <h1 className="text-lg font-bold md:text-2xl">{t('threeDAssets.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('threeDAssets.subtitle', { count: assets.length })}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="order-2 space-y-3 lg:order-1">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t('threeDAssets.search')}
              className="h-11 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm"
            />
          </label>
          <div className="grid max-h-[560px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {visible.map((asset) => (
              <button
                key={asset.id}
                type="button"
                aria-pressed={asset.id === active?.id}
                onClick={() => setActiveId(asset.id)}
                className={`rounded-xl border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  asset.id === active?.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <span className="block text-sm font-semibold">{asset.label}</span>
                <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-muted-foreground">
                  {asset.kind === 'file' ? t('threeDAssets.file') : t('threeDAssets.built')}
                </span>
              </button>
            ))}
            {!visible.length && (
              <p className="rounded-xl border border-dashed border-border bg-card p-4 text-center text-xs text-muted-foreground">
                {t('threeDAssets.empty')}
              </p>
            )}
          </div>
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-secondary">
            {active && (
              <Product3DViewer
                key={active.id}
                modelKey={active.modelKey}
                modelUrl={active.modelUrl}
                fallbackImage={PRODUCT_PLACEHOLDER}
                title={active.label}
              />
            )}
          </div>
          {active && (
            <div className="rounded-xl border border-border bg-card p-3 text-xs">
              <p className="text-sm font-semibold">{active.label}</p>
              <p className="mt-1 text-muted-foreground">
                {active.kind === 'file'
                  ? t('threeDAssets.fileNote', { family: active.family })
                  : t('threeDAssets.builtNote')}
              </p>
              {active.kind === 'file' && (
                <>
                  <p className="mt-1 break-all text-[11px] text-muted-foreground">{active.modelUrl}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{DEMO_MODEL_CREDIT}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}