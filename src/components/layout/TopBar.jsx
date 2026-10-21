import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Menu, ShoppingBag, User, Heart, MessageCircle, Bell, Store, ShieldCheck, BriefcaseBusiness, LogOut, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/AuthContext';
import BrandLogo from '@/components/BrandLogo';
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
  ['/employee', 'workforce.title', BriefcaseBusiness],
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
  const submit = event => {
    event.preventDefault();
    if (term.trim()) { navigate(`/search?q=${encodeURIComponent(term.trim())}`); setTerm(''); }
  };
  const iconButton = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring';
  return <header className="sticky top-0 z-50 border-b border-border bg-background pt-[env(safe-area-inset-top)]">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:px-6">
      <Link to="/" aria-label={`AfriTrade — ${t('nav.home')}`} className="shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><BrandLogo className="h-8 w-auto" /></Link>
      <nav aria-label={t('nav.primary')} className="hidden shrink-0 items-center gap-1 md:flex">
        {[['/discover', 'nav.discover'], ['/categories', 'nav.categories']].map(([to, key]) => <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{t(key)}</NavLink>)}
      </nav>
      <form onSubmit={submit} role="search" className="relative order-last w-full min-w-0 md:order-none md:flex-1">
        <label htmlFor="site-search" className="sr-only">{t('nav.searchPlaceholder')}</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input id="site-search" type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder={t('nav.searchPlaceholder')} enterKeyHint="search" className="h-11 w-full rounded-xl border border-border bg-secondary/30 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </form>
      <button type="button" className={`${iconButton} ml-auto md:hidden`} onClick={() => setDrawerOpen(true)} aria-label={t('nav.menu')} aria-expanded={drawerOpen} aria-controls="mobile-drawer"><Menu className="h-5 w-5" /></button>
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
              {['seller', 'admin'].includes(user.role) && <DropdownMenuItem asChild><Link to={user.role === 'admin' ? '/admin' : '/seller'}>{user.role === 'admin' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Store className="mr-2 h-4 w-4" />}{t(user.role === 'admin' ? 'nav.admin' : 'nav.sellerSpace')}</Link></DropdownMenuItem>}
              <DropdownMenuSeparator /><DropdownMenuItem onSelect={() => logout()} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />{t('nav.logout')}</DropdownMenuItem>
            </> : <><DropdownMenuItem asChild><Link to="/login">{t('nav.login')}</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/register">{t('nav.register')}</Link></DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link to="/cart" className={`${iconButton} relative`} aria-label={`${t('nav.cart')} (${count})`}><ShoppingBag className="h-5 w-5" />{count > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground">{count > 99 ? '99+' : count}</span>}</Link>
      </div>
    </div>
    <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </header>;
}
