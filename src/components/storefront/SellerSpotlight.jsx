import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import SellerCard from '@/components/SellerCard';
import EmptyState from '@/components/EmptyState';

// Verified shops carry the trust a cross-border marketplace needs: buyers here
// choose the seller as much as the product.
export default function SellerSpotlight({ sellers = [], loading = false }) {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="market-sellers-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="market-sellers-title" className="text-lg font-semibold tracking-tight md:text-xl">{t('market.sellersTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('market.sellersSub')}</p>
        </div>
        <Link to="/partner-directory" className="flex min-h-11 shrink-0 items-center gap-1 px-2 text-sm font-semibold text-primary hover:underline">
          {t('market.sellersAll')}
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-2.5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : sellers.length ? (
        <div className="grid gap-2.5 md:grid-cols-2">
          {sellers.slice(0, 6).map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title={t('home.noSellers')}
          description={t('home.noSellersDesc')}
          actionTo="/seller-application"
          actionLabel={t('home.openShop')}
        />
      )}
    </section>
  );
}