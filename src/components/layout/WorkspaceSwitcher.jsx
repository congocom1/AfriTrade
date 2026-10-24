import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/roles';
import { WORKSPACE_ITEMS } from './workspaces';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/**
 * One control to move between the marketplace and the operator consoles, the
 * way a store owner expects to switch between "my shop" and "my business".
 * The surfaces listed are exactly the ones the signed-in account can open.
 */
export default function WorkspaceSwitcher() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const surfaces = [
    { path: '/', key: 'workspace.buyer', icon: ShoppingBag },
    ...WORKSPACE_ITEMS,
  ];
  if (isAdmin(user)) surfaces.push({ path: '/admin', key: 'nav.admin', icon: ShieldCheck });

  const active = surfaces.find(({ path }) => (path === '/' ? pathname === '/' : pathname.startsWith(path)));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={t('workspace.switch')}
        >
          <span className="hidden lg:inline">{t(active?.key || 'workspace.buyer')}</span>
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>{t('workspace.switch')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {surfaces.map(({ path, key, icon: Icon }) => (
          <DropdownMenuItem key={path} asChild>
            <Link to={path}>
              <Icon className="mr-2 h-4 w-4" />
              {t(key)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}