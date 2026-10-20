import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

/** Accessible, translated loading/error state shared by all portal surfaces. */
export default function PortalStatus({ loading = false, retry }) {
  const { t } = useTranslation();
  if (loading) return (
    <section role="status" aria-live="polite" aria-busy="true" className="space-y-4 rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{t('portalStatus.loading')}</p>
      <div aria-hidden="true" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((key) => <div key={key} className="h-20 animate-pulse rounded-md bg-secondary" />)}
      </div>
    </section>
  );
  return (
    <section role="alert" className="rounded-lg border border-destructive/30 bg-card p-6">
      <h2 className="text-base font-semibold">{t('portalStatus.failed')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('portalStatus.failedDescription')}</p>
      {retry && <Button type="button" variant="outline" className="mt-4" onClick={() => retry()}>{t('portalStatus.retry')}</Button>}
    </section>
  );
}
