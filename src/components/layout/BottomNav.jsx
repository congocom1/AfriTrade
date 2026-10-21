import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/lib/cart';

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
  const { count } = useCart();

  return (
    // P0 M-04: Add safe-area inset for iOS home indicator
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] backdrop-blur-lg md:hidden pb-[env(safe-area-inset-bottom)]" aria-label={t('nav.primary')}>
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.path === '/' ? location.pathname === '/' : (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
          return (
            <Link
              key={item.path}
              to={item.path}
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
