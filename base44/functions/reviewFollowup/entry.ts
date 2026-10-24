import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/security.ts';
import { notify, openTicket, ensureWallet, postLedger } from '../../shared/workflowSupport.ts';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';

/**
 * Suite d'un nouvel avis client (workflow « Review Followup »).
 *  - 5 étoiles : prime créditée sur le portefeuille du vendeur + message de remerciement.
 *  - 1 à 2 étoiles : ticket support prioritaire pour le service client.
 * Le crédit est idempotent : un même avis ne peut pas être primé deux fois.
 */

const REVIEW_REWARD_USD = 0.5;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const gate = await requireAdmin(base44);
    if (!gate.ok) return addSecurityHeaders(gate.response);
    const db = base44.asServiceRole;

    const body = await req.json().catch(() => ({}));
    const reviewId = String(body.review_id || '').trim();
    if (!reviewId) return addSecurityHeaders(Response.json({ error: 'review_id requis' }, { status: 400 }));

    const review = await db.entities.Review.get(reviewId).catch(() => null);
    if (!review) return addSecurityHeaders(Response.json({ error: 'Avis introuvable' }, { status: 404 }));

    const rating = Number(review.rating || 0);
    const product = review.product_title || 'votre produit';
    const actions = [];

    if (rating >= 5 && review.seller_id) {
      const seller = await db.entities.Seller.get(review.seller_id).catch(() => null);
      const { wallet } = await ensureWallet(db, {
        ownerType: 'seller',
        ownerId: review.seller_id,
        ownerName: seller?.name || 'Vendeur',
        ownerEmail: seller?.email || seller?.owner_email || '',
        tenantId: review.tenant_id || '',
        tenantOwnerEmail: review.tenant_owner_email || '',
      });

      const posted = await postLedger(db, {
        wallet,
        amountUsd: REVIEW_REWARD_USD,
        type: 'CREDIT',
        direction: 'credit',
        description: `Prime avis 5 étoiles — ${product}`,
        reference: review.order_number || '',
        idempotencyKey: `review_reward_${review.id}`,
      });

      if (posted.posted) {
        actions.push({ step: 'wallet_credit', ok: true, amount_usd: REVIEW_REWARD_USD });
        await notify(db, {
          audience: 'seller',
          title: 'Merci pour cet avis 5 étoiles',
          message: `Un client a noté ${product} 5 étoiles. ${REVIEW_REWARD_USD.toFixed(2)} USD ont été crédités sur votre portefeuille.`,
          type: 'system',
          reference: review.order_number || '',
          tenantId: review.tenant_id || '',
          tenantOwnerEmail: review.tenant_owner_email || '',
        });
        actions.push({ step: 'thank_you', ok: true });
      } else {
        actions.push({ step: 'wallet_credit', ok: true, duplicate: true });
      }
    }

    if (rating > 0 && rating <= 2) {
      const ticket = await openTicket(db, {
        subject: `Avis ${rating}★ — ${product}`,
        category: 'order',
        priority: 'high',
        customerName: review.customer_name || '',
        customerEmail: review.customer_email || '',
        reference: review.order_number || '',
        description: String(review.comment || 'Avis négatif sans commentaire.').slice(0, 1000),
        tenantId: review.tenant_id || '',
        tenantOwnerEmail: review.tenant_owner_email || '',
      });
      actions.push({ step: 'support_ticket', ok: true, ticket_number: ticket?.ticket_number || '' });
      await notify(db, {
        audience: 'admin',
        title: `Avis ${rating}★ à traiter`,
        message: `${product} a reçu ${rating} étoile(s). Ticket ${ticket?.ticket_number || ''} ouvert pour le service client.`,
        type: 'system',
        reference: review.order_number || '',
        tenantId: review.tenant_id || '',
        tenantOwnerEmail: review.tenant_owner_email || '',
      });
    }

    return addSecurityHeaders(Response.json({ review_id: review.id, rating, reward_usd: rating >= 5 ? REVIEW_REWARD_USD : 0, actions }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: error.message }, { status: 500 }));
  }
}