import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, ShoppingBag, User, Heart, MessageCircle, Bell, ShieldCheck, LogOut, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/roles';
import { WORKSPACE_ITEMS } from '@/components/layout/workspaces';
import MobileDrawer from '@/components/MobileDrawer';
import CurrencyToggle from '@/components/CurrencyToggle';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const ACCOUNT_LINKS = [
  ['/profile', 'nav.profile', User],
  ['/wishlist', 'nav.wishlist', Heart],
  ['/messages', 'nav.messages', MessageCircle],
  ['/notifications', 'nav.notifications', Bell],
];

export default function TopBar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [term, setTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  useEffect(() => { setDrawerOpen(false); setAccountOpen(false); setPreferencesOpen(false); }, [pathname]);
  // Right-edge horizontal swipe opens the native-feeling bottom sheet without
  // hijacking the iOS left-edge back gesture or horizontal product carousels.
  const edgeSwipe = useRef(null);
  useEffect(() => {
    const onStart = event => {
      if (drawerOpen || window.innerWidth >= 768 || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touch.clientX < window.innerWidth - 28 || event.target?.closest?.('button, a, input, textarea, [role="dialog"]')) return;
      edgeSwipe.current = { x: touch.clientX, y: touch.clientY };
    };
    const onEnd = event => {
      const start = edgeSwipe.current;
      edgeSwipe.current = null;
      if (!start || event.changedTouches.length !== 1) return;
      const dx = start.x - event.changedTouches[0].clientX;
      const dy = Math.abs(start.y - event.changedTouches[0].clientY);
      if (dx >= 72 && dy < dx * 0.6) setDrawerOpen(true);
    };
    const onCancel = () => { edgeSwipe.current = null; };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onCancel);
    };
  }, [drawerOpen]);
  const submit = event => {
    event.preventDefault();
    if (term.trim()) { navigate(`/search?q=${encodeURIComponent(term.trim())}`); setTerm(''); }
  };
  const iconButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring';
  return <header className="sticky top-0 z-50 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
    <div className="mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-3 py-2 md:gap-3 md:px-6 md:py-3">
      <Link to="/" aria-label={`AfriTrade — ${t('nav.home')}`} className="flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><span className="text-lg font-bold tracking-tight text-foreground md:text-xl">Afri<span className="text-primary">Trade</span></span></Link>
      <nav aria-label={t('nav.primary')} className="hidden shrink-0 items-center gap-1 md:flex">
        {[['/discover', 'nav.discover'], ['/categories', 'nav.categories']].map(([to, key]) => <NavLink key={to} to={to} className={({ isActive }) => `app-nav-item inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{t(key)}</NavLink>)}
      </nav>
      <form onSubmit={submit} role="search" className="relative min-w-0 flex-1 md:mx-auto md:w-full md:max-w-[18rem] md:flex-none lg:max-w-[22rem] xl:max-w-[25rem]">
        <label htmlFor="site-search" className="sr-only">{t('nav.searchPlaceholder')}</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input id="site-search" type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder={t('nav.searchPlaceholder')} enterKeyHint="search" className="h-11 w-full min-w-0 rounded-lg border border-border bg-secondary/30 pl-9 pr-2 text-sm md:h-11 md:rounded-xl md:pl-10 md:pr-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </form>
      <button type="button" className="ml-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring md:hidden" onClick={() => setDrawerOpen(true)} aria-label={t('nav.menu')} aria-expanded={drawerOpen} aria-controls="mobile-drawer"><Menu className="h-5 w-5" /></button>
      <div className="hidden shrink-0 items-center gap-1 md:flex">
        <Popover open={preferencesOpen} onOpenChange={setPreferencesOpen}>
          <PopoverTrigger asChild><button type="button" className={iconButton} aria-label={t('nav.utilities')}><SlidersHorizontal className="h-5 w-5" /></button></PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-3"><p className="text-sm font-semibold">{t('nav.utilities')}</p><div className="flex flex-wrap items-center gap-2"><ThemeToggle /><CurrencyToggle /><LanguageToggle /></div></PopoverContent>
        </Popover>
        <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
          <DropdownMenuTrigger asChild><button type="button" className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" aria-label={t('nav.account')}><User className="h-5 w-5" /><span className="hidden xl:inline">{t(user ? 'nav.account' : 'nav.login')}</span><ChevronDown className="h-3 w-3" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {user ? <>
              <DropdownMenuLabel className="truncate">{user.full_name || user.name || user.email}</DropdownMenuLabel><DropdownMenuSeparator />
              {ACCOUNT_LINKS.map(([to, key, Icon]) => <DropdownMenuItem key={to} asChild><Link to={to}><Icon className="mr-2 h-4 w-4" />{t(key)}</Link></DropdownMenuItem>)}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">{t('nav.workspaces')}</DropdownMenuLabel>
              {WORKSPACE_ITEMS.map(({ path, key, icon: Icon }) => <DropdownMenuItem key={path} asChild><Link to={path}><Icon className="mr-2 h-4 w-4" />{t(key)}</Link></DropdownMenuItem>)}
              {isAdmin(user) && <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" />{t('nav.admin')}</Link></DropdownMenuItem>}
              <DropdownMenuSeparator /><DropdownMenuItem onSelect={() => logout()} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />{t('nav.logout')}</DropdownMenuItem>
            </> : <><DropdownMenuItem asChild><Link to="/login">{t('nav.login')}</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/register">{t('nav.register')}</Link></DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link to="/cart" className={`${iconButton} header-icon-button relative`} aria-label={`${t('nav.cart')} (${count})`}><ShoppingBag className="h-5 w-5" />{count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground">{count > 99 ? '99+' : count}</span>}</Link>
      </div>
    </div>
    <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </header>;
}
