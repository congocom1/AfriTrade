import React from 'react';

export const LOGO_URL = '/brand/logo-primary.svg';
export const LOGO_ICON_URL = '/brand/logo-icon.svg';

export default function BrandLogo({ className = 'h-3 w-auto' }) {
  return (
    <div className={`brand-lockup shrink-0 ${className}`} aria-label="AfriTrade">
      <img src={LOGO_ICON_URL} alt="" className="brand-lockup__mark" aria-hidden="true" />
      <span className="brand-lockup__name">Afri<span>Trade</span></span>
    </div>
  );
}
