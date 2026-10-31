import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { detectProduct3D } from '@/lib/product3d/detect';
import { modelLabel } from '@/lib/product3d/registry';

/**
 * "Detect from picture": the seller pastes a photo link, the AI reads the
 * object and the 3D engine builds the matching model by itself. The result
 * card reports what the AI saw; the built model renders in the viewer.
 */
export default function DetectFromPicture({ detection, onDetected, onClear }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    const imageUrl = url.trim();
    if (!/^https?:\/\/\S+$/i.test(imageUrl)) {
      setError(t('threeDAssets.detectUrlError'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const spec = await detectProduct3D({ imageUrl });
      onDetected({ ...spec, imageUrl });
    } catch {
      setError(t('threeDAssets.detectFailed'));
      onDetected(null);
    } finally {
      setLoading(false);
    }
  };

  const swatches = detection?.detected ? [detection.primaryColor, detection.secondaryColor].filter(Boolean) : [];

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <header className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold">{t('threeDAssets.detectTitle')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('threeDAssets.detectIntro')}</p>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t('threeDAssets.detectUrlPlaceholder')}
          inputMode="url"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
        />
        <Button type="button" onClick={run} disabled={loading || !url.trim()} className="h-11 shrink-0">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {loading ? t('threeDAssets.detectDetecting') : t('threeDAssets.detectButton')}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {detection?.detected && (
        <div className="flex gap-3 rounded-xl border border-border bg-background p-3">
          <Image
            src={detection.imageUrl}
            alt={t('threeDAssets.detectPreview')}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 space-y-1 text-xs">
            {detection.objectName && <p className="font-semibold">{t('threeDAssets.detectObject', { name: detection.objectName })}</p>}
            <p className="text-muted-foreground">{t('threeDAssets.detectModel', { model: modelLabel(detection.modelKey) })}</p>
            <p className="text-muted-foreground">
              {t('threeDAssets.detectConfidence', { value: Math.round(detection.confidence * 100) })}
            </p>
            {!!swatches.length && (
              <p className="flex items-center gap-2 text-muted-foreground">
                {t('threeDAssets.detectColors')}
                {swatches.map((color) => (
                  <span
                    key={color}
                    className="h-3.5 w-3.5 rounded-full border border-border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </p>
            )}
            <button type="button" onClick={onClear} className="pt-0.5 font-medium text-primary hover:underline">
              {t('threeDAssets.detectClear')}
            </button>
          </div>
        </div>
      )}

      {detection && !detection.detected && (
        <p className="rounded-xl border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
          {t('threeDAssets.detectNone')}
        </p>
      )}
    </section>
  );
}