import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const STATUS = {
  success: ['Synchronisé', 'bg-emerald-100 text-emerald-900'],
  failed: ['Échec', 'bg-red-100 text-red-900'],
  never: ['Jamais synchronisé', 'bg-secondary'],
};

export default function AirtableSourceCard({ source, syncing, onSync, onToggle, onDelete }) {
  const [label, cls] = STATUS[source.last_status] || STATUS.never;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold">{source.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {source.base_name || 'Base Airtable'} · {source.table_name || 'Table'} · {source.supplier_name || 'Tous les produits'}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            Référence : {source.sku_field}{source.stock_field ? ` · Stock : ${source.stock_field}` : ''}{source.price_field ? ` · Prix : ${source.price_field}` : ''}
          </p>
        </div>
        <Switch checked={source.active} onCheckedChange={onToggle} aria-label="Synchronisation automatique" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${cls}`}>{label}</span>
        {source.last_synced_at && <span className="text-muted-foreground">{new Date(source.last_synced_at).toLocaleString('fr-FR')}</span>}
        {source.last_status === 'success' && (
          <span>{source.last_rows} ligne(s) · {source.last_updated} mise(s) à jour · {source.last_created || 0} créé(s)</span>
        )}
      </div>
      {source.last_error && <p className="mt-2 text-xs text-destructive">{source.last_error}</p>}
      {source.last_unmatched?.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Sans correspondance : {source.last_unmatched.slice(0, 10).join(', ')}{source.last_unmatched.length > 10 ? '…' : ''}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={onSync} disabled={syncing}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Synchronisation…' : 'Synchroniser'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}