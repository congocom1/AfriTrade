import { base44 } from '@/api/base44Client';

export const DEPARTMENTS = [
  { id: 'sales', icon: 'sales', tools: ['/admin/orders', '/admin/products'] },
  { id: 'support', tools: ['/support-inbox', '/admin/returns'] },
  { id: 'warehouse', tools: ['/warehouse', '/china-warehouse'] },
  { id: 'logistics', tools: ['/logistics-hub', '/delivery-map'] },
  { id: 'finance', tools: ['/finance', '/admin/payouts'] },
  { id: 'administration', tools: ['/admin/users', '/admin/compliance'] },
  { id: 'procurement', tools: ['/supplier-portal', '/admin/b2b'] },
  { id: 'marketing', tools: ['/marketing-analytics', '/admin/promotions'] },
  { id: 'people', tools: [] },
  { id: 'technology', tools: ['/developers', '/platform-health'] },
];
export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];
export async function workforceRequest(payload) {
  const response = await base44.functions.invoke('employee-workspace', payload);
  const data = response?.data;
  if (!data || typeof data !== 'object' || data.error) throw new Error(data?.error || 'UNAVAILABLE');
  if (payload.action === 'bootstrap' && (!Array.isArray(data.departments) || typeof data.admin !== 'boolean')) throw new Error('UNAVAILABLE');
  if (payload.action === 'tasks' && !Array.isArray(data.tasks)) throw new Error('UNAVAILABLE');
  if (payload.action === 'team' && !Array.isArray(data.employees)) throw new Error('UNAVAILABLE');
  if (payload.action === 'save_employee' && !data.employee?.id) throw new Error('UNAVAILABLE');
  if (['create_task', 'update_task'].includes(payload.action) && !data.task?.id) throw new Error('UNAVAILABLE');
  return data;
}
