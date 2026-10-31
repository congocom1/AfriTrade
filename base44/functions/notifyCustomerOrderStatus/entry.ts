import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { escapeHtml } from '../../shared/app.ts';
import { orderNumber, resolveFulfillment, tenantOf } from '../../shared/fulfillments.ts';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';

/**
 * Prévient le client par e-mail dès que le statut de sa commande change,
 * y compris quand son colis est prêt à retirer au point relais.
 *
 * Appelée par le workflow « Notification client statut commande ». Le workflow
 * est le seul appelant : la fonction exige donc un administrateur et écrit en
 * service role.
 */

/** Un message par étape du cycle de vie du colis. */
const MESSAGES = {
  CONFIRMED: {
    event: 'confirmed',
    label: 'Commande confirmée',
    headline: 'Votre commande est confirmée',
    sentence: () => "Nous préparons votre colis pour l'expédition.",
  },
  PROCESSING: {
    event: 'processing',
    label: 'En préparation',
    headline: 'Votre commande est en préparation',
    sentence: () => 'Nos équipes rassemblent vos articles.',
  },
  PACKING: {
    event: 'packing',
    label: 'Colis en emballage',
    headline: "Votre colis est en cours d'emballage",
    sentence: () => 'Il partira très bientôt.',
  },
  AWAITING_CUSTOMER_APPROVAL: {
    event: 'awaiting_customer_approval',
    label: 'Validation des articles',
    headline: 'Vos articles attendent votre validation',
    sentence: () => "Consultez la photo de vos articles et validez-la pour lancer l'expédition.",
  },
  READY_FOR_PICKUP: {
    event: 'ready_for_pickup',
    label: 'Prêt à retirer',
    headline: 'Votre colis est prêt à retirer',
    sentence: (ctx) => `Il vous attend au point relais ${ctx.pointName}${ctx.pickupCode ? `. Code de retrait : ${ctx.pickupCode}` : ''}.`,
  },
  PICKED_UP: {
    event: 'picked_up',
    label: 'Colis pris en charge',
    headline: 'Votre colis a été pris en charge',
    sentence: () => 'Il est en route vers vous.',
  },
  IN_TRANSIT: {
    event: 'in_transit',
    label: 'En transit',
    headline: 'Votre colis est en route',
    sentence: () => "Vous serez prévenu dès qu'il approche de chez vous.",
  },
  OUT_FOR_DELIVERY: {
    event: 'out_for_delivery',
    label: 'En cours de livraison',
    headline: "Votre colis arrive aujourd'hui",
    sentence: () => 'Merci de rester joignable pour la remise.',
  },
  DELIVERED: {
    event: 'delivered',
    label: 'Livré',
    headline: 'Votre commande est livrée',
    sentence: () => "Merci d'avoir choisi AfriTrade.",
  },
  FAILED: {
    event: 'delivery_failed',
    label: 'Livraison non aboutie',
    headline: "La livraison n'a pas abouti",
    sentence: () => 'Notre équipe vous recontacte pour convenir d’un nouveau passage.',
  },
  RETURNED: {
    event: 'returned',
    label: 'Retourné',
    headline: 'Votre colis nous est revenu',
    sentence: () => 'Nous vous contactons pour organiser la suite.',
  },
  CANCELLED: {
    event: 'cancelled',
    label: 'Annulée',
    headline: 'Votre commande est annulée',
    sentence: () => 'Si vous avez une question, répondez directement à cet e-mail.',
  },
};

