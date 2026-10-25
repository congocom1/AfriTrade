import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import OpsHeader from '@/components/ops/OpsHeader';
import StatCard from '@/components/ops/StatCard';
import DashboardNav from '@/components/DashboardNav';
import RolePagesTable from '@/components/admin/RolePagesTable';
import RoleDataTable from '@/components/admin/RoleDataTable';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { Input } from '@/components/ui/input';
import { DATA_NOTE, ROLES, SHOP_PAGES, roleData, rolePages, roleSummary } from '@/lib/accessRoles';

export default function AccessMatrix() {
  const [role, setRole] = useState('buyer');
  const [query, setQuery] = useState('');

  const summary = useMemo(() => roleSummary(role), [role]);
  const pages = useMemo(() => rolePages(role), [role]);
  const rows = useMemo(() => {
    const all = roleData(role);
    const needle = query.trim().toLowerCase();
    return needle ? all.filter((row) => row.name.toLowerCase().includes(needle)) : all;
  }, [role, query]);

  const current = ROLES.find((item) => item.id === role);

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title="Rôles & accès" links={ADMIN_LINKS} />

      <OpsHeader
        title="Rôles & accès"
        subtitle="Ce que chaque rôle peut ouvrir, lire et modifier, d’après les règles que le projet déclare lui-même."
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <StatCard label="Pages accessibles" value={summary.pages} hint={`dont ${summary.restrictedPages} réservées`} />
        <StatCard label="Consoles réservées" value={summary.restrictedPages} hint="hors boutique et compte" />
        <StatCard
          label="Types lisibles"
          value={summary.readable}
          hint={`sur ${summary.data} déclarés`}
        />
        <StatCard
          label="Types modifiables"
          value={summary.writable}
          tone={role === 'admin' ? 'warn' : 'default'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ROLES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRole(item.id)}
            title={item.tagline}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              role === item.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
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

      <p className="rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <strong className="text-foreground">{current.label}.</strong> {current.tagline} {current.scope} Obtenu par :{' '}
        {current.resolved}
      </p>

      <RolePagesTable shop={SHOP_PAGES} restricted={pages} />

      <RoleDataTable rows={rows} />

      <p className="text-[11px] text-muted-foreground">{DATA_NOTE}</p>
      <p className="text-[11px] text-muted-foreground">
        Les adhésions du personnel forment un axe distinct : un compte rattaché à un département ouvre en plus les
        consoles de ce département. Les règles sont déclarées dans le code du projet ; cette page les lit, elle ne les
        modifie pas.
      </p>
    </div>
  );
}