import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Titles per page
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

// SEO metadata per page
const seoData = {
  '/': {
    title: 'Trade without borders — AfriTrade Marketplace',
    description: 'Pan-African B2B & B2C marketplace connecting buyers and sellers across Africa. Discover products, categories, and services with secure payments.',
    images: ['/og-image.png'],
    icons: ['/favicon.ico', '/apple-touch-icon.png'],
  },
  '/discover': {
    title: 'Discover Products — AfriTrade Marketplace',
    description: 'Browse featured products, trending items, and local discoveries from verified sellers across Africa.',
    images: ['/og-image.png'],
  },
  '/categories': {
    title: 'Product Categories — AfriTrade Marketplace',
    description: 'Explore product categories from agriculture to technology. Find what you need from verified African sellers.',
    images: ['/og-image.png'],
  },
  '/search': {
    title: 'Search Results — AfriTrade Marketplace',
    description: 'Search results for your products and sellers.',
    images: ['/og-image.png'],
  },
  '/cart': {
    title: 'Shopping Cart — AfriTrade Marketplace',
    description: 'Review your selected items before checkout. Secure checkout with multiple payment options.',
    images: ['/og-image.png'],
  },
  '/checkout': {
    title: 'Checkout — AfriTrade Marketplace',
    description: 'Complete your secure checkout with multiple payment methods. Order summary and payment confirmation.',
    images: ['/og-image.png'],
  },
  '/about': {
    title: 'About AfriTrade — Shopify × Alibaba for Africa',
    description: 'Learn about AfriTrade, the pan-African marketplace connecting buyers and sellers across Africa. Built on Shopify × Alibaba technology.',
    images: ['/og-image.png'],
  },
};

/**
 * SEO Metadata component - sets page titles, meta descriptions,
 * Open Graph tags, Twitter cards, and structured data
 */
export default function SEOMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const data = seoData[pathname] || seoData['/'];
    const title = data.title || 'AfriTrade';

    // 1. Page title
    document.title = title;

    // 2. Remove existing SEO tags to avoid duplicates
    const existingTags = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
      'meta[name="twitter:title"]',
      'meta[name="twitter:description"]',
      'meta[name="twitter:image"]',
      'link[rel="canonical"]',
    ];
    existingTags.forEach(selector => {
      const existing = document.querySelector(selector);
      if (existing) existing.remove();
    });

    // 3. Meta description
    const descMeta = document.createElement('meta');
    descMeta.name = 'description';
    descMeta.content = data.description || '';
    document.head.appendChild(descMeta);

    // 4. Open Graph tags
    const ogTitle = document.createElement('meta');
    ogTitle.property = 'og:title';
    ogTitle.content = data.title || title;
    document.head.appendChild(ogTitle);

    const ogDescription = document.createElement('meta');
    ogDescription.property = 'og:description';
    ogDescription.content = data.description || '';
    document.head.appendChild(ogDescription);

    if (data.images && data.images.length > 0) {
      const ogImage = document.createElement('meta');
      ogImage.property = 'og:image';
      ogImage.content = data.images[0];
      document.head.appendChild(ogImage);
    }

    // 5. Twitter cards
    const twitterCard = document.createElement('meta');
    twitterCard.name = 'twitter:card';
    twitterCard.content = 'summary_large_image';
    document.head.appendChild(twitterCard);

    const twitterTitle = document.createElement('meta');
    twitterTitle.name = 'twitter:title';
    twitterTitle.content = data.title || title;
    document.head.appendChild(twitterTitle);

    const twitterDescription = document.createElement('meta');
    twitterDescription.name = 'twitter:description';
    twitterDescription.content = data.description || '';
    document.head.appendChild(twitterDescription);

    if (data.images && data.images.length > 0) {
      const twitterImage = document.createElement('meta');
      twitterImage.name = 'twitter:image';
      twitterImage.content = data.images[0];
      document.head.appendChild(twitterImage);
    }

    // 6. Canonical URL
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = `${window.location.origin}${pathname}`;
    document.head.appendChild(canonical);

    // 7. Icons
    if (data.icons) {
      data.icons.forEach(icon => {
        const link = document.createElement('link');
        link.rel = icon.includes('apple') ? 'apple-touch-icon' : 'icon';
        link.type = 'image/x-icon';
        link.href = icon;
        document.head.appendChild(link);
      });
    }
  }, [pathname]);

  return null;
}