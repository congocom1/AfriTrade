import LegacySelect from '@/components/ui/legacy-select';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, resolveLanguage, setLanguage } from '@/i18n';

/** Compact language picker. Mirrors CurrencyToggle styling. */
export default function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();
  return (
    <LegacySelect
      aria-label="Langue / Language"
      value={resolveLanguage(i18n.resolvedLanguage || i18n.language) || 'fr'}
      onChange={(e) => setLanguage(e.target.value)}
      className={`h-10 cursor-pointer rounded-full border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none ${className}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.id} value={l.id}>
          {l.label} · {l.name}
        </option>
      ))}
    </LegacySelect>
  );
}
