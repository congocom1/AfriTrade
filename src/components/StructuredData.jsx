import { useEffect } from 'react';

/** Organization + website facts only; avoid fabricated addresses and social accounts. */
export default function StructuredData() {
  useEffect(() => {
    const origin = 'https://afritrade-1.base44.app';
    const node = document.createElement('script');
    node.type = 'application/ld+json';
    node.dataset.afritradeSchema = 'true';
    node.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'AfriTrade', url: `${origin}/`, logo: `${origin}/brand/logo-primary.svg` },
      { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'AfriTrade', url: `${origin}/`, publisher: { '@id': `${origin}/#organization` }, inLanguage: ['fr', 'en'] },
    ] });
    document.head.appendChild(node);
    return () => node.remove();
  }, []);
  return null;
}
