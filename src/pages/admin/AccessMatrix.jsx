import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import OpsHeader from '@/components/ops/OpsHeader';
import StatCard from '@/components/ops/StatCard';
import AccessMatrixTable from '@/components/admin/AccessMatrixTable';
import DashboardNav from '@/components/DashboardNav';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { Input } from '@/components/ui/input';
import { ENTITIES, OPERATIONS, ROLE_TOTALS } from '@/lib/rlsMatrix';

const WRITE_OPERATIONS = ['create', 'update', 'delete'];

const chip = (active) =>
  `rounded-full px-3.5 py-1.5 text-xs font-semibold ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`;

/**
 * Who may read or change each type of data. The rules are declared with the
 * entity definitions, so this page reads them rather than editing them.
 */
export default function AccessMatrix() {
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ENTITIES.filter((entity) => {
      if (needle && !entity.name.toLowerCase().includes(needle)) return false;
      if (role === 'all') return true;
      return OPERATIONS.some((op) => entity.access[op.id]?.includes(role));
    });
  }, [role, query]);

  const openToAll = ENTITIES.filter((entity) => entity.access.read?.includes('public')).length;
  const openWrites = ENTITIES.filter((entity) =>
    WRITE_OPERATIONS.some((op) => entity.access[op]?.includes('public')),
  ).length;
  const adminOnly = ENTITIES.filter((entity) =>
    OPERATIONS.every((op) => !entity.access[op.id] || entity.access[op.id].every((id) => id === 'admin')),
  ).length;

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title="Matrice des accès" links={ADMIN_LINKS} />

      <OpsHeader
        title="Matrice des accès"
        subtitle="Qui peut lire ou modifier chaque type de donnée, d'après les règles que l'entité déclare elle-même."
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <StatCard label="Types de donnée" value={ENTITIES.length} />
        <StatCard label="Lecture ouverte à tous" value={openToAll} hint="visiteurs non connectés compris" tone={openToAll ? 'warn' : 'default'} />
        <StatCard label="Écriture ouverte à tous" value={openWrites} tone={openWrites ? 'bad' : 'good'} />
        <StatCard label="Réservées aux admins" value={adminOnly} hint="aucune autre audience" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setRole('all')} className={chip(role === 'all')}>
          Tous les rôles
        </button>
        {ROLE_TOTALS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRole(item.id)}
            title={item.hint}
            className={chip(role === item.id)}
          >
            {item.label} · {item.readable} en lecture
          </button>
        ))}
        <div className="relative ml-auto w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un type de donnée…"
            className="pl-9"
          />
        </div>
      </div>

      <AccessMatrixTable entities={rows} role={role} />

      <p className="text-[11px] text-muted-foreground">
        Une règle qui ne cite aucun compte connecté vaut pour tout le monde, visiteurs non connectés compris. Les règles
        sont déclarées avec chaque type de donnée dans le code du projet : cette page les lit, elle ne les modifie pas.
        {role !== 'all' ? ' Filtre actif : seules les lignes où ce rôle a un accès sont listées.' : ''}
      </p>
    </div>
  );
}