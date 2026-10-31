import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

export default function SectionHeader({ title, subtitle, to, linkLabel, headingLevel: Heading = 'h2' }) {
  const { t } = useTranslation();
  const label = linkLabel || t('common.seeAll');
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Heading className="text-lg font-semibold tracking-tight md:text-xl">{title}</Heading>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-accent">
          {label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}