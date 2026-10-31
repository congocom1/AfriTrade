import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import DataRightsForm from '@/components/legal/DataRightsForm';

export default function AccountDeletionRequest() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <DialogTrigger asChild><Button type="button" variant="outline" className="text-destructive">{t('portalComponents.requestDeletion')}</Button></DialogTrigger>
      <DialogContent onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onPointerDownOutside={(event) => { if (busy) event.preventDefault(); }} className="max-h-[90dvh] w-[calc(100%_-_2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{t('portalComponents.requestDeletion')}</DialogTitle><DialogDescription>{t('portalComponents.deletionDescription')}</DialogDescription></DialogHeader>
        {user ? <DataRightsForm key={user.id || user.email} initialType="deletion" lockType onBusyChange={setBusy} initialValues={{ name: user.full_name || user.name || '', email: user.email || '', phone: user.phone || '' }} /> : <Link to="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">{t('portalComponents.signIn')}</Link>}
      </DialogContent>
    </Dialog>
  );
}
