const TYPES = new Set(['access', 'rectification', 'deletion', 'opposition']);

/** Persist a request under the authenticated owner's existing RLS policy. */
export async function submitDataRightsRequest(client, form) {
  const user = await client.auth.me();
  if (!user?.email) throw new Error('Authentication required');
  const name = String(form.name || '').trim().slice(0, 200);
  const email = String(form.email || '').trim().slice(0, 254);
  const phone = String(form.phone || '').trim().slice(0, 50);
  if (!TYPES.has(form.type) || !name || (!email && !phone)) throw new Error('Invalid request');
  const requestNumber = `DD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 13).toUpperCase()}`;
  const request = await client.entities.DataRequest.create({
    type: form.type, name, email, phone, details: String(form.details || '').trim().slice(0, 5000),
    request_number: requestNumber, status: 'received',
    tenant_id: user.tenant_id || '', tenant_owner_email: user.email,
  });
  if (!request?.id) throw new Error('Missing request confirmation');
  return request.request_number || requestNumber;
}
