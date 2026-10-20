import { useEffect } from 'react';

const StructuredData = () => {
  useEffect(() => {
    // Clean up existing JSON-LD scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    // 1. Organization schema
    const organizationScript = document.createElement('script');
    organizationScript.type = 'application/ld+json';
    organizationScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "AfriTrade",
      "description": "Pan-African B2B & B2C marketplace",
      "url": window.location.href,
      "logo": "/logo.svg",
      "sameAs": [
        "https://www.facebook.com/afritrade",
        "https://twitter.com/afritrade",
        "https://instagram.com/afritrade"
      ]
    });
    document.head.appendChild(organizationScript);
    
    // 2. LocalBusiness schema
    const localBusinessScript = document.createElement('script');
    localBusinessScript.type = 'application/ld+json';
    localBusinessScript.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "AfriTrade",
      "description": "Pan-African B2B & B2C marketplace",
      "url": window.location.href,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "KE"
      },
      "areaServed": "Africa"
    });
    document.head.appendChild(localBusinessScript);
  }, []);

  return null;
};

export default StructuredData;
