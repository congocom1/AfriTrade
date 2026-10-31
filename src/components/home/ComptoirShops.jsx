import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react';
import SellerCard from '@/components/SellerCard';
import EmptyState from '@/components/EmptyState';

// Verified shops carry the trust a cross-border marketplace needs: buyers here
// choose the seller as much as the product.
export default function ComptoirShops({ sellers = [], loading = false }) {
  const { t } = useTranslation();

  return (
    <section className="k-sec" aria-labelledby="comptoir-shops">
      <div className="k-sh">
        <div>
          <h2 id="comptoir-shops" className="k-serif">{t('market.sellersTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--k-muted)]">{t('market.sellersSub')}</p>
        </div>
        <Link to="/partner-directory" className="k-sh__all">{t('market.sellersAll')}</Link>
      </div>

      {loading ? (
        <div className="k-dl">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex min-h-14 items-center py-3.5">
              <span className="h-4 w-1/3 animate-pulse rounded bg-[var(--k-line)]" />
            </div>
          ))}
        </div>
      ) : sellers.length ? (
        <div className="k-dl">
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