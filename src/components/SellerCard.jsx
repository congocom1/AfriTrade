import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RatingStars from './RatingStars';
import { compactNumber } from '@/lib/format';

export default function SellerCard({ seller }) {
  const { t } = useTranslation();
  const [sales, setSales] = useState(Number(seller.total_sales) || 0);
  // A rating is only shown when real reviews back it. `products_count` was
  // being rendered as the review count, which read as a rated shop with zero
  // reviews. Shops without reviews are labelled the way the trust model
  // already describes them (see lib/vendorRatings.js trustLevel).
  const rating = Number(seller.rating) || 0;
  const reviewsCount = Number(seller.reviews_count) || 0;

  // Social proof: the seller's own counter when set, otherwise the units sold
  // across their published catalogue.
  useEffect(() => {
    const declared = Number(seller.total_sales) || 0;
    if (declared > 0) {
      setSales(declared);
      return undefined;
    }
    let alive = true;
    base44.entities.Product.filter({ seller_id: seller.id })
      .then((rows) => {
        if (alive) setSales(rows.reduce((sum, p) => sum + (Number(p.sold_count) || 0), 0));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [seller.id, seller.total_sales]);

  return (
    <Link to={`/store/${seller.slug}`} className="k-dl__row">
      <span className="min-w-0">
        <span className="k-dl__name k-serif">
          {seller.name}
          {seller.verified && <BadgeCheck className="k-accent-text h-4 w-4 shrink-0" />}
        </span>
        <span className="k-dl__meta">
          <span className="flex items-center gap-0.5">
            <MapPin /> {seller.city}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t('sellerCard.followers', { count: compactNumber(seller.followers_count || 0) })}</span>
          {reviewsCount > 0 ? (
            <RatingStars rating={rating} count={reviewsCount} />
          ) : (
            <span>{t('rating.new')}</span>
          )}
          {sales > 0 && <span>{t('sellerCard.sales', { count: compactNumber(sales) })}</span>}
        </span>
      </span>
      <span className="k-dl__chev" aria-hidden="true">›</span>
    </Link>
  );
}