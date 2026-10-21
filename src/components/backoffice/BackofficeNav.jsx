import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BackofficeNav() {
  const { t } = useTranslation();
  const groups = [
    [t('backoffice.groupGeneral'), [[t('backoffice.dashboard'), '/backoffice']]],
    [t('backoffice.groupClients'), [[t('backoffice.users'), '/admin/users'], [t('backoffice.tenants'), '/admin/tenants']]],
    [t('backoffice.groupCommerce'), [[t('backoffice.orders'), '/admin/orders'], [t('backoffice.products'), '/admin/products']]],
    [t('backoffice.groupOps'), [[t('backoffice.support'), '/support-inbox'], [t('backoffice.workflows'), '/admin/workflows']]],
    [t('backoffice.groupInsights'), [[t('backoffice.sales'), '/backoffice/sales'], [t('backoffice.analytics'), '/platform-analytics'], [t('backoffice.log'), '/admin/events'], [t('backoffice.settings'), '/admin/settings']]],
  ];
  return <aside className="w-full shrink-0 border-b border-border bg-card p-4 md:min-h-screen md:w-56 md:border-b-0 md:border-r">
    <Link to="/backoffice" className="block text-lg font-black tracking-tight">STACK+ <span className="text-xs font-medium text-muted-foreground">BACK-OFFICE</span></Link>
    <nav aria-label="Back-office" className="mt-5 flex gap-4 overflow-x-auto md:block md:space-y-5">
      {groups.map(([group, links]) => <div key={group} className="min-w-max md:min-w-0">
        <h2 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{group}</h2>
        <div className="flex gap-1 md:block">
          {links.map(([label, path]) => <NavLink key={path} to={path} end={path === '/backoffice'} className={({isActive}) => `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`}>{label}</NavLink>)}
        </div>
      </div>)}
    </nav>
    <Link to="/" className="mt-6 inline-block text-xs text-muted-foreground underline">{t('backoffice.backToShop')}</Link>
  </aside>;
}
