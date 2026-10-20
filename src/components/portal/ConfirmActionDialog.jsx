import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function ConfirmActionDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef(false);
  const changeOpen = (value) => { if (!pending.current) { setFailed(false); onOpenChange(value); } };
  const confirm = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setFailed(false);
    try {
      const result = await onConfirm();
      if (result === false) setFailed(true);
      else onOpenChange(false);
    } catch { setFailed(true); }
    finally { pending.current = false; setBusy(false); }
  };
  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-lg" onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        {failed && <p role="alert" className="text-sm text-destructive">{t('portalStatus.actionFailed')}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t('portalComponents.cancel')}</AlertDialogCancel>
          <Button type="button" variant="destructive" disabled={busy} onClick={confirm} aria-busy={busy}>{busy ? t('portalComponents.working') : confirmLabel}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
