import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { canOpen } from '@/lib/access';
import { useAccess } from '@/hooks/useAccess';

/**
 * A portal's own navigation: the sections of that portal, and only the ones the
 * signed-in account may actually open. A courier never sees the seller console,
 * a seller never sees the warehouse tools.
 */
export default function PortalNav({ portal }) {
  const { t } = useTranslation();
  const access = useAccess();
  const items = portal.sections.filter((section) => !access.loading && canOpen(section.path, access));

  if (!items.length) return null;

  return (
    <nav aria-label={t(portal.labelKey)} className="border-b border-border bg-card/60">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2 md:px-6">
        {items.map(({ id, path, icon: Icon }) => (
          <NavLink
            key={id}
            to={path}
            className={({ isActive }) => `inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3 text-sm transition-colors ${isActive ? 'bg-primary font-semibold text-primary-foreground' : 'font-medium text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{t(`portals.sections.${id}`)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}