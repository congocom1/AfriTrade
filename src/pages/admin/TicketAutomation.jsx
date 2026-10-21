import { usePortalData } from '@/hooks/usePortalData';
import { functionData } from '@/lib/portalData';
import PortalStatus from '@/components/PortalStatus';
import PortalRefresh from '@/components/portal/PortalRefresh';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { Button } from '@/components/ui/button';

const PRIORITY_STYLES = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-blue-100 text-blue-800',
};

export default function TicketAutomation() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');
  const [errors, setErrors] = useState({});
  const { data, loading, error, reload: load, updatedAt } = usePortalData(['ticket-automation', filter], async () => {
    const [tickets, stats] = await Promise.all([
      base44.functions.invoke('ticketAutomation', { action: 'list', status: filter || undefined }),
      base44.functions.invoke('ticketAutomation', { action: 'stats' }),
    ]);
    const rows = functionData(tickets).tickets;
    const summary = functionData(stats);
    if (!Array.isArray(rows) || typeof summary.total !== 'number') throw new Error('Invalid tickets response');
    return { tickets: rows, stats: summary };
  });
  const tickets = data?.tickets || [];
  const stats = data?.stats;

  const autoRoute = async (ticket_id) => {
    if (saving) return;
    setErrors({});
    setSaving(true);
    try {
      await base44.functions.invoke('ticketAutomation', { action: 'auto-route', ticket_id });
      await load();
    } catch (e) {
      setErrors((p) => ({ ...p, route: e?.message }));
    }
    setSaving(false);
  };

  const checkSLA = async () => {
    if (saving) return;
    setErrors({});
    setSaving(true);
    try {
      await base44.functions.invoke('ticketAutomation', { action: 'sla-breach' });
      await load();
    } catch (e) {
      setErrors((p) => ({ ...p, sla: e?.message }));
    }
    setSaving(false);
  };

  if (loading || error) return <PortalStatus loading={loading} retry={load} />;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-5 md:px-6">
      <DashboardNav title={t('tickets.title', 'Support Ticket Automation')} links={ADMIN_LINKS} />

      <PortalRefresh onRefresh={load} updatedAt={updatedAt} />
      {(errors.route || errors.sla) && <p role="alert" className="text-sm text-destructive">{t('portalStatus.actionFailed')}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Ticket, label: 'Total', value: stats?.total || 0, color: 'text-primary' },
          { icon: Clock, label: 'High priority', value: stats?.by_priority?.high || 0, color: 'text-red-600' },
          { icon: AlertTriangle, label: 'Open', value: stats?.by_status?.open || 0, color: 'text-amber-600' },
          { icon: CheckCircle, label: 'Resolved', value: stats?.by_status?.resolved || 0, color: 'text-emerald-600' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
            <k.icon className={`h-5 w-5 ${k.color}`} />
            <p className="mt-2 text-2xl font-bold">{k.value}</p>
            <p className="text-[11px] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={checkSLA} disabled={saving} variant="outline" className="gap-1.5">
          <AlertTriangle className="h-4 w-4" /> {t('common.checkSLA', 'Vérifier SLA')}
        </Button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">{t('common.all')}</option>
          <option value="open">Open</option>
          <option value="routed">Routed</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="space-y-2">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">{ticket.subject || ticket.ticket_id}</p>
                <p className="text-xs text-muted-foreground">{ticket.customer_email} · {ticket.category}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[ticket.priority] || 'bg-muted'}`}>{ticket.priority}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Équipe: {ticket.assigned_team || '—'}</span>
              <span>SLA: {ticket.sla_hours}h</span>
              <span>Auto: {ticket.auto_routed ? '✓' : '✗'}</span>
              <span className="capitalize">{ticket.status}</span>
            </div>
            {ticket.status === 'open' && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => autoRoute(ticket.id)} disabled={saving} className="gap-1.5">
                  <Zap className="h-3 w-3" /> {t('common.autoRoute', 'Routage auto')}
                </Button>
              </div>
            )}
          </div>
        ))}
        {!tickets.length && <p className="text-sm text-muted-foreground">{t('common.noTickets', 'Aucun ticket')}</p>}
      </div>
    </div>
  );
}
