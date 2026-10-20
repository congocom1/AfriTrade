import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function CollectionPagination({ view, onPageChange }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('portalComponents.pagination')} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">{t('portalComponents.results', { start: view.start, end: view.end, count: view.count })}</p>
      {view.totalPages > 1 && <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={view.page === 1} onClick={() => onPageChange(view.page - 1)}>{t('portalComponents.previous')}</Button>
        <span className="text-xs tabular-nums">{t('portalComponents.page', { current: view.page, total: view.totalPages })}</span>
        <Button type="button" variant="outline" size="sm" disabled={view.page === view.totalPages} onClick={() => onPageChange(view.page + 1)}>{t('portalComponents.next')}</Button>
      </div>}
    </nav>
  );
}
