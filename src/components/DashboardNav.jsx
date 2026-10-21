import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, LayoutGrid, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function DashboardNav({ title, links = [], variant }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const active = [...links].sort((a, b) => b.to.length - a.to.length).find(l => pathname === l.to || (!l.end && pathname.startsWith(`${l.to}/`)));
  const label = l => l.key ? t(l.key) : l.label;
  const grouped = links.length > 7;
  const primary = grouped ? links.slice(0, 4) : links;
  const visible = active && !primary.includes(active) ? [...primary, active] : primary;
  const groups = [...new Set(links.map(l => l.group || 'workspace'))];
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  const matches = links.filter(l => normalize(`${label(l)} ${t(`portalComponents.${l.group || 'workspace'}`)}`).includes(normalize(search.trim())));
  const linkClass = selected => `workspace-link${selected ? ' workspace-link--active' : ''}`;

  return (
    <header className={`trade-dashboard-nav workspace-header${variant === 'paper' ? ' paper-head' : ''}`}>
      <nav aria-label="Breadcrumb" className="mb-1">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li>
            <Link to="/" className="hover:text-foreground hover:underline">{t('portalComponents.home')}</Link>
          </li>
          <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
          <li>{t('portalComponents.workspace')}</li>
          {active && <>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
            <li aria-current="page" className="font-medium text-foreground">{label(active)}</li>
          </>}
        </ol>
      </nav>
      <div className="workspace-heading">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        </div>
        {grouped && <Popover open={open} onOpenChange={value => { setOpen(value); if (!value) setSearch(''); }}>
          <PopoverTrigger asChild>
            <button type="button" className="workspace-menu hidden md:inline-flex">
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              {t('portalComponents.workspace')}<ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(42rem,calc(100vw-2rem))] p-0">
            <div className="flex items-center gap-2 border-b border-border p-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input aria-label={t('portalComponents.searchSections')} placeholder={t('portalComponents.searchSections')} value={search} onChange={e => setSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" />
            </div>
            <nav aria-label={t('portalComponents.workspace')} className="grid max-h-[60vh] gap-5 overflow-y-auto p-4 sm:grid-cols-2">
              {groups.map(group => {
                const items = matches.filter(l => (l.group || 'workspace') === group);
                return items.length ? <section key={group}>
                  <h2 className="mb-2 px-3 text-xs font-semibold text-muted-foreground">{t(`portalComponents.${group}`)}</h2>
                  {items.map(l => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)} className={() => `workspace-destination ${active?.to === l.to ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>{label(l)}</NavLink>)}
                </section> : null;
              })}
              {!matches.length && <p role="status" className="p-3 text-sm text-muted-foreground">{t('portalComponents.noSections')}</p>}
            </nav>
          </PopoverContent>
        </Popover>}
      </div>
      {links.length > 0 && <>
        <select aria-label={title} value={active?.to || ''} onChange={e => navigate(e.target.value)} className="h-12 w-full rounded-lg border border-border bg-card px-3 text-sm font-medium md:hidden">
          {!active && <option value="" disabled>{title}</option>}
          {groups.map(group => <optgroup key={group} label={t(`portalComponents.${group}`)}>{links.filter(l => (l.group || 'workspace') === group).map(l => <option key={l.to} value={l.to}>{label(l)}</option>)}</optgroup>)}
        </select>
        <nav aria-label={title} className="hidden flex-wrap gap-1 border-b border-border pb-2 md:flex">
          {visible.map(l => <NavLink key={l.to} to={l.to} end={l.end} className={() => linkClass(active?.to === l.to)}>{label(l)}</NavLink>)}
        </nav>
      </>}
    </header>
  );
}

export default DashboardNav;
