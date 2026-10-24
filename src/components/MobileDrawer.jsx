import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { X, User, Heart, MessageCircle, Bell, ShieldCheck, LogOut } from 'lucide-react';
import CurrencyToggle from '@/components/CurrencyToggle';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/roles';
import { WORKSPACE_ITEMS } from '@/components/layout/workspaces';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const USER_ITEMS = [
  { key: 'nav.wishlist', path: '/wishlist', icon: Heart },
  { key: 'nav.messages', path: '/messages', icon: MessageCircle },
  { key: 'nav.notifications', path: '/notifications', icon: Bell },
];

const ADMIN_ITEMS = [
  { key: 'nav.admin', path: '/admin', icon: ShieldCheck },
];

const GUEST_ITEMS = [
  { key: 'nav.login', path: '/login', icon: User },
  { key: 'nav.register', path: '/register', icon: User },
];

export default function MobileDrawer({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  // P0 M-02: Removed useEffect that closes on every route change
  // Now we only close on explicit link clicks via onClick={onClose}
  // This prevents the drawer flicker when navigating internally

  const getActive = (item) => item.path === '/' ? pathname === '/' : (pathname === item.path || pathname.startsWith(`${item.path}/`));

  const renderItems = (items) => items.map((item) => {
      const Icon = item.icon;
      const active = getActive(item);

      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClose}
          aria-current={active ? 'page' : undefined}
          // P0 M-06: Add press feedback on mobile
          className={`app-nav-item flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors active:scale-[0.98] active:bg-accent duration-75 ease-out ${
            active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
          <span>{t(item.key)}</span>

        </Link>
      );
    });

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      direction="bottom"
      dismissible
      shouldScaleBackground={false}
      // Vaul provides pointer/touch drag-down to dismiss; navigation links
      // remain keyboard and screen-reader accessible.
    >
        <DrawerContent id="mobile-drawer" aria-describedby={undefined} className="mx-auto pb-[env(safe-area-inset-bottom)] max-h-[85dvh] max-w-md w-full rounded-t-[16px] border-l-0 border-r-0 border-b-0 bg-card/95 backdrop-blur-xl shadow-xl">
          <DrawerHeader className="flex h-16 items-center justify-between border-b border-border px-4 sm:text-left">
            <DrawerTitle className="text-base font-semibold">{t('nav.menu')}</DrawerTitle>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
              aria-label={t('nav.close')}
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </DrawerHeader>

          <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4" aria-label={t('nav.menu')}>
            {/* User Account */}
            <section aria-label={t('nav.account')}>
              <h3 className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nav.account')}
              </h3>
              <div className="space-y-1">
                {user ? (
                  <>
                    {renderItems(USER_ITEMS)}
                    <button
                      type="button"
                      onClick={() => { logout(); onClose(); }}
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-destructive transition-colors hover:bg-secondary text-left active:bg-accent active:scale-[0.98] duration-75"
                    >
                      <LogOut className="h-6 w-6" aria-hidden="true" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </>
                ) : (
                  renderItems(GUEST_ITEMS)
                )}
              </div>
            </section>
            {user && (
              <section aria-label={t('nav.workspaces')}>
                <h3 className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('nav.workspaces')}
                </h3>
                <div className="space-y-1">
                  {renderItems(WORKSPACE_ITEMS)}
                  {isAdmin(user) && renderItems(ADMIN_ITEMS)}
                </div>
              </section>
            )}
            <section aria-label={t('nav.utilities')} className="border-t border-border pt-4">
              <h3 className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nav.utilities')}</h3>
              <div className="flex flex-wrap items-center gap-2 px-3"><ThemeToggle /><CurrencyToggle /><LanguageToggle /></div>
            </section>
          </nav>
        </DrawerContent>
    </Drawer>
  );
}