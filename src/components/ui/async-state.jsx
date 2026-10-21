import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';

/** Accessible loading and recoverable error state for async collections. */
export default function AsyncState({ loading = false, error = false, onRetry, loadingLabel, errorTitle, errorDescription }) {
  const { t } = useTranslation();
  const label = loadingLabel || t('asyncState.loading');
  if (loading) return <div role="status" aria-live="polite" aria-label={label} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><span className="sr-only">{label}</span>{Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}</div>;
  if (!error) return null;
  return <section role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card px-5 py-10 text-center"><AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" /><h2 className="text-base font-semibold">{errorTitle || t('asyncState.errorTitle')}</h2><p className="max-w-md text-sm text-muted-foreground">{errorDescription || t('asyncState.errorDescription')}</p>{onRetry && <Button type="button" variant="outline" onClick={onRetry}><RefreshCw className="h-4 w-4" aria-hidden="true" />{t('asyncState.retry')}</Button>}</section>;
}
