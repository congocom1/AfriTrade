import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardNav from '@/components/DashboardNav';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatDateTime, formatUsdAmount } from '@/lib/format';

const OPEN_STATUSES = ['submitted', 'responded'];

export default function B2BQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionState, setActionState] = useState({ id: '', error: '' });

  const load = useCallback(async () => {
    if (!user?.email) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setQuotes(await base44.entities.QuoteRequest.filter({ buyer_email: user.email }, '-created_date', 100));
    } catch (err) {
      setError(err?.message || 'Unable to load your quote requests.');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => base44.entities.QuoteRequest.subscribe((event) => {
    if (event.data?.buyer_email === user?.email) load();
  }), [load, user?.email]);

  const openQuotes = useMemo(() => quotes.filter((quote) => OPEN_STATUSES.includes(quote.status)).length, [quotes]);

  const updateQuote = async (quote, action) => {
    setActionState({ id: quote.id, error: '' });
    try {
      const { data } = await base44.functions.invoke('quoteRequest', { action, quote_id: quote.id });
      setQuotes((items) => items.map((item) => item.id === data.quote.id ? data.quote : item));
      setActionState({ id: '', error: '' });
    } catch (actionError) {
      setActionState({ id: quote.id, error: actionError?.message || 'That quote could not be updated. Please try again.' });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-5">
      <DashboardNav title="My B2B Quotes" links={[{ to: '/b2b', label: 'Wholesale marketplace' }, { to: '/b2b/quotes', label: 'My quotes', end: true }]} />
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <b>{openQuotes}</b> active request{openQuotes === 1 ? '' : 's'}. Supplier responses and negotiated unit prices will appear here.
      </div>
      {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"><span>{error}</span><Button variant="outline" size="sm" onClick={load}>Try again</Button></div>}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-secondary" /> : quotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><p>You have not requested any wholesale quotes yet.</p><Button asChild className="mt-4" size="sm"><Link to="/b2b">Browse wholesale products</Link></Button></div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const actionPending = actionState.id === quote.id;
            return <article key={quote.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{quote.product_title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{quote.quote_number} · {quote.supplier_name || quote.seller_name || 'AfriTrade supplier'} · {formatDateTime(quote.created_date)}</p>
                </div>
                <StatusBadge status={quote.status} />
              </div>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                <p><span className="text-muted-foreground">Quantity: </span><b>{quote.quantity}</b></p>
                  <p><span className="text-muted-foreground">Target: </span><b>{quote.target_price_usd ? formatUsdAmount(quote.target_price_usd) : '—'}</b></p>
                  <p><span className="text-muted-foreground">Quoted: </span><b>{quote.quoted_unit_price_usd ? formatUsdAmount(quote.quoted_unit_price_usd) : 'Pending'}</b></p>
              </div>
              {quote.message && <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm">{quote.message}</p>}
              {quote.seller_response && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950"><b>Supplier response:</b> {quote.seller_response}</p>}
              {actionState.error && actionPending && <p className="mt-3 text-sm text-destructive">{actionState.error}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {quote.status === 'responded' && <Button size="sm" disabled={actionPending} onClick={() => updateQuote(quote, 'accept')}>{actionPending ? 'Updating…' : 'Accept quote'}</Button>}
                {OPEN_STATUSES.includes(quote.status) && <Button variant="outline" size="sm" disabled={actionPending} onClick={() => updateQuote(quote, 'cancel')}>Cancel request</Button>}
              </div>
            </article>
          })}
        </div>
      )}
    </div>
  );
}