/** La ligne de détail affichée dans l'e-mail dépend de l'étape. */
const detailFor = (status, ctx) => {
  if (status === 'READY_FOR_PICKUP') {
    return {
      label: 'Point de retrait',
      value: [ctx.pointName, ctx.pickupCode ? `code ${ctx.pickupCode}` : ''].filter(Boolean).join(' · '),
    };
  }
  if (['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(status)) {
    return { label: 'Suivi', value: ctx.tracking || 'Numéro de suivi à venir' };
  }
  return { label: 'Livraison', value: ctx.address || 'Adresse confirmée par le livreur' };
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);

    const body = await req.json().catch(() => ({}));
    const fulfillmentId = String(body.fulfillment_id || '').trim();
    if (!fulfillmentId) return addSecurityHeaders(Response.json({ error: 'fulfillment_id is required' }, { status: 400 }));

    const { fulfillment, order } = await resolveFulfillment(base44, fulfillmentId);
    if (!fulfillment) return addSecurityHeaders(Response.json({ error: 'FulfillmentOrder not found' }, { status: 404 }));

    const status = String(fulfillment.status || '').toUpperCase();
    const message = MESSAGES[status];
    if (!message) {
      return addSecurityHeaders(Response.json({ skipped: true, reason: `aucun message pour ${status || 'statut inconnu'}` }));
    }

    const reference = orderNumber(fulfillment, order);
    const email = String(order?.customer_email || '').trim();
    if (!email) {
      return addSecurityHeaders(Response.json({ skipped: true, reason: 'aucun e-mail client', order_number: reference }));
    }

    // Une seule notification par étape et par commande, quel que soit l'appelant.
    const alreadySent = await base44.asServiceRole.entities.OrderNotification
      .filter({ order_number: reference, event: message.event })
      .catch(() => []);
    if (alreadySent.length) {
      return addSecurityHeaders(Response.json({ skipped: true, reason: 'client déjà prévenu', event: message.event, order_number: reference }));
    }

    const ctx = {
      reference,
      pointName: String(order?.pickup_point_name || 'point relais AfriTrade').trim(),
      pickupCode: String(order?.pickup_code || '').trim(),
      tracking: String(fulfillment.tracking_number || '').trim(),
      address: String(order?.address || order?.city || '').trim(),
    };
    const detail = detailFor(status, ctx);
    const sentence = message.sentence(ctx);
    const subject = `${message.headline} · commande ${reference}`;

    const ledger = await base44.asServiceRole.entities.OrderNotification.create({
      ...tenantOf(fulfillment, order),
      order_id: order?.id || '',
      order_number: reference,
      fulfillment_number: fulfillment.fulfillment_number || '',
      event: message.event,
      label: message.label,
      customer_name: order?.customer_name || '',
      customer_email: email,
      customer_phone: order?.customer_phone || '',
      subject,
      message: sentence,
      channel: 'email',
      provider: 'email',
      status: 'queued',
      attempts: 0,
    });

    const appUrl = String(req.headers.get('X-Base44-App-Url') || 'https://afrixtrade.com').replace(/\/$/, '');

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject,
        template_name: 'OrderStatusUpdate',
        variables: {
          customer_name: escapeHtml(String(order?.customer_name || '').trim() || 'cher client'),
          order_number: escapeHtml(reference),
          fulfillment_number: escapeHtml(fulfillment.fulfillment_number || 'En préparation'),
          headline: escapeHtml(message.headline),
          status_label: escapeHtml(message.label),
          message_line: escapeHtml(sentence),
          detail_label: escapeHtml(detail.label),
          detail_value: escapeHtml(detail.value),
          action_url: `${appUrl}/order-history`,
        },
        from_name: 'AfriTrade',
      });
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        attempts: 1,
        error: '',
      });
    } catch (error) {
      await base44.asServiceRole.entities.OrderNotification.update(ledger.id, {
        status: 'failed',
        attempts: 1,
        error: String(error?.message || error).slice(0, 500),
      });
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'customer.status_email_failed',
        actor: 'system',
        entity: 'FulfillmentOrder',
        entity_id: fulfillment.id,
        reference,
        severity: 'warning',
        details: { status, to: email, error: String(error?.message || error).slice(0, 300) },
      });
      return addSecurityHeaders(Response.json({ sent: false, reason: 'e-mail refusé', order_number: reference }));
    }

    return addSecurityHeaders(Response.json({ sent: true, order_number: reference, status, to: email }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: String(error?.message || error) }, { status: 500 }));
  }
}