import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import DashboardNav from '@/components/DashboardNav';
import { ADMIN_LINKS } from '@/lib/navLinks';
import AirtableSourceForm from '@/components/inventory/AirtableSourceForm';
import AirtableSourceCard from '@/components/inventory/AirtableSourceCard';

export default function AirtableSync() {
  const [sources, setSources] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [syncing, setSyncing] = useState(null);

  const load = () => base44.entities.AirtableSource.list('name', 100).then(setSources);
  useEffect(() => {
    load();
    base44.entities.Supplier.list('name', 100).then(setSuppliers);
  }, []);

  const sync = async (id) => {
    setSyncing(id || 'all');
    await base44.functions.invoke('syncAirtableProducts', id ? { source_id: id, trigger: 'manual' } : { trigger: 'manual' });
    await load();
    setSyncing(null);
  };
  const add = async (data) => { await base44.entities.AirtableSource.create(data); await load(); };
  const toggle = async (s, on) => { await base44.entities.AirtableSource.update(s.id, { active: on }); await load(); };
  const remove = async (s) => { await base44.entities.AirtableSource.delete(s.id); await load(); };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
      <DashboardNav title="Synchronisation Airtable" links={ADMIN_LINKS} />
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        Choisissez une base et une table Airtable, puis indiquez le champ qui porte la référence produit (<b>SKU</b>).
        La synchronisation met à jour le stock, le prix, le titre et la photo des produits correspondants, et crée
        les produits absents. Une synchronisation automatique passe toutes les heures.
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-bold">Ajouter une source Airtable</p>
        <AirtableSourceForm suppliers={suppliers} onSave={add} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Sources connectées ({sources?.length ?? 0})</p>
        {sources?.length > 0 && (
          <button type="button" onClick={() => sync(null)} disabled={!!syncing} className="text-xs font-semibold underline">
            {syncing === 'all' ? 'Synchronisation…' : 'Tout synchroniser'}
          </button>
        )}
      </div>
      {!sources ? <div className="h-32 animate-pulse rounded-2xl bg-secondary" /> : sources.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune source Airtable connectée pour l'instant.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sources.map((s) => (
            <AirtableSourceCard
              key={s.id}
              source={s}
              syncing={syncing === s.id}
              onSync={() => sync(s.id)}
              onToggle={(on) => toggle(s, on)}
              onDelete={() => remove(s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}