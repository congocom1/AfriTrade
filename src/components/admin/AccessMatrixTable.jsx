import React from 'react';
import { OPERATIONS, ROLES } from '@/lib/rlsMatrix';

const TONES = {
  public: 'bg-secondary text-foreground',
  owner: 'bg-primary/10 text-primary',
  admin: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
};

const labelFor = (id) => ROLES.find((role) => role.id === id)?.label || id;

const Muted = ({ children }) => <span className="text-[11px] text-muted-foreground">{children}</span>;

/** One rule's audiences, as chips. */
function Audiences({ ids, role }) {
  if (ids === null) return <Muted>Non déclaré</Muted>;
  if (role !== 'all') {
    return ids.includes(role)
      ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONES[role]}`}>{labelFor(role)}</span>
      : <Muted>—</Muted>;
  }
  if (!ids.length) return <Muted>Personne</Muted>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => (
        <span key={id} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONES[id] || TONES.public}`}>
          {labelFor(id)}
        </span>
      ))}
    </span>
  );
}

/** Every entity's rule per operation, with the audience that satisfies it. */
export default function AccessMatrixTable({ entities, role }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Type de donnée</th>
              {OPERATIONS.map((op) => (
                <th key={op.id} className="px-4 py-3 font-semibold">{op.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entities.map((entity) => (
              <tr key={entity.name} className="align-top">
                <td className="px-4 py-3 font-semibold">{entity.name}</td>
                {OPERATIONS.map((op) => (
                  <td key={op.id} className="px-4 py-3">
                    <Audiences ids={entity.access[op.id]} role={role} />
                  </td>
                ))}
              </tr>
            ))}
            {!entities.length && (
              <tr>
                <td colSpan={OPERATIONS.length + 1} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Aucun type de donnée pour ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}