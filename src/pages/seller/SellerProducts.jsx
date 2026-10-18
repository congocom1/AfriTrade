import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useActiveSeller } from '@/lib/seller';
import DashboardNav from '@/components/DashboardNav';
import SellerProductCard from '@/components/SellerProductCard';
import { readActiveTenantId } from '@/lib/tenancy';
import { emitEvent } from '@/lib/events';

const productSchema = z.object({
  title: z.string().min(1, 'sellerProducts.errTitle').max(120, 'sellerProducts.errTitleLong'),
  description: z.string().max(2000, 'sellerProducts.errDescLong').default(''),
  price_usd: z.coerce.number().positive('sellerProducts.errPricePositive').default(0),
  compare_at_usd: z.coerce.number().nonnegative('sellerProducts.errCompareNegative').optional().default(0),
  stock: z.coerce.number().int('sellerProducts.errStockInt').nonnegative('sellerProducts.errStockNeg').default(0),
  category_id: z.string().default(''),
  images: z.string().default(''),
  is_b2b: z.boolean().default(false),
  b2b_only: z.boolean().default(false),
  wholesale_price_usd: z.coerce.number().nonnegative().default(0),
  moq: z.coerce.number().int().positive().default(1),
  origin_country: z.string().length(2).default('NG'),
}).superRefine((data, context) => {
  if (data.is_b2b && !(data.wholesale_price_usd > 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['wholesale_price_usd'], message: 'Enter a wholesale unit price greater than zero.' });
  }
});

const EMPTY = { title: '', description: '', price_usd: '', compare_at_usd: '', stock: '', category_id: '', images: '', is_b2b: false, b2b_only: false, wholesale_price_usd: '', moq: '1', origin_country: 'NG' };

