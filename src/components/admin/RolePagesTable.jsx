import React from 'react';

/** One page row: its label, its path, and whether it is reserved to the role. */
function PageRow({ label, path, reserved }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-foreground">{label}</span>
        <span className="block truncate font-mono text-[10px] text-muted-foreground">{path}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          reserved ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground'
        }`}
      >
        {reserved ? 'Réservée' : 'Ouverte'}
      </span>
    </li>
  );
}

/** The pages a role may open: the shop's first, then the consoles it owns. */
export default function RolePagesTable({ shop, restricted }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-bold">Pages</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          La boutique et l’espace personnel, puis les consoles réservées à ce rôle.
        </p>
      </header>
      <ul className="divide-y divide-border">
        {shop.map((page) => (
          <PageRow key={page.path} label={page.label} path={page.path} reserved={false} />
        ))}
        {restricted.map((page) => (
          <PageRow key={page.path} label={page.label} path={page.path} reserved />
        ))}
      </ul>
    </section>
  );
}