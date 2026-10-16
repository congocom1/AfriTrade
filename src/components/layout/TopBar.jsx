import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Heart, Bell, MessageCircle, User, LogOut, ChevronDown, Store, ShieldCheck, MoreHorizontal, X, Home, Compass, Grid } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/AuthContext';
import CurrencyToggle from '@/components/CurrencyToggle';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import MobileDrawer from '@/components/MobileDrawer';
import EnvironmentBadge from '@/components/ui/EnvironmentBadge';
import BrandLogo from '@/components/BrandLogo';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { count } = useCart();
  const { user, logout } = useAuth();
  const [term, setTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [utilsOpen, setUtilsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const utilsRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term.trim())}`);
      setTerm('');
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (utilsRef.current && !utilsRef.current.contains(e.target)) {
        setUtilsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setUtilsOpen(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  const Avatar = ({ name, email, size = 32, className }) => {
    const initials = getInitials(name || email);
    const colors = [
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    ];
    const colorIndex = initials.charCodeAt(0) % colors.length;
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium font-mono select-none',
          colors[colorIndex],
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  };

  const NavLink = ({ to, children, icon: Icon }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 ease-out active:scale-90',
          isActive
            ? 'bg-primary/10 text-primary dark:bg-primary/20'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {Icon && <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />}
        <span className="hidden sm:inline">{children}</span>
      </Link>
    );
  };

  const IconButton = ({ onClick, children, ariaLabel, variant = 'ghost', className }) => {
    const base = 'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
    const variants = {
      ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground active:scale-[0.96]',
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.96] shadow-sm',
    };
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, variants[variant], className)}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  };

  const DropdownItem = ({ onClick, children, icon: Icon, destructive = false, className }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-100',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-accent',
        className
      )}
      onMouseDown={(e) => e.preventDefault()}
    >
      {Icon && <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );

  return (
    <header
      className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]"
      role="banner"
    >
      {/* Main bar */}
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 md:px-8 md:py-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl hover:bg-accent active:scale-[0.96] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={t('nav.menu')}
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand — always visible */}
        <Link
          to="/"
          className="brand-home-link flex shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          aria-label="AfriTrade — Home"
        >
          <BrandLogo className="h-8 w-auto" />
        </Link>

        {/* Primary navigation — desktop only */}
        <nav className="hidden lg:flex items-center gap-1 mx-2" aria-label={t('nav.primary')}>
          <NavLink to="/" icon={Home} >{t('nav.home')}</NavLink>
          <NavLink to="/discover" icon={Compass} >{t('nav.discover')}</NavLink>
          <NavLink to="/categories" icon={Grid} >{t('nav.categories')}</NavLink>
        </nav>

        {/* Search — centered, expands on focus */}
        <div className="relative flex-1 max-w-xl lg:max-w-2xl mx-4">
          <form onSubmit={submit} role="search" className="w-full">
            <label htmlFor="site-search" className="sr-only">{t('nav.searchPlaceholder')}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60" aria-hidden="true" />
              <input
                id="site-search"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                className="h-11 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-sm outline-none transition-all duration-200
                  placeholder:text-muted-foreground/50
                  focus:border-primary focus:ring-2 focus:ring-primary/20
                  md:placeholder:text-muted-foreground/40"
                aria-label={t('nav.searchPlaceholder')}
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent text-muted-foreground/60 transition-colors"
                  aria-label="Clear search"
                  tabIndex={-1}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right section — grouped utilities */}
        <div className="flex items-center gap-1.5">
          {/* Seller/Admin quick access — only if relevant */}
          {user && (user.role === 'seller' || user.role === 'admin') && (
            <Link
              to={user.role === 'admin' ? '/admin' : '/seller'}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              aria-label={user.role === 'admin' ? t('nav.admin') : t('nav.sellerSpace')}
            >
              {user.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
              <span className="hidden sm:inline">{user.role === 'admin' ? t('nav.admin') : t('nav.sellerSpace')}</span>
            </Link>
          )}

          {/* Utilities dropdown — groups less-frequent actions */}
          <div className="relative" ref={utilsRef}>
            <IconButton
              onClick={() => setUtilsOpen(!utilsOpen)}
              ariaLabel={t('nav.more')}
              ariaExpanded={utilsOpen}
              ariaHaspopup="true"
            >
              <MoreHorizontal className="h-5 w-5" />
            </IconButton>

            {utilsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUtilsOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card py-2 shadow-xl animate-in fade-in-0 zoom-in-95">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('nav.utilities')}</div>
                  <div className="flex flex-col gap-1 px-2 py-1">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('nav.appearance')}</div>
                    <div className="grid grid-cols-2 gap-1 px-2">
                      <ThemeToggle />
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-2">
                      <CurrencyToggle />
                      <LanguageToggle />
                    </div>
                    <hr className="my-2 border-border" />
                    <EnvironmentBadge />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block h-8 w-px bg-border mx-1" aria-hidden="true" />

          {/* User actions */}
          {user ? (
            <div className="relative flex items-center gap-1" ref={userMenuRef}>
              {/* User avatar button */}
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-accent active:scale-[0.96] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
                aria-label={t('nav.profile')}
              >
                <Avatar name={user.name} email={user.email} size={32} />
                <ChevronDown className="absolute bottom-1 right-1 h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-xl border border-border bg-card py-2 shadow-xl animate-in fade-in-0 zoom-in-95">
                    <div className="px-4 py-3 border-b border-border">
                      <Avatar name={user.name} email={user.email} size={40} className="mx-auto" />
                      <p className="mt-2 text-center text-sm font-medium truncate">{user.name || user.email}</p>
                      <p className="text-center text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex flex-col gap-1 px-2 py-2">
                      <DropdownItem onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} icon={User}>{t('nav.profile')}</DropdownItem>
                      <DropdownItem onClick={() => { navigate('/wishlist'); setUserMenuOpen(false); }} icon={Heart}>{t('nav.wishlist')}</DropdownItem>
                      <DropdownItem onClick={() => { navigate('/messages'); setUserMenuOpen(false); }} icon={MessageCircle}>{t('nav.messages')}</DropdownItem>
                      <DropdownItem onClick={() => { navigate('/notifications'); setUserMenuOpen(false); }} icon={Bell}>{t('nav.notifications')}</DropdownItem>
                      {user.role === 'seller' && (
                        <DropdownItem onClick={() => { navigate('/seller'); setUserMenuOpen(false); }} icon={Store}>{t('nav.sellerSpace')}</DropdownItem>
                      )}
                      {user.role === 'admin' && (
                        <DropdownItem onClick={() => { navigate('/admin'); setUserMenuOpen(false); }} icon={ShieldCheck}>{t('nav.admin')}</DropdownItem>
                      )}
                      <hr className="my-2 border-border" />
                      <DropdownItem
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        icon={LogOut}
                        destructive
                      >
                        {t('nav.logout')}
                      </DropdownItem>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}

          {/* Cart — always visible */}
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-accent active:scale-[0.96] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t('nav.cart')}
          >
            <svg className="h-5.5 w-5.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v7m6 0l-3 3m3-3l3 3m0 0V3M3 3h18" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 min-w-[18px] h-5 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-primary-foreground flex items-center justify-center">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}