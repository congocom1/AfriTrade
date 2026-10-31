import React, { useEffect, useState } from 'react';
import LegacySelect from '@/components/ui/legacy-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const EMPTY = {
  name: '', base_id: '', table_id: '', sku_field: '', title_field: '',
  price_field: '', stock_field: '', image_field: '', description_field: '', supplier_id: '',
};

export default function AirtableSourceForm({ suppliers, onSave }) {
  const [f, setF] = useState(EMPTY);
  const [bases, setBases] = useState(null);
  const [tables, setTables] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  const loadBases = async () => {
    setError('');
    setBases(null);
    try {
      const res = await base44.functions.invoke('airtableBases', {});
      setBases(res.data?.bases || []);
    } catch (e) {
      setBases([]);
      setError(e?.response?.data?.error || "Impossible de lire les bases Airtable");
    }
  };

  useEffect(() => { loadBases(); }, []);

  const pickBase = async (e) => {
    const baseId = e.target.value;
    setF((prev) => ({ ...prev, base_id: baseId, table_id: '', sku_field: '', title_field: '', price_field: '', stock_field: '', image_field: '', description_field: '' }));
    setTables(null);
    if (!baseId) return;
    try {
      const res = await base44.functions.invoke('airtableBases', { base_id: baseId });
      setTables(res.data?.tables || []);
    } catch (err) {
      setTables([]);
      setError(err?.response?.data?.error || 'Impossible de lire les tables de cette base');
    }
  };

  const table = (tables || []).find((t) => t.id === f.table_id);
  const fieldOptions = (table?.fields || []).map((x) => x.name);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const base = (bases || []).find((b) => b.id === f.base_id);
    const sup = suppliers.find((s) => s.id === f.supplier_id);
    await onSave({
      ...f,
      name: f.name,
      base_name: base?.name || '',
      table_name: table?.name || '',
      supplier_name: sup?.name || '',
      active: true,
      last_status: 'never',
    });
    setF(EMPTY);
    setTables(null);
    setSaving(false);
  };

  const field = (key, label) => (
    <LegacySelect value={f[key]} onChange={set(key)} className="h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm">
      <option value="">{label}</option>
      {fieldOptions.map((name) => <option key={name} value={name}>{name}</option>)}
    </LegacySelect>
  );

  return (
    <form onSubmit={submit} className="grid gap-2 md:grid-cols-2">
      <Input placeholder="Nom de la source" value={f.name} onChange={set('name')} />
      <LegacySelect value={f.base_id} onChange={pickBase} className="h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm">
        <option value="">{bases === null ? 'Chargement des bases…' : 'Choisir une base Airtable'}</option>
        {(bases || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </LegacySelect>
      <LegacySelect value={f.table_id} onChange={set('table_id')} className="h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm">
        <option value="">{f.base_id ? (tables === null ? 'Chargement…' : 'Choisir une table') : 'Choisir une table'}</option>
        {(tables || []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </LegacySelect>
      <LegacySelect value={f.supplier_id} onChange={set('supplier_id')} className="h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm">
        <option value="">Tous les produits</option>
        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </LegacySelect>
      {field('sku_field', 'Champ référence (SKU)')}
      {field('stock_field', 'Champ stock')}
      {field('price_field', 'Champ prix (USD)')}
      {field('title_field', 'Champ titre')}
      {field('image_field', 'Champ photo')}
      {field('description_field', 'Champ description')}
      {bases && bases.length === 0 && !error && (
        <p className="text-xs text-muted-foreground md:col-span-2">
          Aucune base trouvée dans le compte Airtable connecté. Créez une base dans ce compte, puis rechargez.
        </p>
      )}
      {error && <p className="text-xs text-destructive md:col-span-2">{error}</p>}
      <div className="flex gap-2 md:col-span-2">
        <Button type="submit" disabled={!f.name || !f.base_id || !f.table_id || !f.sku_field || saving}>
          {saving ? 'Enregistrement…' : 'Connecter cette table'}
        </Button>
        <Button type="button" variant="outline" onClick={loadBases}>Recharger les bases</Button>
      </div>
    </form>
  );
}