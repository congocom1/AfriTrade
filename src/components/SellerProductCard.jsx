import React from 'react';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { productImage } from '@/lib/productImages';
import StatusBadge from '@/components/StatusBadge';

export default function SellerProductCard({ product, onEdit, onToggle, onRemove, ariaEdit, ariaToggle, ariaDelete }) {
  const paper = product && product.status === 'archived';

  return (
    <div key={product.id} className={paper ? 'paper-tile' : 'flex items-center gap-3 rounded-xl border border-border bg-card p-2.5'}>
      {paper ? (
        <div className="paper-tile-icon">
          <Trash2 className="h-4 w-4" />
        </div>
      ) : (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
          <Image src={productImage(product)} alt={product.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: paper ? 'var(--ink)' : 'inherit' }}>
          {product.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          ${product.price_usd} · stock {product.stock ?? 0} · {product.sold_count || 0} sold
        </p>
        {product.is_b2b && (
          <p className="mt-0.5 text-[11px] font-medium text-primary">
            B2B · ${product.wholesale_price_usd || product.price_usd} · MOQ {product.moq || 1}
          </p>
        )}
        <StatusBadge status={product.status} variant={paper ? 'paper' : 'default'} />
      </div>
      {!paper && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="rounded-lg p-2 hover:bg-secondary"
            aria-label={ariaEdit || 'Edit'}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggle(product)}
            className="rounded-lg p-2 hover:bg-secondary"
            aria-label={ariaToggle || 'Publish / archive'}
          >
            {product.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(product)}
            className="rounded-lg p-2 text-destructive hover:bg-secondary"
            aria-label={ariaDelete || 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}