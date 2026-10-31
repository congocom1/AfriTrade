/**
 * AfriTrade public liveness probe.
 * Does not use elevated Base44 credentials, database entities, or secrets.
 * A successful response confirms that the function runtime can serve requests;
 * it does not claim that payments, storage, auth, or data are healthy.
 */
export default async function health(req: Request): Promise<Response> {
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (req.method !== 'GET' && req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, {
      status: 405,
      headers: { ...headers, Allow: 'GET, POST' },
    });
  }
  return Response.json({ status: 'ok', service: 'AfriTrade API' }, { headers });
}
