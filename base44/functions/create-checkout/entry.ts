/**
 * Legacy direct Wix checkout endpoint — permanently disabled.
 * This URL used to accept anonymous order numbers and perform privileged writes
 * and payment-provider API calls. Card sessions are now created only within
 * the authenticated place-order flow, after server-side cart validation.
 * Leave this handler deployed to fail closed for old bookmarked/direct URLs.
 */
export default async function createCheckout(_req: Request): Promise<Response> {
  return Response.json(
    { error: "Direct checkout is disabled. Start checkout from AfriTrade." },
    { status: 410, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
  );
}
