import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { submitDataRightsRequest } from '@/lib/dataRightsRequest';
import FormField from '@/components/portal/FormField';
import React, { useState, useRef } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';

const TYPE_IDS = ['access', 'rectification', 'deletion', 'opposition'];

export default function DataRightsForm({ initialType = 'access', lockType = false, initialValues = {}, onBusyChange = () => {} }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const TYPES = TYPE_IDS.map((id) => ({ id, label: t(`dataRightsForm.type_${id}`) }));
  const [form, setForm] = useState({ type: TYPE_IDS.includes(initialType) ? initialType : 'access', name: initialValues.name || '', email: initialValues.email || '', phone: initialValues.phone || '', details: '' });
  const pending = useRef(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    setError('');
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) {
      setError(t('dataRightsForm.errorContact'));
      return;
    }
    pending.current = true;
    setSending(true);
    onBusyChange(true);
    try {
      const requestNumber = await submitDataRightsRequest(base44, form);
      setDone(requestNumber);
    } catch {
      setError(t('dataRightsForm.errorSend'));
    } finally {
      pending.current = false;
      setSending(false);
      onBusyChange(false);
    }
  };

  if (done) {
    return (
      <section role="status" aria-live="polite" className="rounded-lg border border-primary/30 bg-accent p-5">
        <CheckCircle2 className="h-6 w-6 text-primary" />
        <h2 className="mt-2 text-sm font-bold text-accent-foreground">{t('dataRightsForm.doneTitle')}</h2>
        <p className="mt-1 text-xs text-accent-foreground">
          {t('dataRightsForm.doneDesc', { ref: done })}
        </p>
      </section>
    );
  }

  if (!user) return <Link to="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary">{t('portalComponents.signIn')}</Link>;

  return (
    <section id="droits" className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-bold">{t('dataRightsForm.title')}</h2>
      <p className="text-xs text-muted-foreground">
        {t('dataRightsForm.subtitle')}
      </p>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">{error}</p>}
      <form onSubmit={submit} className="space-y-2.5">
        {!lockType && <FormField label={t('portalComponents.type')}><select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          {TYPES.map((tx) => (
            <option key={tx.id} value={tx.id}>{tx.label}</option>
          ))}
        </select></FormField>}
        <FormField label={t('dataRightsForm.namePlaceholder')}><input required maxLength={200}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('dataRightsForm.namePlaceholder')}
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
        />
        </FormField>
        <div className="grid gap-2.5 md:grid-cols-2">
          <FormField label={t('dataRightsForm.emailPlaceholder')}><input type="email" maxLength={254}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('dataRightsForm.emailPlaceholder')}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          </FormField>
          <FormField label={t('dataRightsForm.phonePlaceholder')}><input type="tel" maxLength={50}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t('dataRightsForm.phonePlaceholder')}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          </FormField>
        </div>
        <p className="text-xs text-muted-foreground">{t('portalComponents.contact')}</p>
        <FormField label={t('dataRightsForm.detailsPlaceholder')}><textarea maxLength={5000}
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          rows={3}
          placeholder={t('dataRightsForm.detailsPlaceholder')}
          className="w-full rounded-lg border border-border bg-background p-3 text-sm"
        />
        </FormField>
        <button
          type="submit"
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {sending ? t('dataRightsForm.sending') : t('dataRightsForm.submit')}
        </button>
      </form>
    </section>
  );
}