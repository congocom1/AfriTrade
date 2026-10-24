import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { activateTab, currentTabRoot, rememberTabPath, resetTabPath, tabTargetPath } from '@/lib/tabHistory';

const ITEMS = [
  { key: 'nav.home', path: '/', icon: Home },
  { key: 'nav.discover', path: '/discover', icon: Compass },
  { key: 'nav.categories', path: '/categories', icon: LayoutGrid },
  { key: 'nav.cart', path: '/cart', icon: ShoppingBag, badge: true },
  { key: 'nav.profile', path: '/profile', icon: User },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();

  // Keep each tab's remembered position current as the user moves around.
  useEffect(() => {
    rememberTabPath(location.pathname);
  }, [location.pathname]);

  // The tab the user is inside, which owns the current page even when that page
  // belongs to no tab (a product, checkout, ...).
  const currentRoot = currentTabRoot(location.pathname);

  // Tapping the tab you are already on drops its remembered position and
  // returns to the root. Opening another tab hands the history to it, so the
  // page it restores belongs to that tab from then on.
  const handleTabClick = (event, path, active) => {
    if (!active) {
      activateTab(path);
      return;
    }
    event.preventDefault();
    resetTabPath(path);
    if (location.pathname !== path) navigate(path);
  };

  return (
    // P0 M-04: Add safe-area inset for iOS home indicator
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]" aria-label={t('nav.primary')}>
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.path === currentRoot;
          const to = active ? item.path : tabTargetPath(item.path);
          return (
            <Link
              key={item.path}
              to={to}
              onClick={(event) => handleTabClick(event, item.path, active)}
              aria-current={active ? 'page' : undefined}
              aria-label={t(item.key)}
              className={`bottom-nav-item relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium transition-colors duration-150 active:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              {item.badge && count > 0 && (
                <span className="absolute right-2 top-0.5 min-w-[18px] rounded-full bg-primary px-1 text-center text-[9px] leading-[18px] text-primary-foreground">
                  {count > 99 ? '99+' : count}
                </span>
              )}
              <span className="max-w-full truncate">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}