import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardNav from '@/components/DashboardNav';

/**
 * Shared wrapper for admin and seller dashboards.
 * Provides consistent vertical rhythm and the role-nav bar.
 * Does NOT force a KPI grid or hero layout — each page keeps its own body.
 */
export default function DashboardShell({ nav, title, children, className, variant }) {
  const { t } = useTranslation();
  const paper = variant === 'paper';

  const baseClasses = paper ? 'paper-console portal-page' : 'portal-page trade-dashboard space-y-6 pb-8';
  const conditionalClasses = className ? ` ${className}` : '';

  return (
    <div className={baseClasses + conditionalClasses}>
      <DashboardNav title={title || t('dashboard.title')} links={nav} variant={variant} />
      {children}
    </div>
  );
}