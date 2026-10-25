import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/roles';
import { BACKOFFICE, PORTAL_LIST, PORTALS } from '@/lib/portals';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/**
 * One control to move between the shop, the business space and the logistics
 * space — the three portals of the platform. Administrators also get the back
 * office. The current portal is marked, so the visitor always knows where they are.
 */
export default function PortalSwitcher({ current, className = '' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const active = PORTALS[current] || PORTALS.buyer;
  const ActiveIcon = active.icon;
  const surfaces = isAdmin(user) ? [...PORTAL_LIST, BACKOFFICE] : PORTAL_LIST;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex h-11 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
          aria-label={t('portals.switchLabel')}
        >
          <ActiveIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden lg:inline">{t(active.labelKey)}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{t('portals.title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {surfaces.map((portal) => {
          const Icon = portal.icon;
          const isCurrent = portal.id === active.id;
          return (
            <DropdownMenuItem key={portal.id} asChild>
              <Link
                to={portal.home || portal.path}
                aria-current={isCurrent ? 'true' : undefined}
                className="flex items-start gap-2.5"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className={`block text-sm ${isCurrent ? 'font-bold text-primary' : 'font-medium'}`}>
                    {t(portal.labelKey)}
                  </span>
                  <span className="block text-xs leading-snug text-muted-foreground">{t(portal.taglineKey)}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}