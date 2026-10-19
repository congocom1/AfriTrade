import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const titles = {
  '/': 'Trade without borders',
  '/discover': 'Discover',
  '/categories': 'Categories',
  '/search': 'Search',
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/about': 'About',
  '/mentions-legales': 'Legal notice',
  '/b2b': 'Wholesale marketplace',
  '/login': 'Log in',
  '/register': 'Create an account',
};

// Hosting can inject stale page titles. The app owns its title after hydration
// and updates it on client-side navigation, including back/forward navigation.
export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = titles[pathname] ? `${titles[pathname]} | AfriTrade` : 'AfriTrade';
  }, [pathname]);
  return null;
}
