import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BriefcaseBusiness, Check, ChevronDown, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useAccess } from '@/hooks/useAccess';
import { portalForPath } from '@/lib/portals';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// The shop every account buys in, and the consoles it may work in. A buyer who
// has no shop yet gets the path to open one instead of a console they cannot
// enter, so the control always answers "where do I sell?" as well.
const SHOP = { path: '/', key: 'portals.buyer.label', icon: ShoppingBag };
const PRO = { path: '/pro', key: 'portals.pro.label', icon: Store };
const LOGISTICS = { path: '/logistics', key: 'portals.logistics.label', icon: Truck };
const WORKFORCE = { path: '/employee', key: 'nav.employeeSpace', icon: BriefcaseBusiness };
const BACKOFFICE = { path: '/admin', key: 'portals.backoffice.label', icon: ShieldCheck };
const BECOME_SELLER = { path: '/sell-with-us', key: 'portals.becomeSeller', icon: Store };

/**
 * The single control that moves an account between the spaces it belongs to:
 * the shop it buys in and the console it sells or works in. It offers only the
 * spaces that account can actually open, so a buyer never sees a warehouse and
 * a courier never sees a catalogue.
 *
 * variant "bar" renders the compact header button (desktop bar and console
 * header), variant "list" the full-width block used inside the mobile menu.
 */
export default function SpaceSwitcher({ variant = 'bar', onNavigate, className = '' }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const access = useAccess();

  if (!user || access.loading) return null;

  const roles = access.roles || [];
  const isSeller = access.isAdmin || roles.includes('seller') || roles.includes('creator');
  const spaces = [SHOP];
  spaces.push(isSeller ? PRO : BECOME_SELLER);
  if (access.isAdmin || roles.includes('courier')) spaces.push(LOGISTICS);
  if (access.isAdmin || (access.departments?.length || 0) > 0) spaces.push(WORKFORCE);
  if (access.isAdmin) spaces.push(BACKOFFICE);
  // One space is not a choice: the control would only take room.
  if (spaces.length < 2) return null;

  const inBackOffice = pathname === BACKOFFICE.path || pathname.startsWith(`${BACKOFFICE.path}/`);
  const currentPath = inBackOffice ? BACKOFFICE.path : portalForPath(pathname).home;
  const current = spaces.find((space) => space.path === currentPath) || SHOP;
  const CurrentIcon = current.icon;
  const isCurrent = (path) => path === current.path;

  if (variant === 'list') {
    return (
      <section aria-label={t('nav.workspaces')} className={`rounded-xl border border-border bg-secondary/40 p-2 ${className}`}>
        <h3 className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nav.workspaces')}</h3>
        <div className="space-y-1">
          {spaces.map(({ path, key, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={onNavigate}
              aria-current={isCurrent(path) ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors active:scale-[0.98] duration-75 ${isCurrent(path) ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{t(key)}</span>
              {isCurrent(path) && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('nav.workspaces')}
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${className}`}
        >
          <CurrentIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden xl:inline">{t(current.key)}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{t('nav.workspaces')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {spaces.map(({ path, key, icon: Icon }) => (
          <DropdownMenuItem key={path} asChild>
            <Link to={path} aria-current={isCurrent(path) ? 'page' : undefined}>
              <Icon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{t(key)}</span>
              {isCurrent(path) && <Check className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}