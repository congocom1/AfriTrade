import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';

const DEPARTMENTS = ['sales', 'support', 'warehouse', 'logistics', 'finance', 'administration', 'procurement', 'marketing', 'people', 'technology'];
const STATUSES = ['todo', 'in_progress', 'blocked', 'done'];
const PRIORITIES = ['normal', 'high', 'urgent'];
class WorkspaceError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const fail = (status: number, message: string): never => { throw new WorkspaceError(status, message); };
const text = (value: unknown, max: number, required = false) => {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, 'INVALID_INPUT');
  return (value as string).trim();
};
const rows = (value: any) => { if (!Array.isArray(value)) fail(503, 'UNAVAILABLE'); return value; };
const memberDepartments = (member: any) => Array.isArray(member?.departments) ? member.departments.filter((d: string) => DEPARTMENTS.includes(d)) : [];

export default async function handler(req: Request) {
  const respond = (data: any, status = 200) => addSecurityHeaders(Response.json(data, { status }));
  try {
    if (req.method !== 'POST') return respond({ error: 'METHOD_NOT_ALLOWED' }, 405);
    const client = createClientFromRequest(req);
    const user = await client.auth.me().catch(() => null);
    if (!user?.id) return respond({ error: 'SIGN_IN_REQUIRED' }, 401);
    const body = await req.json().catch(() => fail(400, 'INVALID_INPUT'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'INVALID_INPUT');
    const db = client.asServiceRole.entities;
    const admin = user.role === 'admin';
    const memberships = admin ? [] : rows(await db.EmployeeMembership.filter({ user_id: user.id }, '-created_date', 2));
    // Ambiguous or suspended membership always fails closed.
    const member = memberships.length === 1 && memberships[0].active === true ? memberships[0] : null;
    const departments = admin ? DEPARTMENTS : memberDepartments(member);
    if (body.action === 'bootstrap') {
      return respond({ departments, admin, access_scope: admin ? 'department' : member?.access_scope || 'assigned' });
    }
    if (!admin && !member) fail(403, 'ACCESS_DENIED');
    if (body.action === 'team') {
      if (!admin) fail(403, 'ACCESS_DENIED');
      return respond({ employees: rows(await db.EmployeeMembership.list('-created_date', 500)) });
    }
    if (body.action === 'save_employee') {
      if (!admin) fail(403, 'ACCESS_DENIED');
      const email = text(body.email, 254, true).toLowerCase();
      if (!Array.isArray(body.departments) || !body.departments.length || body.departments.some((d: string) => !DEPARTMENTS.includes(d))) fail(400, 'INVALID_INPUT');
      if (!['assigned', 'department'].includes(body.access_scope) || typeof body.active !== 'boolean') fail(400, 'INVALID_INPUT');
      const users = rows(await db.User.filter({ email }, '-created_date', 2));
      if (users.length !== 1) fail(400, 'ACCOUNT_NOT_FOUND');
      const target = users[0];
      const existing = rows(await db.EmployeeMembership.filter({ user_id: target.id }, '-created_date', 2));
      if (existing.length > 1) fail(409, 'DUPLICATE_MEMBERSHIP');
      const record = { user_id: target.id, email: target.email, display_name: target.full_name || target.email, departments: [...new Set(body.departments)], access_scope: body.access_scope, active: body.active };
      const employee = existing.length ? await db.EmployeeMembership.update(existing[0].id, record) : await db.EmployeeMembership.create(record);
      if (!employee?.id) fail(503, 'UNAVAILABLE');
      return respond({ employee });
    }
    const department = text(body.department, 40, true);
    if (!departments.includes(department)) fail(403, 'ACCESS_DENIED');
    if (body.action === 'tasks') {
      const filter: any = { department };
      if (!admin && member.access_scope !== 'department') filter.assignee_id = user.id;
      // Request one extra record to make truncation explicit to remote workers.
      const tasks = rows(await db.DepartmentTask.filter(filter, '-last_activity_at', 201));
      return respond({ tasks: tasks.slice(0, 200), truncated: tasks.length > 200 });
    }
    // Bounded, deterministic task-routing agent. It never creates approvals,
    // changes money, edits roles, or moves assigned tasks.
    if (body.action === 'automate_tasks') {
      if (!admin) fail(403, 'ACCESS_DENIED');
      if (typeof body.apply !== 'boolean') fail(400, 'INVALID_INPUT');
      const employees = rows(await db.EmployeeMembership.list('-created_date', 500));
      if (employees.length === 500) fail(409, 'EMPLOYEE_DIRECTORY_TRUNCATED');
      const eligible = employees.filter((e: any) => e.active === true && e.user_id && memberDepartments(e).includes(department));
      const unique = new Set(eligible.map((e: any) => e.user_id));
      if (unique.size !== eligible.length) fail(409, 'DUPLICATE_MEMBERSHIP');
      const taskList = rows(await db.DepartmentTask.filter({ department }, '-created_date', 201));
      if (taskList.length > 200) fail(409, 'TASK_QUEUE_TRUNCATED');
      const open = taskList.filter((task: any) => task.status !== 'done');
      const counts = new Map(eligible.map((e: any) => [e.user_id, open.filter((t: any) => t.assignee_id === e.user_id).length]));
      const unassigned = open.filter((task: any) => !task.assignee_id).slice(0, 50);
      const proposed = unassigned.map((task: any) => {
        const worker = [...eligible].sort((a: any, b: any) => (counts.get(a.user_id)! - counts.get(b.user_id)!) || a.user_id.localeCompare(b.user_id))[0];
        if (!worker) return null;
        counts.set(worker.user_id, counts.get(worker.user_id)! + 1);
        return { task_id: task.id, title: task.title, assignee_id: worker.user_id, assignee_name: worker.display_name || worker.email };
      }).filter(Boolean);
      if (!body.apply) return respond({ proposed, applied: 0, unassigned: unassigned.length, eligible: eligible.length });
      let applied = 0;
      for (const assignment of proposed as any[]) {
        // Re-read immediately before each write; do not overwrite an existing owner.
        const current = await db.DepartmentTask.get(assignment.task_id);
        if (!current?.id || current.department !== department || current.assignee_id || current.status === 'done') continue;
        const saved = await db.DepartmentTask.update(current.id, { assignee_id: assignment.assignee_id, assignee_name: assignment.assignee_name, updated_by_id: user.id, updated_by_name: 'Workforce Task Agent', last_activity_at: new Date().toISOString() });
        if (!saved?.id) fail(503, 'UNAVAILABLE');
        applied++;
      }
      return respond({ proposed, applied, unassigned: unassigned.length, eligible: eligible.length });
    }
    const resolveAssignee = async (value: unknown) => {
      const id = text(value ?? '', 200);
      if (!id) return { assignee_id: '', assignee_name: '' };
      const assigned = rows(await db.EmployeeMembership.filter({ user_id: id }, '-created_date', 2));
      if (assigned.length !== 1 || assigned[0].active !== true || !memberDepartments(assigned[0]).includes(department)) fail(400, 'INVALID_ASSIGNEE');
      return { assignee_id: id, assignee_name: assigned[0].display_name || assigned[0].email };
    };
    if (body.action === 'create_task') {
      if (!admin) fail(403, 'ACCESS_DENIED');
      const title = text(body.title, 160, true);
      const description = text(body.description ?? '', 4000);
      if (!PRIORITIES.includes(body.priority)) fail(400, 'INVALID_INPUT');
      const due = text(body.due_date ?? '', 10);
      if (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(Date.parse(due)) || new Date(due).toISOString().slice(0, 10) !== due)) fail(400, 'INVALID_INPUT');
      const assignee = await resolveAssignee(body.assignee_id);
      const task = await db.DepartmentTask.create({ department, title, description, ...assignee, status: 'todo', priority: body.priority, due_date: due, handoff_note: '', created_by_id: user.id, updated_by_id: user.id, updated_by_name: user.full_name || user.email, last_activity_at: new Date().toISOString() });
      if (!task?.id) fail(503, 'UNAVAILABLE');
      return respond({ task });
    }
    if (body.action === 'update_task') {
      const id = text(body.task_id, 200, true);
      const task = await db.DepartmentTask.get(id);
      if (!task?.id || task.department !== department || (!admin && task.assignee_id !== user.id)) fail(403, 'ACCESS_DENIED');
      if (!STATUSES.includes(body.status)) fail(400, 'INVALID_INPUT');
      const note = text(body.handoff_note ?? '', 2000);
      const assignee = admin && Object.hasOwn(body, 'assignee_id') ? await resolveAssignee(body.assignee_id) : {};
      const saved = await db.DepartmentTask.update(id, { ...assignee, status: body.status, handoff_note: note, updated_by_id: user.id, updated_by_name: user.full_name || user.email, last_activity_at: new Date().toISOString() });
      if (!saved?.id) fail(503, 'UNAVAILABLE');
      return respond({ task: saved });
    }
    return respond({ error: 'UNKNOWN_ACTION' }, 400);
  } catch (error) {
    if (error instanceof WorkspaceError) return respond({ error: error.message }, error.status);
    console.error('[employee-workspace] Request failed');
    return respond({ error: 'UNAVAILABLE' }, 503);
  }
}
