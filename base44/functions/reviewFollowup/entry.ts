import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { notify, openTicket, ensureWallet } from '../../shared/workflowSupport.ts';
import { postWalletEntry } from '../../shared/walletLedger.ts';
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
    // `base44` pour les helpers partagés (ils résolvent asServiceRole eux-mêmes),
    // `db` pour les accès directs aux entités.
    const client = base44;
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
      const { wallet } = await ensureWallet(client, {
        ownerType: 'seller',
        ownerId: review.seller_id,
        ownerName: seller?.name || 'Vendeur',
        ownerEmail: seller?.email || seller?.owner_email || '',
        tenantId: review.tenant_id || '',
        tenantOwnerEmail: review.tenant_owner_email || '',
      });

      // Registre de portefeuille atomique : une même clé ne peut jamais créditer deux fois.
      const posted = await postWalletEntry(db, wallet, {
        type: 'CREDIT',
        direction: 'credit',
        amount: REVIEW_REWARD_USD,
        description: `Prime avis 5 étoiles — ${product}`,
        reference: review.order_number || '',
        idempotencyKey: `review_reward_${review.id}`,
      });

      if (posted.ok) {
        actions.push({ step: 'wallet_credit', ok: true, amount_usd: REVIEW_REWARD_USD });
        await notify(client, {
          audience: 'seller',
          title: 'Merci pour cet avis 5 étoiles',
          message: `Un client a noté ${product} 5 étoiles. ${REVIEW_REWARD_USD.toFixed(2)} USD ont été crédités sur votre portefeuille.`,
          type: 'system',
          reference: review.order_number || '',
          tenantId: review.tenant_id || '',
          tenantOwnerEmail: review.tenant_owner_email || '',
        });
        actions.push({ step: 'thank_you', ok: true });
      } else if (posted.reason === 'duplicate') {
        actions.push({ step: 'wallet_credit', ok: true, duplicate: true });
      } else {
        actions.push({ step: 'wallet_credit', ok: false, reason: posted.reason });
      }
    }

    if (rating > 0 && rating <= 2) {
      const subject = `Avis ${rating}★ — ${product}`;
      // Une relance ne doit pas ouvrir un second dossier pour le même avis.
      const existing = await db.entities.SupportTicket
        .filter({ subject, status: { $in: ['open', 'in_progress'] } })
        .catch(() => []);
      if (existing.length) {
        actions.push({ step: 'support_ticket', ok: true, duplicate: true, ticket_number: existing[0].ticket_number || '' });
        return addSecurityHeaders(Response.json({ review_id: review.id, rating, reward_usd: 0, actions }));
      }
      const ticket = await openTicket(client, {
        subject,
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
      await notify(client, {
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