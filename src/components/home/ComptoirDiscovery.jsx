import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function ComptoirDiscovery({ content = [], loading = false }) {
  const { t } = useTranslation();

  return (
    <section className="k-sec" aria-labelledby="comptoir-discovery">
      <div className="k-sh">
        <div>
          <h2 id="comptoir-discovery" className="k-serif">{t('home.discovery')}</h2>
        </div>
        <Link to="/discover" className="k-sh__all">{t('common.seeAll')}</Link>
      </div>

      {loading ? (
        <div className="k-hs">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-44 w-[130px] shrink-0 animate-pulse rounded-[3px] bg-[var(--k-line)]" />
          ))}
        </div>
      ) : (
        <div className="k-hs">
          {content.slice(0, 8).map((item) => (
            <Link key={item.id} to="/discover" className="k-disc">
              <Play aria-hidden="true" />
              <Image src={item.thumbnail_url || item.media_url} alt={item.title} className="h-full w-full object-cover" />
              <span className="k-disc__label">
                <span className="k-disc__title">{item.title}</span>
                <span className="k-disc__handle">@{item.creator_handle}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}