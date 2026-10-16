import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useActiveSeller } from '@/lib/seller';
import { SELLER_LINKS } from '@/lib/navLinks';
import { formatDateTime, formatUsdAmount } from '@/lib/format';

export default function SellerQuotes() {
  const { seller } = useActiveSeller();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [submittingId, setSubmittingId] = useState('');

  const load = useCallback(async () => {
    if (!seller?.email) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setQuotes(await base44.entities.QuoteRequest.filter({ seller_email: seller.email }, '-created_date', 100));
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load wholesale requests.');
    } finally {
      setLoading(false);
    }
  }, [seller?.email]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => base44.entities.QuoteRequest.subscribe((event) => {
    if (event.data?.seller_email === seller?.email) load();
  }), [load, seller?.email]);

  const pending = useMemo(() => quotes.filter((quote) => quote.status === 'submitted').length, [quotes]);
  const setDraft = (id, field, value) => setDrafts((all) => ({ ...all, [id]: { ...(all[id] || {}), [field]: value, ...(field === 'error' ? {} : { error: '' }) } }));

  const respond = async (quote) => {
    const draft = drafts[quote.id] || {};
    const price = Number(draft.price);
    if (!(price > 0)) {
      setDraft(quote.id, 'error', 'Enter a unit price greater than zero.');
      return;
    }
    setSubmittingId(quote.id);
    try {
      const { data } = await base44.functions.invoke('quoteRequest', { action: 'respond', quote_id: quote.id, quoted_unit_price_usd: price, seller_response: String(draft.message || '').trim() });
      setQuotes((rows) => rows.map((row) => row.id === data.quote.id ? data.quote : row));
    } catch (submitError) {
      setDraft(quote.id, 'error', submitError?.message || 'The quote could not be sent. Please try again.');
    } finally {
      setSubmittingId('');
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <DashboardNav title="Wholesale Quote Inbox" links={SELLER_LINKS} />
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><b>{pending}</b> buyer quote request{pending === 1 ? '' : 's'} awaiting your reply.</p>
      {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"><span>{error}</span><Button variant="outline" size="sm" onClick={load}>Try again</Button></div>}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-secondary" /> : !seller ? (
        <p className="text-sm text-muted-foreground">Choose a seller workspace to manage B2B quotes.</p>
      ) : !quotes.length ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No wholesale requests yet. Enable B2B on a product to receive quote requests.</p>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const draft = drafts[quote.id] || {};
            const submitting = submittingId === quote.id;
            return <article key={quote.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{quote.product_title}</p><p className="mt-1 text-xs text-muted-foreground">{quote.quote_number} · {quote.buyer_name || quote.buyer_email} · {formatDateTime(quote.created_date)}</p></div><StatusBadge status={quote.status} /></div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p><span className="text-muted-foreground">Quantity: </span><b>{quote.quantity}</b></p><p><span className="text-muted-foreground">Buyer target: </span><b>{quote.target_price_usd ? formatUsdAmount(quote.target_price_usd) : '—'}</b></p><p><span className="text-muted-foreground">Country: </span><b>{quote.buyer_country || '—'}</b></p></div>
              {quote.message && <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">{quote.message}</p>}
              {quote.status === 'submitted' ? <div className="mt-4 space-y-2"><div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]"><Input type="number" min="0.01" step="0.01" placeholder="Unit price (USD)" value={draft.price || ''} onChange={(event) => setDraft(quote.id, 'price', event.target.value)} /><Input maxLength={2000} placeholder="Message to buyer (optional)" value={draft.message || ''} onChange={(event) => setDraft(quote.id, 'message', event.target.value)} /><Button size="sm" disabled={submitting} onClick={() => respond(quote)}>{submitting ? 'Sending…' : 'Send quote'}</Button></div>{draft.error && <p className="text-sm text-destructive">{draft.error}</p>}</div> : <p className="mt-3 text-sm text-muted-foreground">Quoted unit price: <b>{quote.quoted_unit_price_usd ? formatUsdAmount(quote.quoted_unit_price_usd) : '—'}</b>{quote.seller_response ? ` · ${quote.seller_response}` : ''}</p>}
            </article>;
          })}
        </div>
      )}
    </div>
  );
}