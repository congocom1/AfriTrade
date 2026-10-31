import React from 'react';
import { Check, Minus } from 'lucide-react';
import { OPERATIONS } from '@/lib/rlsMatrix';

/** One entity per row; a check marks an operation this role may perform. */
export default function RoleDataTable({ rows }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold">Données</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Par type de donnée, ce que ce rôle peut lire ou changer d’après les règles déclarées.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-secondary/60 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Type de donnée</th>
              {OPERATIONS.map((op) => (
                <th key={op.id} className="px-4 py-3 font-semibold">
                  {op.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-2.5 font-semibold">{row.name}</td>
                {OPERATIONS.map((op) => (
                  <td key={op.id} className="px-4 py-2.5">
                    {row.ops[op.id] ? (
                      <Check className="h-3.5 w-3.5 text-primary" aria-label="oui" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" aria-label="non" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={OPERATIONS.length + 1}
                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                >
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