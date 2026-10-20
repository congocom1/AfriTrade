import { useId } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CollectionToolbar({ query, onQueryChange, filter, onFilterChange, options = [], children }) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-56">
        <label htmlFor={`${id}-search`} className="mb-1.5 block text-xs font-medium">{t('portalComponents.search')}</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input id={`${id}-search`} type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} className="pl-9 pr-11" />
          {query && <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={t('portalComponents.clearSearch')} onClick={() => onQueryChange('')}><X aria-hidden="true" /></Button>}
        </div>
      </div>
      {options.length > 0 && <div className="min-w-36 flex-1 basis-36 sm:flex-none">
        <label htmlFor={`${id}-filter`} className="mb-1.5 block text-xs font-medium">{t('portalComponents.filter')}</label>
        <select id={`${id}-filter`} value={filter} onChange={(event) => onFilterChange(event.target.value)} className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm">
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>}
      {children}
    </div>
  );
}
