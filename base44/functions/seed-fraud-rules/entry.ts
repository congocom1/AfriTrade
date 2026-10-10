import { readFileSync } from 'node:fs';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { requireAdmin } from '../../shared/security.ts';
import { addSecurityHeaders, getClientKey, checkRateLimit, rateLimitErrorResponse } from '../../shared/securityHeaders.ts';
import { RULES_SEED } from './fraud-rules.json';

/**
 * SEED FRAUD RULES — base44/functions/seed-fraud-rules/entry.ts
 *
 * Pré-remplit l'entité FraudRule avec les règles de base du système de
 * détection de fraude. Idempotent : chaque règle est créée une seule fois,
 * déterminée par son code. Sécurisé : seul un administrateur peut exécuter
 * ce seed, et il n'écrase jamais les règles existantes.
 *
 * À appeler une fois après le déploiement initial, ou après chaque mise à
 * jour du fichier fraud-rules.json quand de nouvelles règles sont ajoutées.
 */

// Rate limiting configuration for seed-fraud-rules (admin function, lower limit)
const SEED_FRAUD_RULES_RATE_LIMIT_PER_HOUR = 5; // Very low limit for admin seed function
const RATE_WINDOW_MS = 3600 * 1000;

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);

    // Rate limiting for seed-fraud-rules
    const clientKey = getClientKey(req);
    if (!clientKey) {
      console.warn(
        "[seed-fraud-rules] no client address on the request — applying shared rate limit",
      );
    }

    const rateLimitResult = await checkRateLimit(
      null, // We'll check this later after we have db
      clientKey || "unidentified",
      {
        keyPrefix: "seed_fraud_rules",
        limit: SEED_FRAUD_RULES_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResult.ok) {
      return rateLimitErrorResponse(rateLimitResult);
    }

    const auth = await requireAdmin(base44);
    if (!auth.ok) return addSecurityHeaders(auth.response);
    const db = base44.asServiceRole;

    // Re-check rate limit now that we have db connection
    const rateLimitResultDb = await checkRateLimit(
      db,
      clientKey || "unidentified",
      {
        keyPrefix: "seed_fraud_rules",
        limit: SEED_FRAUD_RULES_RATE_LIMIT_PER_HOUR,
        windowMs: RATE_WINDOW_MS,
      }
    );

    if (!rateLimitResultDb.ok) {
      return rateLimitErrorResponse(rateLimitResultDb);
    }

    const body = await req.json().catch(() => ({}));

    // Si l'appelant passe explicitement "dry_run": true, on n'écrit rien.
    const dryRun = body.dry_run === true;

    const results = { seeded: 0, skipped: 0, errors: 0, rows: [] };

    for (const rule of RULES_SEED) {
      try {
        const existing = await db.entities.FraudRule.filter(
          { code: rule.code },
          'created_date',
          1
        ).catch(() => []);
        if (existing.length) {
          results.skipped += 1;
          results.rows.push({ code: rule.code, status: 'already_exists' });
          continue;
        }
        if (dryRun) {
          results.rows.push({ code: rule.code, status: 'would_create' });
          continue;
        }
        await db.entities.FraudRule.create({
          code: rule.code,
          label: rule.label,
          description: rule.description || '',
          signal: rule.signal,
          threshold: rule.threshold,
          score: rule.score,
          action: rule.action,
          active: rule.active,
          sort_order: rule.sort_order || 0,
        }).catch((err) => {
          throw new Error(`Échec de la création de ${rule.code}: ${String(err?.message || err).slice(0, 200)}`);
        });
        results.seeded += 1;
        results.rows.push({ code: rule.code, status: 'created' });
      } catch (err) {
        results.errors += 1;
        results.rows.push({ code: rule.code, error: String(err?.message || err).slice(0, 200) });
      }
    }

    return addSecurityHeaders(Response.json({
      dry_run: dryRun,
      total_rules: RULES_SEED.length,
      seeded: results.seeded,
      skipped: results.skipped,
      errors: results.errors,
      rows: results.rows,
    }));
  } catch (err) {
    return addSecurityHeaders(Response.json(
      { error: String(err?.message || err).slice(0, 500), fatal: true },
      { status: 500 }
    ));
  }
}
