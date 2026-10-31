import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { validateMobileMoneyNumber, findNetwork } from '@/lib/mobileMoney';

/** Wallet number to debit, with the expected operator prefixes shown as a hint. */
export default function MobileMoneyField({ providerId, value, onChange, showError }) {
  const { t } = useTranslation();
  const { ok, hint, error } = validateMobileMoneyNumber(providerId, value);
  const displayError = showError && !ok;
  const fieldId = useId();
  const hintId = `${fieldId}-hint`;
  // Placeholder follows the operator's own numbering instead of a fixed example,
  // so it never suggests a prefix the chosen operator cannot debit.
  const network = findNetwork(providerId);
  const example = network?.prefixes?.[0] ? `0${network.prefixes[0]} 234 5678` : '';

  return (
    <div className="space-y-1.5 border-t border-border pt-3">
      <label htmlFor={fieldId} className="flex items-center gap-2 text-xs font-semibold">
        <Smartphone className="h-3.5 w-3.5 text-primary" /> {t('checkout.debitNumber')}
      </label>
      <input
        id={fieldId}
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={example || t('checkout.debitNumber')}
        aria-invalid={displayError}
        aria-describedby={hintId}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />
      <p id={hintId} className={`text-[11px] ${displayError ? 'text-destructive' : 'text-muted-foreground'}`}>
        {displayError ? error : hint}
      </p>
    </div>
  );
}