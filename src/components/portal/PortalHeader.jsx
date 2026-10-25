import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/AuthContext';

const ICON_BUTTON = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/**
 * Header of a console portal (business, logistics): the brand, the portal the
 * visitor is in, the portal switcher and the account shortcuts. It replaces the
 * storefront bar so an operator never sees shop navigation inside their console.
 */
export default function PortalHeader({ portal }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { count } = useCart();
  const Icon = portal.icon;
  const initials = (user?.full_name || user?.name || user?.email || '').trim().split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 pt-[env(safe-area-inset-top)] shadow-[0_1px_3px_rgba(15,36,29,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 md:gap-3 md:px-6 md:py-2.5">
        <Link to="/" className="flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={`AfriTrade — ${t('portals.backToShop')}`}>
          <span className="font-heading text-lg font-extrabold tracking-[-0.03em] text-foreground md:text-xl">Afri<span className="text-primary">Trade</span></span>
        </Link>
        <span className="hidden min-w-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground sm:flex">
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{t(portal.labelKey)}</span>
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Link to="/cart" className={`${ICON_BUTTON} relative`} aria-label={`${t('nav.cart')} (${count})`}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground ring-2 ring-background">{count > 99 ? '99+' : count}</span>}
          </Link>
          <Link to="/profile" className={ICON_BUTTON} aria-label={t('nav.account')}>
            {user
              ? <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials || <User className="h-4 w-4" />}</span>
              : <User className="h-5 w-5" />}
          </Link>
        </div>
      </div>
    </header>
  );
}