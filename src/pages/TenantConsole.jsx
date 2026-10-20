import { usePortalData } from '@/hooks/usePortalData';
import { loadRecordGroups, functionData } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/EmptyState';
import TenantForm from '@/components/saas/TenantForm';
import TenantDomainPanel from '@/components/saas/TenantDomainPanel';
import TenantTeamPanel from '@/components/saas/TenantTeamPanel';
import TenantPlanPanel from '@/components/saas/TenantPlanPanel';
import { useActiveTenant } from '@/lib/tenancy';
import { loadPlans } from '@/lib/plans';

export default function TenantConsole() {
  const { t } = useTranslation();
  const { tenant, tenants, isAdmin, loading, error: scopeError, selectTenant, reload } = useActiveTenant();
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const { data: access, loading: checkingAccess, error: accessError, reload: reloadAccess } = usePortalData(['tenant-access', tenant?.id], async () => {
    const result = functionData(await base44.functions.invoke('manageTenantTeam', { action: 'access', tenantId: tenant.id }));
    return { ...result, permissions: Array.isArray(result.permissions) ? result.permissions : [] };
  }, { enabled: Boolean(tenant) });
  const has = (key) => access?.owner || access?.permissions?.includes(key);
  const { data, loading: loadingData, error: dataError, reload: loadTenantData } = usePortalData(['tenant-data', tenant?.id, Boolean(access?.owner), (access?.permissions || []).join(',')], () => loadRecordGroups({
    subscriptions: () => access.owner ? base44.entities.Subscription.filter({ tenant_id: tenant.id }, '-created_date', 1) : [],
    domains: () => access.owner ? base44.entities.TenantDomain.filter({ tenant_id: tenant.id }, '-created_date', 20) : [],
    members: async () => has('TEAM_MANAGE') ? functionData(await base44.functions.invoke('manageTenantTeam', { action: 'list', tenantId: tenant.id })).members : [],
    invoices: () => access.owner ? base44.entities.TenantInvoice.filter({ tenant_id: tenant.id }, '-created_date', 20) : [],
    products: () => access.owner ? base44.entities.Product.filter({ tenant_id: tenant.id }, '-created_date', 500) : [],
    sellers: () => access.owner ? base44.entities.Seller.filter({ tenant_id: tenant.id }, '-created_date', 200) : [],
    plans: () => access.owner ? loadPlans() : [],
  }), { enabled: Boolean(tenant && access?.granted) });
  const plans = data?.plans || [];
  const subscription = data?.subscriptions?.[0] || null;
  const domains = data?.domains || [];
  const members = data?.members || [];
  const invoices = data?.invoices || [];
  const usage = { products: data?.products?.length || 0, stores: 1, sellers: data?.sellers?.length || 0, members: members.length };

  const saveTenant = async (form) => {
    setBusy(true);
    setSaveError(false);
    try {
      await base44.entities.Tenant.update(tenant.id, { ...form, owner_email: tenant.owner_email });
      await reload();
    } catch { setSaveError(true); } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <PortalStatus loading />;
  }

  if (scopeError) return <PortalStatus retry={reload} />;

  if (!tenant) {
    return (
      <EmptyState
        icon={Store}
        title={t('tenantConsole.emptyTitle')}
        description={t('tenantConsole.emptyDesc')}
        actionLabel={t('tenantConsole.emptyAction')}
        actionTo="/tenant-onboarding"
      />
    );
  }

  if (accessError) return <PortalStatus retry={reloadAccess} />;
  if (checkingAccess || !access) return <PortalStatus loading />;
  if (!access.granted) return <p role="alert" className="p-6">Accès refusé à cette enseigne.</p>;
  if (loadingData || dataError) return <PortalStatus loading={loadingData} retry={loadTenantData} />;

  return (
    <div className="space-y-5 py-2">
      {saveError && <p role="alert" className="text-sm text-destructive">{t('portalStatus.actionFailed')}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold md:text-2xl">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t('tenantConsole.meta', { email: tenant.owner_email || t('tenantConsole.noOwner'), status: tenant.status })}
          </p>
        </div>
        {tenants.length > 1 && (
          <select
            aria-label={t('tenantConsole.platformConsole')}
            value={tenant.id}
            onChange={(e) => selectTenant(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => { window.location.href = '/admin/tenants'; }}>
            {t('tenantConsole.platformConsole')}
          </Button>
        )}
      </div>

      {access.owner && <TenantPlanPanel tenant={tenant} subscription={subscription} plans={plans} invoices={invoices} usage={usage} onChange={loadTenantData} />}

      {access.owner && <TenantDomainPanel tenant={tenant} domains={domains} onChange={loadTenantData} />}

      {has('TEAM_MANAGE') && <TenantTeamPanel tenant={tenant} members={members} onChange={loadTenantData} permissions={access.permissions} owner={access.owner} />}

      {access.owner && <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <h2 className="font-heading text-base font-bold">{t('tenantConsole.brandTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('tenantConsole.brandDesc')}</p>
          </div>
          <TenantForm initial={tenant} lockOwnerEmail onSubmit={saveTenant} submitting={busy} submitLabel={t('tenantConsole.saveIdentity')} />
        </CardContent>
      </Card>}
      {!has('TEAM_MANAGE') && !access.owner && <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Vos droits portent sur les opérations de cette enseigne, accessibles depuis votre espace métier.</p>}
    </div>
  );
}