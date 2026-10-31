import React, { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { notifyLoadError } from '@/lib/safeList';

const invoke = (payload) => base44.functions.invoke('syncMobileMoneySheet', payload).then((r) => r.data);

const formatDate = (value) => (value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');

/**
 * Historique comptable : option de synchronisation automatique des transactions
 * Mobile Money réussies vers une feuille de calcul Google Sheets dédiée.
 */
export default function SheetSyncSettings() {
  const [status, setStatus] = useState(null);
  const [sheetInput, setSheetInput] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await invoke({ action: 'status' });
    setStatus(data);
    setSheetInput(data.spreadsheet_url || data.spreadsheet_id || '');
    return data;
  }, []);

  useEffect(() => { load().catch(notifyLoadError); }, [load]);

  const run = async (key, action, payload = {}, success) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      const data = await action();
      await load();
      if (success) setMessage(typeof success === 'function' ? success(data) : success);
      return data;
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Opération impossible');
    } finally {
      setBusy('');
    }
  };

  const toggle = (next) => {
    setStatus((prev) => ({ ...prev, enabled: next }));
    run('toggle', () => invoke({ action: 'setEnabled', enabled: next }), {},
      next ? 'Synchronisation automatique activée.' : 'Synchronisation automatique désactivée.');
  };

  if (!status) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;

  const ready = Boolean(status.spreadsheet_id);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start gap-3">
        <span className="rounded-full bg-secondary p-2 text-primary"><FileSpreadsheet className="h-4 w-4" /></span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold">Historique comptable Google Sheets</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Chaque transaction Mobile Money réussie est ajoutée automatiquement à une feuille de calcul dédiée.
          </p>
        </div>
      </header>

      <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-border p-3.5">
        <div>
          <Label htmlFor="sheet-auto" className="text-sm font-semibold">Synchronisation automatique</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Une ligne par paiement confirmé, sans doublon.
          </p>
        </div>
        <Switch
          id="sheet-auto"
          checked={Boolean(status.enabled)}
          disabled={busy === 'toggle' || !ready}
          onCheckedChange={toggle}
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="sheet-url" className="text-xs font-semibold">Feuille de calcul</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="sheet-url"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            placeholder="Collez le lien de votre feuille Google Sheets"
            className="min-w-[240px] flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy === 'save' || !sheetInput.trim()}
            onClick={() => run('save', () => invoke({ action: 'setSheet', spreadsheet_id: sheetInput }), {}, 'Feuille enregistrée.')}
          >
            {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Enregistrer
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy === 'create'}
            onClick={() => run('create', () => invoke({ action: 'createSheet' }), {}, 'Feuille dédiée créée.')}
          >
            {busy === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Créer une feuille dédiée
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">{status.synced_count}</strong> transaction(s) synchronisée(s)
          {status.pending_count > 0 && <> · <strong className="text-foreground">{status.pending_count}</strong> en attente</>}
          {status.last_synced_at && <> · dernière écriture {formatDate(status.last_synced_at)}</>}
        </p>
        <div className="flex items-center gap-2">
          {status.spreadsheet_url && (
            <a
              href={status.spreadsheet_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Ouvrir la feuille <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy === 'sync' || !ready}
            onClick={() => run('sync', () => invoke({ action: 'syncAll' }), {},
              (data) => `${data.synced} transaction(s) synchronisée(s)${data.remaining ? ` · ${data.remaining} restante(s)` : ''}.`)}
          >
            {busy === 'sync' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Synchroniser maintenant
          </Button>
        </div>
      </div>

      {message && <p className="mt-2 text-xs font-semibold text-primary">{message}</p>}
      {(error || status.last_error) && (
        <p role="alert" className="mt-2 text-xs font-semibold text-destructive">{error || status.last_error}</p>
      )}
    </section>
  );
}