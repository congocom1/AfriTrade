import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BriefcaseBusiness, Users, Plus, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { usePortalData } from '@/hooks/usePortalData';
import { useCollectionView } from '@/hooks/useCollectionView';
import { DEPARTMENTS, TASK_STATUSES, workforceRequest } from '@/lib/workforce';
import { ADMIN_LINKS } from '@/lib/navLinks';
import DashboardShell from '@/components/DashboardShell';
import PortalStatus from '@/components/PortalStatus';
import PortalRefresh from '@/components/portal/PortalRefresh';
import CollectionToolbar from '@/components/portal/CollectionToolbar';
import CollectionPagination from '@/components/portal/CollectionPagination';
import StatCard from '@/components/ops/StatCard';
import { Button } from '@/components/ui/button';
import { WorkforceForm } from '@/components/workforce/WorkforceForms';

export default function EmployeeWorkspace() {
  const { department } = useParams();
  const { t } = useTranslation();
  const access = usePortalData(['workforce-access'], () => workforceRequest({ action: 'bootstrap' }), { refreshInterval: 60_000 });
  if (access.loading || access.error) return <DashboardShell title={t('workforce.title')}><PortalStatus loading={access.loading} retry={access.reload} /></DashboardShell>;
  const departments = DEPARTMENTS.filter(d => access.data.departments.includes(d.id));
  const links = [{ to: '/employee', key: 'workforce.title', end: true }, ...departments.map(d => ({ to: `/employee/${d.id}`, key: `workforce.${d.id}` }))];
  if (department && !departments.some(d => d.id === department)) return <DashboardShell nav={links} title={t('workforce.title')}><AccessMessage /></DashboardShell>;
  return <DashboardShell nav={links} title={t(department ? `workforce.${department}` : 'workforce.title')}>
    {!department ? <>
      <div className="flex flex-wrap items-start justify-between gap-4"><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('workforce.intro')}</p>{access.data.admin && <Button asChild variant="outline"><Link to="/admin/employees"><Users className="h-4 w-4" />{t('workforce.team')}</Link></Button>}</div>
      {!departments.length ? <AccessMessage /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{departments.map(d => <Link key={d.id} to={`/employee/${d.id}`} className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
        <BriefcaseBusiness className="mb-5 h-5 w-5 text-primary" aria-hidden="true" /><h2 className="text-base font-semibold">{t(`workforce.${d.id}`)}</h2><p className="mb-6 mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{t(`workforce.${d.id}Description`)}</p><span className="flex items-center justify-between text-xs font-semibold text-primary">{t('workforce.open')}<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
      </Link>)}</div>}
    </> : <DepartmentQueue key={department} department={department} admin={access.data.admin} scope={access.data.access_scope} />}
  </DashboardShell>;
}
function AccessMessage() {
  const { t } = useTranslation();
  return <div className="rounded-xl border border-border bg-card p-8 text-center"><LockKeyhole aria-hidden="true" className="mx-auto mb-4 h-7 w-7 text-muted-foreground" /><h2 className="font-semibold">{t('workforce.noAccess')}</h2><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{t('workforce.noAccessDescription')}</p></div>;
}
function DepartmentQueue({ department, admin, scope }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const query = usePortalData(['workforce-tasks', department], () => workforceRequest({ action: 'tasks', department }), { refreshInterval: 30_000 });
  const team = usePortalData(['workforce-team'], () => workforceRequest({ action: 'team' }), { enabled: admin });
  const tasks = query.data?.tasks || [];
  const view = useCollectionView(tasks, ['title', 'description', 'assignee_name', 'handoff_note'], (task, filter) => filter === 'all' || task.status === filter);
  const [form, setForm] = useState(null);
  const [agent, setAgent] = useState(null);
  const [agentBusy, setAgentBusy] = useState(false);
  const [agentError, setAgentError] = useState('');
  const runAgent = async (apply) => {
    if (agentBusy) return;
    setAgentBusy(true); setAgentError('');
    try {
      const result = await workforceRequest({ action: 'automate_tasks', department, apply });
      setAgent(result);
      if (apply) await query.reload();
    } catch (error) { setAgentError(error?.message || 'UNAVAILABLE'); }
    finally { setAgentBusy(false); }
  };
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const overdue = tasks.filter(task => task.due_date && task.due_date < today && task.status !== 'done').length;
  if (query.loading || query.error) return <PortalStatus loading={query.loading} retry={query.reload} />;
  return <>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="max-w-2xl text-sm text-muted-foreground">{t(`workforce.${department}Description`)}</p><p className="mt-2 text-xs font-medium text-primary">{t(`workforce.${scope === 'department' ? 'department' : 'assigned'}`)}</p></div><div className="flex flex-wrap gap-3"><PortalRefresh onRefresh={query.reload} updatedAt={query.updatedAt} />{admin && <Button variant="outline" disabled={agentBusy} onClick={() => runAgent(false)}>Preview task agent</Button>}{admin && <Button onClick={() => setForm({ kind: 'create' })} disabled={team.loading || Boolean(team.error)}><Plus className="h-4 w-4" />{t('workforce.create')}</Button>}</div></div>
    {agentError && <p role="alert" className="text-sm text-destructive">Task agent: {agentError}</p>}
    {admin && agent && <section className="rounded-xl border border-border bg-card p-4 space-y-3" aria-live="polite"><h2 className="font-semibold">Employee task routing agent</h2><p className="text-sm text-muted-foreground">{agent.eligible} eligible employees · {agent.proposed.length} proposed assignments · {agent.applied} applied. Only unassigned, unfinished tasks are considered.</p><ul className="text-sm space-y-1">{agent.proposed.slice(0, 10).map(p => <li key={p.task_id}>{p.title} → {p.assignee_name}</li>)}</ul>{agent.proposed.length > 10 && <p className="text-xs text-muted-foreground">Showing 10 of {agent.proposed.length} suggestions.</p>}{agent.proposed.length > 0 && agent.applied === 0 && <Button disabled={agentBusy} onClick={() => runAgent(true)}>Approve and assign tasks</Button>}</section>}
    {admin && team.error && <PortalStatus retry={team.reload} />}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label={t('workforce.todo')} value={tasks.filter(task => task.status === 'todo').length} /><StatCard label={t('workforce.in_progress')} value={tasks.filter(task => task.status === 'in_progress').length} tone="good" /><StatCard label={t('workforce.blocked')} value={tasks.filter(task => task.status === 'blocked').length} tone={tasks.some(task => task.status === 'blocked') ? 'warn' : 'default'} /><StatCard label={t('workforce.overdue')} value={overdue} tone={overdue ? 'bad' : 'default'} /></div>
    <p className="text-xs text-muted-foreground">{t('workforce.loaded')}{query.data.truncated && <span role="status" className="ml-2 font-medium text-foreground">{t('workforce.truncated')}</span>}</p>
    <section className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5"><h2 className="font-semibold">{t('workforce.tasks')}</h2>
      <CollectionToolbar query={view.query} onQueryChange={view.setQuery} filter={view.filter} onFilterChange={view.setFilter} options={[{ value: 'all', label: t('portalComponents.all') }, ...TASK_STATUSES.map(s => ({ value: s, label: t(`workforce.${s}`) }))]} />
      <div className="divide-y divide-border">{view.records.map(task => <article key={task.id} className="flex flex-wrap items-start justify-between gap-4 py-5"><div className="min-w-0 flex-1 basis-64"><div className="mb-2 flex flex-wrap gap-2"><span className={`rounded-md px-2 py-1 text-xs font-medium ${task.status === 'blocked' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>{t(`workforce.${task.status}`)}</span><span className="rounded-md border border-border px-2 py-1 text-xs">{t(`workforce.${task.priority}`)}</span></div><h3 className="break-words text-sm font-semibold">{task.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{task.description}</p><p className="mt-1 text-xs text-muted-foreground">{task.assignee_name || t('workforce.unassigned')}{task.due_date ? ` · ${t('workforce.dueDate')}: ${task.due_date}` : ''}</p>{task.handoff_note && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">{task.handoff_note}</p>}{task.updated_by_name && <p className="mt-2 text-xs text-muted-foreground">{t('workforce.updatedBy', { name: task.updated_by_name })}</p>}</div>{(admin || task.assignee_id === user?.id) && <Button variant="outline" size="sm" onClick={() => setForm({ kind: 'update', initial: task })}>{t('workforce.details')}</Button>}</article>)}</div>
      {!view.records.length && <div className="py-8 text-center"><p className="text-sm font-medium">{t('workforce.empty')}</p><p className="mt-2 text-xs text-muted-foreground">{t('workforce.emptyDescription')}</p></div>}
      <CollectionPagination view={view} onPageChange={view.setPage} />
    </section>
    {admin && <section className="space-y-3"><h2 className="text-sm font-semibold">{t('workforce.adminTools')}</h2><div className="flex flex-wrap gap-2">{DEPARTMENTS.find(d => d.id === department).tools.map(to => <Button key={to} variant="outline" asChild><Link to={to}>{ADMIN_LINKS.find(l => l.to === to)?.label || t('workforce.tools')}</Link></Button>)}<Button asChild variant="outline"><Link to="/admin/employees">{t('workforce.team')}</Link></Button></div></section>}
    {form && <WorkforceForm {...form} admin={admin} department={department} employees={team.data?.employees || []} onClose={() => setForm(null)} onSaved={() => { void query.reload(); }} />}
  </>;
}
