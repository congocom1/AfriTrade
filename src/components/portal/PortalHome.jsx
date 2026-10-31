import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { canOpen } from '@/lib/access';
import { useAccess } from '@/hooks/useAccess';
import { PORTALS } from '@/lib/portals';
import { Button } from '@/components/ui/button';

/**
 * Landing page of a console portal: what the portal is for, and every tool it
 * holds. Sections the account cannot open stay visible but marked, so a visitor
 * sees what the portal offers before applying for it.
 */
export default function PortalHome({ portalId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const access = useAccess();
  const portal = PORTALS[portalId];
  const Icon = portal.icon;

  const openable = portal.sections.filter((section) => !access.loading && canOpen(section.path, access));
  const primary = openable[0]?.path;
  const guestCta = !primary && portal.guestCta ? portal.guestCta : null;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="space-y-3 border-b border-border bg-secondary/40 px-5 py-6 md:px-8 md:py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
            {t('portals.youAreIn')}
          </span>
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-foreground md:text-3xl">{t(portal.labelKey)}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{t(portal.taglineKey)}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {primary && (
              <Button asChild>
                <Link to={primary}>
                  {t('portals.open')}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
            {guestCta && <Button asChild variant={primary ? 'outline' : 'default'}><Link to={guestCta.path}>{t(guestCta.labelKey)}</Link></Button>}
            {!user && <Button asChild variant={primary || guestCta ? 'outline' : 'default'}><Link to="/login">{t('portals.signIn')}</Link></Button>}
            {!primary && !guestCta && user && <Button asChild variant="outline"><Link to="/">{t('portals.backToShop')}</Link></Button>}
          </div>
          {!user && <p className="text-xs text-muted-foreground">{t('portals.guestNote')}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 md:p-8">
          {portal.sections.map(({ id, path, icon: SectionIcon }) => {
            const allowed = !access.loading && canOpen(path, access);
            const body = (
              <>
                <span className="flex items-center gap-2">
                  <SectionIcon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-foreground">{t(`portals.sections.${id}`)}</span>
                  {!allowed && <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={t('portals.locked')} />}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">{t(`portals.hints.${id}`)}</span>
              </>
            );

            return allowed
              ? <Link key={id} to={path} className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-secondary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{body}</Link>
              : <div key={id} className="rounded-xl border border-dashed border-border bg-background/60 p-4">{body}</div>;
          })}
        </div>
      </section>
    </div>
  );
}