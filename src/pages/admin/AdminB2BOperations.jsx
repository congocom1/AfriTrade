import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck, XCircle } from 'lucide-react';
import DashboardNav from '@/components/DashboardNav';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { ADMIN_LINKS } from '@/lib/navLinks';
import { formatDateTime } from '@/lib/format';

export default function AdminB2BOperations() {
  const [quotes, setQuotes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [quoteRows, supplierRows, productRows] = await Promise.all([
        base44.entities.QuoteRequest.list('-created_date', 200),
        base44.entities.Supplier.list('name', 200),
        base44.entities.Product.list('-created_date', 500),
      ]);
      setQuotes(quoteRows); setSuppliers(supplierRows); setProducts(productRows);
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load B2B operations.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    pending: quotes.filter((quote) => quote.status === 'submitted').length,
    b2bProducts: products.filter((product) => product.is_b2b || product.b2b_only || product.wholesale_price_usd != null).length,
    enabledSuppliers: suppliers.filter((supplier) => supplier.enabled).length,
  }), [quotes, products, suppliers]);

  const setSupplierEnabled = async (supplier, enabled) => {
    setActionId(`supplier-${supplier.id}`);
    try {
      const updated = await base44.entities.Supplier.update(supplier.id, { enabled });
      setSuppliers((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (actionError) {
      setError(actionError?.message || 'Supplier status could not be updated.');
    } finally {
      setActionId('');
    }
  };
  const setQuoteStatus = async (quote, status) => {
    setActionId(`quote-${quote.id}`);
    try {
      const { data } = await base44.functions.invoke('quoteRequest', { action: 'moderate', quote_id: quote.id, status });
      setQuotes((items) => items.map((item) => item.id === data.quote.id ? data.quote : item));
    } catch (actionError) {
      setError(actionError?.message || 'Quote status could not be updated.');
    } finally {
      setActionId('');
    }
  };

  return <div className="space-y-5 pb-8">
    <DashboardNav title="B2B Operations" links={ADMIN_LINKS} />
    {error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"><span>{error}</span><Button variant="outline" size="sm" onClick={load}>Try again</Button></div>}
    <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Open RFQs</p><p className="mt-1 text-2xl font-black">{stats.pending}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Wholesale products</p><p className="mt-1 text-2xl font-black">{stats.b2bProducts}</p></div><div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Enabled suppliers</p><p className="mt-1 text-2xl font-black">{stats.enabledSuppliers}</p></div></div>
    {loading ? <div className="h-64 animate-pulse rounded-2xl bg-secondary" /> : <>
      <section className="space-y-3"><h2 className="text-lg font-bold">Quote moderation</h2>{quotes.filter((quote) => ['submitted', 'responded'].includes(quote.status)).map((quote) => <article key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"><div><p className="font-medium">{quote.product_title} · {quote.quantity} units</p><p className="text-xs text-muted-foreground">{quote.quote_number} · {quote.buyer_email} · {formatDateTime(quote.created_date)}</p></div><div className="flex items-center gap-2"><StatusBadge status={quote.status} /><Button type="button" variant="outline" size="icon" disabled={actionId === `quote-${quote.id}`} onClick={() => setQuoteStatus(quote, 'declined')} aria-label="Decline quote" title="Decline"><XCircle className="h-4 w-4 text-destructive" /></Button><Button type="button" size="icon" disabled={actionId === `quote-${quote.id}`} onClick={() => setQuoteStatus(quote, 'accepted')} aria-label="Accept quote" title="Accept"><CheckCircle2 className="h-4 w-4" /></Button></div></article>)}{!quotes.filter((quote) => ['submitted', 'responded'].includes(quote.status)).length && <p className="text-sm text-muted-foreground">No open quote requests.</p>}</section>
      <section className="space-y-3"><h2 className="text-lg font-bold">Supplier approval</h2><div className="grid gap-3 md:grid-cols-2">{suppliers.map((supplier) => <article key={supplier.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{supplier.name}</p><p className="text-xs text-muted-foreground">{supplier.country} · {supplier.products_count || 0} products · {supplier.adapter}</p></div><ShieldCheck className={`h-5 w-5 ${supplier.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} /></div><Button type="button" variant={supplier.enabled ? 'secondary' : 'default'} size="sm" disabled={actionId === `supplier-${supplier.id}`} onClick={() => setSupplierEnabled(supplier, !supplier.enabled)} className="mt-3">{supplier.enabled ? 'Approved supplier' : 'Approve supplier'}</Button></article>)}</div></section>
    </>}
  </div>;
}