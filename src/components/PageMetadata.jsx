import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PUBLIC_PAGES = {
  '/': { en: ['AfriTrade | Buy, Sell & Trade in DR Congo', 'Discover products, local sellers and wholesale opportunities on AfriTrade in DR Congo.'], fr: ['AfriTrade | Acheter, vendre et commercer en RDC', 'Découvrez des produits, vendeurs locaux et opportunités de vente en gros sur AfriTrade en RDC.'] },
  '/discover': { en: ['Discover Products | AfriTrade', 'Browse available products and sellers on AfriTrade.'], fr: ['Découvrir des produits | AfriTrade', 'Parcourez les produits et les vendeurs sur AfriTrade.'] },
  '/categories': { en: ['Product Categories | AfriTrade', 'Explore product categories on AfriTrade.'], fr: ['Catégories de produits | AfriTrade', 'Explorez les catégories de produits sur AfriTrade.'] },
  '/about': { en: ['About AfriTrade', 'Learn about AfriTrade and our marketplace for buyers and sellers in DR Congo.'], fr: ['À propos d’AfriTrade', 'Découvrez AfriTrade et notre place de marché pour acheteurs et vendeurs en RDC.'] },
  '/b2b': { en: ['Wholesale Marketplace | AfriTrade', 'Explore business-to-business wholesale opportunities on AfriTrade.'], fr: ['Marché de gros B2B | AfriTrade', 'Découvrez les opportunités de commerce de gros B2B sur AfriTrade.'] },
  '/mentions-legales': { en: ['Legal Notice | AfriTrade', 'AfriTrade legal notices and platform information.'], fr: ['Mentions légales | AfriTrade', 'Mentions légales et informations sur la plateforme AfriTrade.'] },
};
const ORIGIN = 'https://afritrade-1.base44.app';

export default function PageMetadata() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  useEffect(() => {
    const language = i18n.resolvedLanguage === 'en' ? 'en' : 'fr';
    const page = PUBLIC_PAGES[pathname];
    const isProduct = /^\/product\/[^/]+$/.test(pathname);
    const isIndexable = Boolean(page || isProduct);
    const [title, description] = page?.[language] || (language === 'en'
      ? ['AfriTrade', 'AfriTrade marketplace for buyers and sellers in DR Congo.']
      : ['AfriTrade', 'Place de marché AfriTrade pour acheteurs et vendeurs en RDC.']);
    document.title = title;
    const setMeta = (key, value, attribute = 'name') => {
      let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.appendChild(node); }
      node.setAttribute('content', value);
    };
    setMeta('description', description);
    setMeta('robots', isIndexable ? 'index,follow' : 'noindex,follow');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:url', `${ORIGIN}${pathname}`, 'property');
    setMeta('og:site_name', 'AfriTrade', 'property');
    setMeta('twitter:card', 'summary_large_image');
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (isIndexable) {
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = `${ORIGIN}${pathname}`;
    } else canonical?.remove();
  }, [pathname, i18n.resolvedLanguage]);
  return null;
}
