import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';

// Rate limiting configuration
const LLM_RATE_LIMIT_PER_HOUR = 10; // Limit LLM calls to prevent abuse
const LLM_RATE_LIMIT_UNIDENTIFIED_PER_HOUR = 100;
const RATE_WINDOW_MS = 3600 * 1000;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;

    // Rate limiting for LLM calls (expensive operation)
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[commerce-ai] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "commerce_ai",
        limit: clientKey ? LLM_RATE_LIMIT_PER_HOUR : LLM_RATE_LIMIT_UNIDENTIFIED_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return addSecurityHeaders(
        Response.json({ error: 'Authentification requise' }, { status: 401 })
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    if (!['description', 'tags', 'category', 'sellerInsights', 'shopping'].includes(action)) {
      return addSecurityHeaders(
        Response.json({ error: 'Action inconnue' }, { status: 400 })
      );
    }

    let prompt, schema;
    const text = (value, limit) => String(value || '').trim().slice(0, limit);
    const sellerAction = action !== 'shopping';

    if (sellerAction) {
      const sellerId = text(body.sellerId, 100);
      if (!sellerId) {
        return addSecurityHeaders(
          Response.json({ error: 'Boutique requise' }, { status: 400 })
        );
      }

      const seller = await base44.asServiceRole.entities.Seller.get(sellerId).catch(() => null);
      if (!seller || (user.role !== 'admin' && ![seller.email, seller.tenant_owner_email].some((email) => email && email.toLowerCase() === user.email?.toLowerCase()))) {
        return addSecurityHeaders(
          Response.json({ error: 'Accès refusé' }, { status: 403 })
        );
      }

      if (action === 'sellerInsights') {
        const [products, fulfillments] = await Promise.all([
          base44.asServiceRole.entities.Product.filter({ seller_id: seller.id }, '-sold_count', 100),
          base44.asServiceRole.entities.FulfillmentOrder.filter({ seller_id: seller.id }, '-created_date', 50),
        ]);
        const revenue = fulfillments.reduce((sum, f) => sum + (Number(f.subtotal_usd) || 0), 0);
        const top = products.slice(0, 5).map((p) => text(p.title, 100));
        prompt = `Tu es analyste e-commerce pour AfriTrade (RDC). Donne 3 recommandations très courtes (max 22 mots chacune) et actionnables pour cette boutique, en français.\n\nBoutique: ${text(seller.name, 100)}\nChiffre d'affaires 30j: ${Math.round(revenue)} USD\nCommandes: ${fulfillments.length}\nTop produits: ${top.join(', ')}`;
        schema = { type: 'object', properties: { insights: { type: 'array', items: { type: 'string' } } }, required: ['insights'] };
      } else {
        const title = text(body.title, 160);
        if (!title) {
          return addSecurityHeaders(
            Response.json({ error: 'Titre requis' }, { status: 400 })
          );
        }
        const description = text(body.description, 400);
        if (action === 'description') {
          prompt = `Tu écris pour AfriTrade, une marketplace congolaise (RDC). Rédige une description produit vendeuse de 70 à 110 mots, en français, ton chaleureux et concret, adaptée à un acheteur mobile à Kinshasa. Mentionne l'usage, la qualité et la livraison. Pas de superlatifs mensongers.\n\nProduit: ${title}\nCatégorie: ${text(body.category, 80) || 'général'}\nCaractéristiques: ${JSON.stringify(body.attributes || {}).slice(0, 1000)}`;
        } else if (action === 'tags') {
          prompt = `Propose 6 mots-clés de recherche courts (1 à 3 mots), en français, pour ce produit de mode/e-commerce vendu en RDC. Réponds uniquement en JSON.\n\nTitre: ${title}\nDescription: ${description}`;
          schema = { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } }, required: ['tags'] };
        } else {
          const categories = (await base44.asServiceRole.entities.Category.list('sort_order', 40)).map((c) => text(c.name, 70)).filter(Boolean);
          if (!categories.length) {
            return addSecurityHeaders(
              Response.json({ result: null })
            );
          }
          prompt = `Classe ce produit dans UNE seule catégorie parmi: ${categories.join(', ')}. Réponds en JSON.\n\nTitre: ${title}\nDescription: ${description.slice(0, 300)}`;
          schema = { type: 'object', properties: { category: { type: 'string' }, reason: { type: 'string' } }, required: ['category'] };
        }
      }
    } else {
      const question = text(body.question, 400);
      if (!question) {
        return addSecurityHeaders(
          Response.json({ error: 'Question requise' }, { status: 400 })
        );
      }
      const products = await base44.entities.Product.filter({ status: 'published' }, '-sold_count', 25);
      const catalog = products.map((p) => `- ${text(p.title, 100)} (${text(p.category_name, 60)}) — ${Number(p.price_usd) || 0} USD`).join('\n');
      prompt = `Tu es l'assistant d'achat de AfriTrade, une marketplace en RDC. Réponds en français, en 3 phrases maximum, en recommandant UNIQUEMENT des produits de cette liste et en justifiant brièvement. Si rien ne correspond, propose la catégorie la plus proche.\n\nCatalogue:\n${catalog}\n\nQuestion du client: ${question}`;
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, ...(schema ? { response_json_schema: schema } : {}) });
    return addSecurityHeaders(Response.json({ result }));
  } catch (error) {
    return addSecurityHeaders(
      Response.json({ error: String(error?.message || error) }, { status: 500 })
    );
  }
}