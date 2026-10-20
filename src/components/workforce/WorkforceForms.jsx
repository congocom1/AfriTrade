import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/portal/FormField';
import { DEPARTMENTS, TASK_STATUSES, workforceRequest } from '@/lib/workforce';

const selectClass = 'h-11 w-full rounded-md border border-input bg-card px-3 text-sm';
function errorKey(error) {
  const code = error?.response?.data?.error || error?.message;
  return ['ACCOUNT_NOT_FOUND', 'INVALID_ASSIGNEE', 'INVALID_INPUT', 'ACCESS_DENIED', 'UNAVAILABLE', 'DUPLICATE_MEMBERSHIP'].includes(code) ? code : 'error';
}

export function WorkforceForm({ kind, initial, department, employees = [], admin = false, onClose, onSaved }) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initial || (kind === 'employee' ? { email: '', departments: [], access_scope: 'assigned', active: true } : { title: '', description: '', assignee_id: '', priority: 'normal', due_date: '' }));
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const set = (key, value) => setValues(v => ({ ...v, [key]: value }));
  const employee = kind === 'employee';
  const update = kind === 'update';
  const title = t(`workforce.${employee ? (initial ? 'edit' : 'add') : update ? 'details' : 'create'}`);
  const submit = async event => {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      await workforceRequest(employee ? { action: 'save_employee', email: values.email, departments: values.departments, access_scope: values.access_scope, active: values.active } : update ? { action: 'update_task', department, task_id: initial.id, status: values.status, handoff_note: values.handoff_note || '', ...(admin ? { assignee_id: values.assignee_id || '' } : {}) } : { action: 'create_task', department, ...values });
      onSaved(); onClose();
    } catch (err) { setError(errorKey(err)); }
    finally { pending.current = false; setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !pending.current) onClose(); }}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{employee ? t('workforce.accountHelp') : update ? initial.title : t(`workforce.${department}Description`)}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-4">
          {employee ? <>
            <FormField label={t('workforce.email')}><Input type="email" required maxLength={254} readOnly={Boolean(initial)} value={values.email} onChange={e => set('email', e.target.value)} /></FormField>
            <fieldset className="rounded-lg border border-border p-4"><legend className="px-1 text-xs font-medium">{t('workforce.departments')}</legend>
              <div className="grid gap-2 sm:grid-cols-2">{DEPARTMENTS.map(d => <label key={d.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={values.departments.includes(d.id)} onChange={e => set('departments', e.target.checked ? [...values.departments, d.id] : values.departments.filter(id => id !== d.id))} />{t(`workforce.${d.id}`)}</label>)}</div>
            </fieldset>
            <FormField label={t('workforce.access')} hint={t('workforce.scopeHelp')}><select className={selectClass} value={values.access_scope} onChange={e => set('access_scope', e.target.value)}><option value="assigned">{t('workforce.assigned')}</option><option value="department">{t('workforce.department')}</option></select></FormField>
            <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={values.active} onChange={e => set('active', e.target.checked)} />{t('workforce.active')}</label>
          </> : update ? <>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{initial.description}</p>
            {admin && <FormField label={t('workforce.assignee')}><select className={selectClass} value={values.assignee_id || ''} onChange={e => set('assignee_id', e.target.value)}><option value="">{t('workforce.unassigned')}</option>{employees.filter(e => e.active && e.departments?.includes(department)).map(e => <option key={e.id} value={e.user_id}>{e.display_name || e.email}</option>)}</select></FormField>}
            <FormField label={t('workforce.status')}><select className={selectClass} value={values.status} onChange={e => set('status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s} value={s}>{t(`workforce.${s}`)}</option>)}</select></FormField>
            <FormField label={t('workforce.handoff')} hint={t('workforce.handoffHelp')}><Textarea maxLength={2000} rows={4} value={values.handoff_note || ''} onChange={e => set('handoff_note', e.target.value)} /></FormField>
          </> : <>
            <FormField label={t('workforce.taskTitle')}><Input required maxLength={160} value={values.title} onChange={e => set('title', e.target.value)} /></FormField>
            <FormField label={t('workforce.description')}><Textarea rows={4} maxLength={4000} value={values.description} onChange={e => set('description', e.target.value)} /></FormField>
            <FormField label={t('workforce.assignee')}><select className={selectClass} value={values.assignee_id} onChange={e => set('assignee_id', e.target.value)}><option value="">{t('workforce.unassigned')}</option>{employees.filter(e => e.active && e.departments?.includes(department)).map(e => <option key={e.id} value={e.user_id}>{e.display_name || e.email}</option>)}</select></FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t('workforce.priority')}><select className={selectClass} value={values.priority} onChange={e => set('priority', e.target.value)}>{['normal', 'high', 'urgent'].map(s => <option key={s} value={s}>{t(`workforce.${s}`)}</option>)}</select></FormField>
              <FormField label={t('workforce.dueDate')}><Input type="date" value={values.due_date} onChange={e => set('due_date', e.target.value)} /></FormField>
            </div>
          </>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{t(`workforce.${error}`)}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>{t('workforce.cancel')}</Button><Button type="submit" disabled={busy || (employee && !values.departments.length)}>{t(`workforce.${busy ? 'saving' : 'save'}`)}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
