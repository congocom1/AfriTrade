import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, ShoppingBag, User, Heart, MessageCircle, Bell, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/AuthContext';
import { isAdmin } from '@/lib/roles';
import { WORKSPACE_ITEMS } from '@/components/layout/workspaces';
import { PORTAL_BUYER } from '@/lib/portals';
import PortalSwitcher from '@/components/portal/PortalSwitcher';
import MobileDrawer from '@/components/MobileDrawer';
import BackButton from '@/components/BackButton';
import CurrencyToggle from '@/components/CurrencyToggle';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const ACCOUNT_LINKS = [
  ['/profile', 'nav.profile', User],
  ['/wishlist', 'nav.wishlist', Heart],
  ['/messages', 'nav.messages', MessageCircle],
  ['/notifications', 'nav.notifications', Bell],
];

// Storefront roots keep the full bar. Every other route is a child screen: on
// phones it swaps the brand lockup and the search field for a back button and
// its own title, while desktop keeps the storefront bar untouched.
const ROOT_PATHS = ['/', '/discover', '/categories', '/cart', '/profile'];

const CHILD_TITLE_SECTIONS = [
  ['/order-history', 'orderHistory'],
  ['/invoice', 'orderHistory'],
  ['/notifications', 'notifications'],
  ['/wishlist', 'wishlist'],
  ['/messages', 'messages'],
  ['/returns', 'returns'],
  ['/loyalty', 'loyalty'],
  ['/checkout', 'checkout'],
  ['/search', 'search'],
  ['/order', 'orderTracking'],
  ['/track', 'trackOrder'],
  ['/product', 'productDetail'],
];

// These three screens have no title key in the locale files.
const INLINE_TITLES = {
  search: { fr: 'Recherche', en: 'Search' },
  productDetail: { fr: 'Produit', en: 'Product' },
  loyalty: { fr: 'Fidélité', en: 'Loyalty' },
  wishlist: { fr: 'Favoris', en: 'Wishlist' },
};

const titleSectionFor = (path) => CHILD_TITLE_SECTIONS
  .find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] || '';

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [term, setTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const trimmedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const isChildScreen = !ROOT_PATHS.includes(trimmedPath);
  const childSection = isChildScreen ? titleSectionFor(trimmedPath) : '';
  const childFallback = (trimmedPath.split('/').filter(Boolean)[0] || '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const inlineTitle = INLINE_TITLES[childSection]?.[i18n.language?.startsWith('fr') ? 'fr' : 'en'];
  const childTitle = inlineTitle || (childSection ? t(`${childSection}.title`, { defaultValue: childFallback }) : childFallback);
  useEffect(() => { setDrawerOpen(false); setAccountOpen(false); }, [pathname]);
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
  const iconButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
  const initials = (user?.full_name || user?.name || user?.email || '').trim().split(/\s+/).map(part => part[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 pt-[env(safe-area-inset-top)] shadow-[0_1px_3px_rgba(15,36,29,0.06)] backdrop-blur-md">
    <div className="relative mx-auto flex max-w-7xl flex-nowrap items-center gap-2 px-3 py-2 md:gap-4 md:px-6 md:py-2.5">
      {isChildScreen && <div className="pointer-events-none absolute inset-0 flex items-center px-3 md:hidden">
        <BackButton className="pointer-events-auto"><span className="sr-only">{t('common.back')}</span></BackButton>
        <h1 className="absolute left-1/2 max-w-[58%] -translate-x-1/2 truncate text-sm font-semibold text-foreground">{childTitle}</h1>
      </div>}
      <Link to="/" aria-label={`AfriTrade — ${t('nav.home')}`} className={`${isChildScreen ? 'hidden md:flex' : 'flex'} min-h-11 shrink-0 items-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}><span className="font-heading text-lg font-extrabold tracking-[-0.03em] text-foreground md:text-xl">Afri<span className="text-primary">Trade</span></span></Link>
      <nav aria-label={t('nav.primary')} className="hidden shrink-0 items-center gap-0.5 md:flex">
        {[['/discover', 'nav.discover'], ['/categories', 'nav.categories']].map(([to, key]) => <NavLink key={to} to={to} className={({ isActive }) => `app-nav-item inline-flex min-h-11 items-center rounded-full px-3.5 text-sm transition-colors ${isActive ? 'bg-secondary font-semibold text-foreground' : 'font-medium text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}>{t(key)}</NavLink>)}
      </nav>
      <form onSubmit={submit} role="search" className={`${isChildScreen ? 'hidden md:block' : ''} relative min-w-0 flex-1 md:mx-auto md:w-full md:max-w-[20rem] md:flex-none lg:max-w-[26rem] xl:max-w-[30rem]`}>
        <label htmlFor="site-search" className="sr-only">{t('nav.searchPlaceholder')}</label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input id="site-search" type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder={t('nav.searchPlaceholder')} enterKeyHint="search" className="h-11 w-full min-w-0 rounded-full border border-border bg-secondary/60 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/75 hover:border-border focus:border-primary/60 focus:bg-card focus:ring-2 focus:ring-primary/15" />
      </form>
      <button type="button" className={`${isChildScreen ? 'ml-auto' : 'ml-0'} flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:hidden`} onClick={() => setDrawerOpen(true)} aria-label={t('nav.menu')} aria-expanded={drawerOpen} aria-controls="mobile-drawer"><Menu className="h-5 w-5" /></button>
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        <PortalSwitcher current={PORTAL_BUYER} />
        <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
          <DropdownMenuTrigger asChild><button type="button" className="flex h-11 items-center gap-2 rounded-full pl-1.5 pr-2.5 text-sm font-medium transition-colors hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={t('nav.account')}>
            {user ? <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials || <User className="h-4 w-4" />}</span> : <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><User className="h-4 w-4" /></span>}
            <span className="hidden xl:inline">{t(user ? 'nav.account' : 'nav.login')}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {user ? <>
              <DropdownMenuLabel className="truncate">{user.full_name || user.name || user.email}</DropdownMenuLabel><DropdownMenuSeparator />
              {ACCOUNT_LINKS.map(([to, key, Icon]) => <DropdownMenuItem key={to} asChild><Link to={to}><Icon className="mr-2 h-4 w-4" />{t(key)}</Link></DropdownMenuItem>)}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal">{t('nav.workspaces')}</DropdownMenuLabel>
              {WORKSPACE_ITEMS.map(({ path, key, icon: Icon }) => <DropdownMenuItem key={path} asChild><Link to={path}><Icon className="mr-2 h-4 w-4" />{t(key)}</Link></DropdownMenuItem>)}
              {isAdmin(user) && <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" />{t('nav.admin')}</Link></DropdownMenuItem>}
              <DropdownMenuSeparator />
            </> : <>
              <DropdownMenuItem asChild><Link to="/login">{t('nav.login')}</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/register">{t('nav.register')}</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
            </>}
            <DropdownMenuLabel className="font-normal">{t('nav.utilities')}</DropdownMenuLabel>
            <div className="flex flex-wrap items-center gap-2 px-2 pb-2"><ThemeToggle /><CurrencyToggle /><LanguageToggle /></div>
            {user && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => logout()} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />{t('nav.logout')}</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link to="/cart" className={`${iconButton} header-icon-button relative`} aria-label={`${t('nav.cart')} (${count})`}><ShoppingBag className="h-5 w-5" />{count > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground ring-2 ring-background">{count > 99 ? '99+' : count}</span>}</Link>
      </div>
    </div>
    <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </header>;
}