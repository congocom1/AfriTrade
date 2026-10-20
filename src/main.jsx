import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import '@/i18n';
import SEOMetadata from '@/components/SEOMetadata';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import StructuredData from '@/components/StructuredData';
import Base44Router from '@/components/Base44Router';

// Apply the OS colour scheme synchronously, before first paint.
// This must NOT be a useEffect call: this file is entrypoint code, not a
// component, so React throws "Invalid hook call" and module evaluation aborts
// before createRoot().render() below ever runs -- which shows up as a blank
// page with no error to explain it. Setting the class inline also avoids a
// flash of the wrong theme on load.
if (typeof window !== 'undefined' && window.matchMedia) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', prefersDark);
  // Set lang attribute for screen readers and SEO
  document.documentElement.lang = 'en';
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <SEOMetadata />
    <CookieConsentBanner />
    <StructuredData />
    <Base44Router />
    <App />
  </React.Fragment>
);
