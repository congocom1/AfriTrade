import React, { useState, useEffect } from 'react';

const CookieConsentBanner = () => {
  const [consented, setConsented] = useState(false);
  const [acceptedCategories, setAcceptedCategories] = useState('necessary');

  // Check if consent was already saved
  useEffect(() => {
    const saved = localStorage.getItem('cookie_consent');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConsented(parsed.consented === true);
      if (parsed.categories) {
        setAcceptedCategories(parsed.categories);
      }
    }
  }, []);

  // Save consent to localStorage
  useEffect(() => {
    if (consented) {
      localStorage.setItem('cookie_consent', JSON.stringify({
        consented: true,
        categories: acceptedCategories,
        timestamp: new Date().toISOString()
      }));
    } else {
      localStorage.removeItem('cookie_consent');
    }
  }, [consented]);

  if (consented) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 py-4"
      aria-label="Cookie consent banner"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5L2 12zM2 12l10 5 10-5" />
          </svg>
          <span className="text-sm text-muted-foreground">
            We use cookies and similar technologies to provide the best experience on our website. Learn more in our
            <a href="/privacy" className="text-primary font-medium underline">Privacy Policy</a>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAcceptedCategories('necessary')}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            aria-label="Accept necessary cookies only"
          >
            Necessary
          </button>
          <button
            onClick={() => setAcceptedCategories('analytics')}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            aria-label="Accept necessary and analytics cookies"
          >
            Analytics
          </button>
          <button
            onClick={() => setAcceptedCategories('marketing')}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            aria-label="Accept all cookies"
          >
            All
          </button>
          <button
            onClick={() => setConsented(true)}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Accept all cookies"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;