import LegacySelect from '@/components/ui/legacy-select';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PHONE_NETWORKS, validateMobileMoneyNumber } from '@/lib/mobileMoney';

// Country-qualified keys keep the two M-Pesa / Airtel / Orange entries distinct;
// the legacy provider id alone is ambiguous across countries.
const providerOptions = PHONE_NETWORKS.map((n) => ({ key: n.key, value: n.key, label: `${n.name} · ${n.country}` }));

const mobileMoneySchema = z.object({
  provider: z.string().min(1, 'payout.errProviderRequired'),
  phone: z.string().min(1, 'payout.errPhoneRequired'),
  holder: z.string().min(1, 'payout.errHolderRequired'),
});

export default function MobileMoneyForm({ onAdd }) {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setError, clearErrors, watch } = useForm({
    resolver: zodResolver(mobileMoneySchema),
    defaultValues: { provider: providerOptions[0].value, phone: '', holder: '' },
  });

  const provider = watch('provider');
  // Live hint: the prefixes the chosen network expects, so the user knows what
  // to type before submitting. Empty when the reference is unknown.
  const { hint } = useMemo(() => validateMobileMoneyNumber(provider, ''), [provider]);

  const submit = async (formData) => {
    clearErrors();
    const check = validateMobileMoneyNumber(formData.provider, formData.phone);
    if (!check.ok) {
      // Show the specific mismatch rather than a generic "invalid" message.
      setError('phone', { type: 'manual', message: check.error || t('payout.errPhoneInvalid') });
      return;
    }
    await onAdd({ provider: check.network.key, phone: check.phone, holder: formData.holder });
    reset({ provider: providerOptions[0].value, phone: '', holder: '' });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-2 md:grid-cols-3" noValidate>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="provider">
          {t('payout.provider')}
        </label>
        <LegacySelect
          id="provider"
          {...register('provider')}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
          aria-invalid={!!errors.provider}
        >
          {providerOptions.map((o) => <option key={o.key} value={o.value}>{o.label}</option>)}
        </LegacySelect>
        {errors.provider && <p className="text-[11px] text-destructive">{t(errors.provider.message)}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="phone">
          {t('payout.phoneNumber')}
        </label>
        <Input
          id="phone"
          placeholder={hint || t('payout.phoneNumber')}
          {...register('phone')}
          inputMode="tel"
          aria-invalid={!!errors.phone}
          aria-describedby="phone-hint"
        />
        <p id="phone-hint" className="text-[11px] text-muted-foreground">{hint || t('payout.momoHint', 'Enter your mobile wallet number.')}</p>
        {errors.phone && <p className="text-[11px] text-destructive">{t(errors.phone.message)}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground" htmlFor="holder">
          {t('payout.holderName')}
        </label>
        <Input
          id="holder"
          placeholder={t('payout.holderName')}
          {...register('holder')}
          aria-invalid={!!errors.holder}
        />
        {errors.holder && <p className="text-[11px] text-destructive">{t(errors.holder.message)}</p>}
      </div>
      <Button type="submit" className="md:col-span-3" disabled={isSubmitting}>
        {isSubmitting ? t('payout.saving', 'Saving...') : t('payout.addAccount')}
      </Button>
    </form>
  );
}