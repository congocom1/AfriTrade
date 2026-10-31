import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { usePortalData } from '@/hooks/usePortalData';
import { useCollectionView } from '@/hooks/useCollectionView';
import { workforceRequest } from '@/lib/workforce';
import { ADMIN_LINKS } from '@/lib/navLinks';
import DashboardShell from '@/components/DashboardShell';
import PortalStatus from '@/components/PortalStatus';
import PortalRefresh from '@/components/portal/PortalRefresh';
import CollectionToolbar from '@/components/portal/CollectionToolbar';
import CollectionPagination from '@/components/portal/CollectionPagination';
import { WorkforceForm } from '@/components/workforce/WorkforceForms';
import { Button } from '@/components/ui/button';

export default function EmployeeManagement() {
  const { t } = useTranslation();
  const query = usePortalData(['workforce-team'], () => workforceRequest({ action: 'team' }));
  const view = useCollectionView(query.data?.employees || [], ['email', 'display_name'], (e, filter) => filter === 'all' || (filter === 'active' ? e.active : !e.active));
  const [form, setForm] = useState(null);
  return <DashboardShell nav={ADMIN_LINKS} title={t('workforce.team')}>
    <div className="flex flex-wrap items-start justify-between gap-4"><p className="max-w-xl text-sm text-muted-foreground">{t('workforce.teamSubtitle')}</p><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/employee">{t('workforce.title')}</Link></Button><Button onClick={() => setForm({ kind: 'employee' })}><Plus className="h-4 w-4" />{t('workforce.add')}</Button></div></div>
    {query.loading || query.error ? <PortalStatus loading={query.loading} retry={query.reload} /> : <>
      <PortalRefresh onRefresh={query.reload} updatedAt={query.updatedAt} />
      <section className="space-y-5 rounded-xl border border-border bg-card p-5">
        <CollectionToolbar query={view.query} onQueryChange={view.setQuery} filter={view.filter} onFilterChange={view.setFilter} options={['all', 'active', 'inactive'].map(s => ({ value: s, label: t(s === 'all' ? 'portalComponents.all' : `workforce.${s}`) }))} />
        <div className="divide-y divide-border">{view.records.map(employee => <article key={employee.id} className="flex flex-wrap items-start justify-between gap-4 py-5"><div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold">{employee.display_name || employee.email}</h2><p className="mt-1 break-words text-xs text-muted-foreground">{employee.email}</p><div className="my-3 flex flex-wrap gap-2">{(employee.departments || []).map(d => <span key={d} className="rounded-md bg-secondary px-2 py-1 text-xs">{t(`workforce.${d}`)}</span>)}</div><p className="text-xs text-muted-foreground">{t(`workforce.${employee.active ? 'active' : 'inactive'}`)} · {t(`workforce.${employee.access_scope === 'department' ? 'department' : 'assigned'}`)}</p></div><Button variant="outline" size="sm" onClick={() => setForm({ kind: 'employee', initial: employee })}>{t('workforce.edit')}</Button></article>)}</div>
        {!view.records.length && <p className="py-8 text-center text-sm text-muted-foreground">{t('workforce.teamEmpty')}</p>}
        <CollectionPagination view={view} onPageChange={view.setPage} />
      </section>
    </>}
    {form && <WorkforceForm {...form} onClose={() => setForm(null)} onSaved={() => { void query.reload(); }} />}
  </DashboardShell>;
}
