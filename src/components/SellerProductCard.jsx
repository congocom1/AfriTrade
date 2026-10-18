import React from 'react';
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { Image } from '@/components/ui/image';
import StatusBadge from '@/components/StatusBadge';

export default function SellerProductCard({ product, onEdit, onToggle, onRemove, ariaEdit, ariaToggle, ariaDelete }) {
  return (
    <div key={product.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
        <Image src={product.images?.[0]} alt={product.title} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.title}</p>
        <p className="text-[11px] text-muted-foreground">
          ${product.price_usd} · stock {product.stock ?? 0} · {product.sold_count || 0} sold
        </p>
        {product.is_b2b && (
          <p className="mt-0.5 text-[11px] font-medium text-primary">
            B2B · ${product.wholesale_price_usd || product.price_usd} · MOQ {product.moq || 1}
          </p>
        )}
        <StatusBadge status={product.status} />
      </div>
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
    </div>
  );
}