export default function SellerProducts() {
  const { t } = useTranslation();
  const { seller } = useActiveSeller();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(productSchema), defaultValues: EMPTY });

  const load = async (sellerId) => {
    const rows = await base44.entities.Product.filter({ seller_id: sellerId }, 'title', 200);
    setProducts(rows);
  };

  useEffect(() => {
    (async () => {
      const cats = await base44.entities.Category.list('sort_order', 40).catch(() => []);
      setCategories(cats);
      if (seller) await load(seller.id);
      setLoading(false);
    })();
  }, [seller]);

  const startCreate = () => {
    reset({ ...EMPTY, category_id: categories[0]?.id || '' });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (p) => {
    reset({
      title: p.title || '',
      description: p.description || '',
      price_usd: p.price_usd ?? 0,
      compare_at_usd: p.compare_at_usd ?? 0,
      stock: p.stock ?? 0,
      category_id: p.category_id || '',
      images: (p.images || []).join(', '),
      is_b2b: Boolean(p.is_b2b),
      b2b_only: Boolean(p.b2b_only),
      wholesale_price_usd: p.wholesale_price_usd ?? '',
      moq: p.moq ?? 1,
      origin_country: p.origin_country || 'NG',
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const onSubmit = async (formData) => {
    if (!seller || saving) return;
    setSaving(true);
    const category = categories.find((c) => c.id === formData.category_id);
    const payload = {
      tenant_id: seller.tenant_id || readActiveTenantId() || '',
      tenant_owner_email: seller.email || '',
      title: formData.title,
      description: formData.description,
      price_usd: Number(formData.price_usd) || 0,
      compare_at_usd: Number(formData.compare_at_usd) || 0,
      stock: Number(formData.stock) || 0,
      category_id: formData.category_id,
      category_name: category?.name || '',
      images: String(formData.images || '').split(',').map((s) => s.trim()).filter(Boolean),
      seller_id: seller.id,
      seller_name: seller.name,
      source_type: 'local_seller',
      supplier_price: Number(formData.price_usd) || 0,
      currency: 'USD',
      origin_country: String(formData.origin_country || 'NG').toUpperCase(),
      is_b2b: Boolean(formData.is_b2b),
      b2b_only: Boolean(formData.is_b2b && formData.b2b_only),
      wholesale_price_usd: formData.is_b2b ? Number(formData.wholesale_price_usd) : null,
      moq: formData.is_b2b ? Number(formData.moq) || 1 : 1,
      estimated_delivery: '2-4 jours',
      status: 'published',
    };
    try {
      if (editingId) {
        await base44.entities.Product.update(editingId, payload);
      } else {
        const created = await base44.entities.Product.create({ ...payload, slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
        base44.analytics.track({ eventName: 'seller_product_published' });
        emitEvent(base44, 'product_published', {
          category: 'catalogue',
          source: 'Product',
          sourceId: created.id,
          reference: created.title,
          tenantId: payload.tenant_id,
          tenantOwnerEmail: payload.tenant_owner_email,
          description: `${seller.name} met en ligne « ${payload.title} » à ${payload.price_usd} USD`,
          payload: { price_usd: payload.price_usd, stock: payload.stock, category: payload.category_name },
        });
      }
      await load(seller.id);
      setShowForm(false);
      setEditingId(null);
      reset(EMPTY);
      await base44.functions.invoke('sellerProfile', { action: 'productCount', seller_id: seller.id });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p) => {
    const next = p.status === 'published' ? 'archived' : 'published';
    const updated = await base44.entities.Product.update(p.id, { status: next });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    emitEvent(base44, next === 'published' ? 'product_published' : 'product_archived', {
      category: 'catalogue',
      source: 'Product',
      sourceId: p.id,
      reference: p.title,
      tenantId: p.tenant_id || '',
      tenantOwnerEmail: p.tenant_owner_email || '',
      description: `« ${p.title} » ${next === 'published' ? 'remis en ligne' : 'archivé'}`,
      payload: { status: next, price_usd: p.price_usd },
    });
  };

  const remove = async (p) => {
    await base44.entities.Product.delete(p.id);
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
  };

  return (
    <div className="space-y-5 pb-8 paper-console">
      <DashboardNav title={t('sellerProducts.title')} variant="paper" links={[
        { to: '/seller', label: t('sellerProducts.navDashboard'), end: true },
        { to: '/seller/products', label: t('sellerProducts.navProducts') },
        { to: '/seller/orders', label: t('sellerProducts.navOrders') },
        { to: '/seller/import', label: t('sellerProducts.navImport') },
        { to: '/seller/wallet', label: t('sellerProducts.navWallet') },
        { to: '/seller/settings', label: t('sellerProducts.navShop') },
      ]} />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{t('sellerProducts.count', { count: products.length, name: seller?.name || '—' })}</p>
        <button type="button" onClick={startCreate} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
          <Plus className="h-3.5 w-3.5" /> {t('sellerProducts.newProduct')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">{editingId ? t('sellerProducts.editProduct') : t('sellerProducts.createProduct')}</h2>
          <div>
            <input
              {...register('title')}
              placeholder={t('sellerProducts.phTitle')}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
            {errors.title && <p className="mt-1 text-[11px] text-destructive">{t(errors.title.message)}</p>}
          </div>
          <div>
            <textarea
              {...register('description')}
              rows={3}
              placeholder={t('sellerProducts.phDescription')}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm"
            />
            {errors.description && <p className="mt-1 text-[11px] text-destructive">{t(errors.description.message)}</p>}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <input
                type="number"
                step="0.01"
                {...register('price_usd')}
                placeholder={t('sellerProducts.phPrice')}
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
              />
              {errors.price_usd && <p className="mt-1 text-[11px] text-destructive">{t(errors.price_usd.message)}</p>}
            </div>
            <div>
              <input
                type="number"
                step="0.01"
                {...register('compare_at_usd')}
                placeholder={t('sellerProducts.phCompareAt')}
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
              />
              {errors.compare_at_usd && <p className="mt-1 text-[11px] text-destructive">{t(errors.compare_at_usd.message)}</p>}
            </div>
            <div>
              <input
                type="number"
                {...register('stock')}
                placeholder={t('sellerProducts.phStock')}
                className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
              />
              {errors.stock && <p className="mt-1 text-[11px] text-destructive">{t(errors.stock.message)}</p>}
            </div>
          </div>
          <select
            {...register('category_id')}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">{t('sellerProducts.phCategory')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            {...register('images')}
            placeholder={t('sellerProducts.phImages')}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
              <input type="checkbox" {...register('is_b2b')} className="h-4 w-4" />
              Sell this product wholesale (B2B)
            </label>
            <p className="mt-1 text-[11px] text-muted-foreground">Published B2B products appear in the AfriTrade wholesale marketplace and can receive quote requests.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-[11px] text-muted-foreground">Wholesale unit price (USD)
                <input type="number" min="0.01" step="0.01" {...register('wholesale_price_usd')} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                {errors.wholesale_price_usd && <p className="mt-1 text-[11px] text-destructive">{errors.wholesale_price_usd.message}</p>}
              </label>
              <label className="text-[11px] text-muted-foreground">Minimum order quantity
                <input type="number" min="1" step="1" {...register('moq')} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </label>
              <label className="text-[11px] text-muted-foreground">Origin country (ISO code)
                <input maxLength="2" {...register('origin_country')} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 uppercase text-sm" />
              </label>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" {...register('b2b_only')} className="h-4 w-4" />
              Wholesale only — hide from retail shoppers
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? t('sellerProducts.saving') : t('sellerProducts.save')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
              Annuler
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <SellerProductCard
              key={p.id}
              product={p}
              onEdit={startEdit}
              onToggle={toggleStatus}
              onRemove={remove}
              ariaEdit={t('sellerProducts.ariaEdit')}
              ariaToggle={t('sellerProducts.ariaToggle')}
              ariaDelete={t('sellerProducts.ariaDelete')}
            />
          ))}
          {!products.length && (
            <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
              {t('sellerProducts.empty')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}