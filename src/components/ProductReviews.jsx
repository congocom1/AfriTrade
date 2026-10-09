import React, { useEffect, useState } from 'react';
import { Star, BadgeCheck, PackageCheck, AlertCircle, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RatingStars from './RatingStars';
import { getProfile, getSessionId } from '@/lib/session';
import { timeAgo } from '@/lib/format';

export default function ProductReviews({ product, onChanged }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(getProfile().name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userEntitlement, setUserEntitlement] = useState({ loading: true, alreadyReviewed: false, authenticated: false });

  const load = async () => {
    const rows = await base44.entities.Review.filter({ product_id: product.id, status: 'published' }, '-created_date', 30);
    setReviews(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [product.id]);

  // Check if user is authenticated and has already reviewed
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const sessionId = getSessionId();
      try {
        const user = await base44.auth.me().catch(() => null);
        const mine = await base44.entities.Review.filter({ product_id: product.id, session_id: sessionId }).catch(() => []);
        if (cancelled) return;
        setUserEntitlement({
          loading: false,
          alreadyReviewed: mine.length > 0,
          authenticated: !!user,
        });
      } catch {
        if (cancelled) return;
        setUserEntitlement({ loading: false, alreadyReviewed: false, authenticated: false });
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const getErrorMessage = (err) => {
    const message = err?.data?.error || err?.message || '';
    // Handle specific server error codes
    if (err?.status === 401 || message.includes('Connectez-vous')) {
      return 'Connectez-vous pour publier un avis.';
    }
    if (err?.status === 403 || message.includes('acheteurs ayant reçu')) {
      return 'Seuls les acheteurs ayant reçu l\'article peuvent publier un avis.';
    }
    if (err?.status === 409 || message.includes('déjà publié')) {
      return 'Vous avez déjà publié un avis sur cet article.';
    }
    if (err?.status === 400 || message.includes('invalide')) {
      return 'Données invalides. Veuillez vérifier votre saisie.';
    }
    return "Impossible d'enregistrer votre avis pour le moment.";
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving || !userEntitlement.authenticated) return;
    setSaving(true);
    setError('');
    try {
      const res = await base44.functions.invoke('submit-review', {
        product_id: product.id,
        rating,
        comment,
        name: name || getProfile().name || '',
        phone: getProfile().phone || '',
        session_id: getSessionId(),
      });
      if (!res?.data?.review) throw new Error(res?.data?.error || "Avis refusé.");
      if (res.data.product) onChanged?.(res.data.product);
      const all = await base44.entities.Review.filter({ product_id: product.id, status: 'published' }, '-created_date', 100);
      setReviews(all);
      setComment('');
      setOpen(false);
      setUserEntitlement((prev) => ({ ...prev, alreadyReviewed: true }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const canReview = !userEntitlement.loading && userEntitlement.authenticated && !userEntitlement.alreadyReviewed;
  const showLoginPrompt = !userEntitlement.loading && !userEntitlement.authenticated;

  return (
    <section className="space-y-3" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between">
        <h2 id="reviews-heading" className="text-base font-bold">Avis clients ({reviews.length})</h2>
        {canReview && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
            {open ? 'Annuler' : 'Écrire un avis'}
          </button>
        )}
      </div>

      {!userEntitlement.loading && !canReview && (
        <p className="flex items-center gap-1.5 rounded-xl border border-dashed border-border bg-card p-3 text-xs text-muted-foreground">
          {showLoginPrompt ? (
            <>
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Connectez-vous pour publier un avis.
            </>
          ) : userEntitlement.alreadyReviewed ? (
            <>
              <PackageCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Vous avez déjà publié un avis sur cet article.
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Seuls les acheteurs ayant reçu l'article peuvent publier un avis.
            </>
          )}
        </p>
      )}

      {open && canReview && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground" id="review-form-desc">
            Achat vérifié — la commande sera validée par le serveur
          </p>
          <div>
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Votre note</p>
            <div className="flex gap-1" role="radiogroup" aria-labelledby="review-form-desc" aria-label="Choisir une note">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoiles`} onClick={() => setRating(n)} className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  <Star className={`h-6 w-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <label className="sr-only" htmlFor="review-name">Votre nom</label>
          <input
            id="review-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            required
          />
          <label className="sr-only" htmlFor="review-comment">Commentaire</label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Qualité, taille, délai de livraison…"
            className="w-full rounded-lg border border-border bg-background p-3 text-sm"
            required
          />
          {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {saving ? 'Envoi…' : 'Publier mon avis'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : reviews.length ? (
        <div className="space-y-2">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1 text-sm font-semibold">
                  {r.customer_name}
                  {r.verified_purchase && r.order_number && <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" aria-label="Achat vérifié" />}
                </p>
                <time className="text-[11px] text-muted-foreground" dateTime={r.created_date}>{timeAgo(r.created_date)}</time>
              </div>
              <RatingStars rating={r.rating} />
              {r.comment && <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-card p-4 text-xs text-muted-foreground">
          {canReview ? 'Aucun avis pour cet article. Soyez le premier à donner votre avis.' : 'Aucun avis pour cet article.'}
        </p>
      )}
    </section>
  );
}