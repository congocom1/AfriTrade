import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function PortalRefresh({ onRefresh, updatedAt }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const refresh = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setFailed(false);
    try { const result = await onRefresh(); if (result?.error) setFailed(true); }
    catch { setFailed(true); }
    finally { pending.current = false; setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      {updatedAt > 0 && <span className="text-xs text-muted-foreground">{t('portalStatus.updated', { time: new Date(updatedAt).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }) })}</span>}
      <Button type="button" variant="outline" disabled={busy} onClick={refresh} aria-busy={busy}><RefreshCw aria-hidden="true" className={busy ? 'animate-spin' : ''} />{t('portalStatus.refresh')}</Button>
      {failed && <p role="alert" className="text-xs text-destructive">{t('portalStatus.actionFailed')}</p>}
    </div>
  );
}
