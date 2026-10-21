import i18n from '@/i18n';
import { toast } from '@/components/ui/use-toast';

/**
 * Recovery handler for list-loading promises.
 * A failed fetch must never look like "no records": surface a toast so the
 * user knows to retry, then fall back to an empty list.
 */
export function notifyLoadError(err) {
  console.error('[data] load failed', err);
  toast({
    variant: 'destructive',
    title: i18n.t('portalComponents.loadFailedToast'),
    description: i18n.t('portalComponents.loadFailedToastDesc'),
  });
  return [];
}
