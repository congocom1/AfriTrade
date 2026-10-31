import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Truck, Zap } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useCurrency } from '@/lib/currency';
import { isWishlisted, toggleWishlist } from '@/lib/session';
import { productImage } from '@/lib/productImages';
import RatingStars from './RatingStars';
import { compactNumber } from '@/lib/format';

// Two card languages live in the app: the default catalogue card, and the
// storefront front page's printed-market tile. They share one implementation,
// so a page never trades a control (wishlist, badges, stock) for a look.
const DEFAULT_CLASSES = {
  article: 'group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow duration-200 hover:shadow-md',
  link: 'block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-xl',
  frame: 'relative aspect-square w-full overflow-hidden bg-secondary',
  image: 'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]',
  body: 'space-y-1 p-2.5',
  title: 'line-clamp-2 min-h-[2.4em] text-xs font-medium leading-snug md:text-[13px]',
  price: 'text-sm font-bold text-primary md:text-base',
  strike: 'text-[11px] text-muted-foreground line-through',
  meta: 'text-[10px] text-muted-foreground',
  eta: 'flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground',
  badge: 'absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground',
  flash: 'absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950',
  stock: 'absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-[10px] font-semibold text-background',
  wish: 'absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  heart: 'h-5 w-5',
};

const KIOSK_CLASSES = {
  article: 'k-tile group relative',
  link: 'flex min-w-0 flex-1 flex-col focus:outline-none',
  frame: 'k-tile__frame',
  image: 'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]',
  body: 'k-tile__body',
  title: 'k-tile__name line-clamp-2',
  price: 'k-tile__price k-serif',
  strike: 'k-tile__strike',
  meta: 'k-tile__meta',
  eta: 'k-tile__eta',
  badge: 'absolute left-1.5 top-1.5 rounded-[2px] bg-[var(--k-accent)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--k-accent-ink)]',
  flash: 'absolute left-1.5 bottom-1.5 flex items-center gap-0.5 rounded-[2px] bg-[#19c48d] px-1.5 py-0.5 text-[10px] font-bold text-[#071b16]',
  stock: 'absolute inset-x-0 bottom-0 bg-[var(--k-ink)] py-1 text-center text-[10px] font-semibold text-[var(--k-bg)]',
  wish: 'absolute right-1.5 top-1.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-[var(--k-line)] bg-[var(--k-surface)] focus:outline-none',
  heart: 'h-4 w-4',
};

const KIOSK_VARIANTS = {
  kiosk: {},
  kioskBig: { article: 'k-tile k-tile--big k-today__big' },
  kioskRow: { article: 'k-tile k-tile--row', link: 'flex min-w-0 flex-1 flex-row items-center gap-2 focus:outline-none' },
};

function ProductCard({ product, variant = 'default' }) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [liked, setLiked] = useState(() => isWishlisted(product.id));
  const isKiosk = variant !== 'default';
  const classes = isKiosk ? { ...KIOSK_CLASSES, ...(KIOSK_VARIANTS[variant] || {}) } : DEFAULT_CLASSES;
  const heartTone = isKiosk
    ? (liked ? 'fill-[var(--k-accent)] text-[var(--k-accent)]' : 'text-[var(--k-ink)]')
    : (liked ? 'fill-primary text-primary' : 'text-foreground');

  const discount =
    product.compare_at_usd && product.compare_at_usd > product.price_usd
      ? Math.round(((product.compare_at_usd - product.price_usd) / product.compare_at_usd) * 100)
      : 0;

  const isIntl = product.source_type === 'international_supplier';

  return (
    <article className={classes.article}>
      <Link to={`/product/${product.slug || product.id}`} className={classes.link} aria-label={`${product.title}, ${format(product.price_usd)}`}>
        <div className={classes.frame}>
          <Image
            src={productImage(product)}
            alt={product.title}
            loading="lazy"
            className={classes.image}
          />
          {discount > 0 && (
            <span className={classes.badge}>
              -{discount}%
            </span>
          )}
          {product.is_flash_sale && (
            <span className={classes.flash}>
              <Zap className="h-3 w-3" /> Flash
            </span>
          )}
          {Number(product.stock) <= 0 && (
            <span className={classes.stock}>
              {t('product.outOfStock')}
            </span>
          )}
        </div>
        <div className={classes.body}>
          <p className={classes.title}>{product.title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className={classes.price}>{format(product.price_usd)}</span>
            {discount > 0 && (
              <span className={classes.strike}>{format(product.compare_at_usd)}</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-1">
            <RatingStars rating={product.rating || 0} count={product.reviews_count || 0} />
            <span className={classes.meta}>
              {t('product.soldCount', { count: compactNumber(product.sold_count || 0) })}
              {variant === 'kioskBig' && product.seller_name ? ` · ${product.seller_name}` : ''}
            </span>
          </div>
          <div className={classes.eta}>
            {isIntl ? (
              <>
                <Truck className="h-3 w-3" /> {t('product.international', { eta: product.estimated_delivery || '18 jours' })}
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 text-emerald-600" /> {t('product.localSeller', { eta: product.estimated_delivery || '2-4 jours' })}
              </>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={t('product.addToWishlist')}
        onClick={() => setLiked(toggleWishlist(product.id).includes(product.id))}
        className={classes.wish}
      >
        <Heart className={`${classes.heart} ${heartTone}`} />
      </button>

    </article>
  );
}

export default memo(ProductCard);