import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { requireAdmin } from '../../shared/security.ts';
import { listBases, listTables } from '../../shared/airtableSync.ts';
import { addSecurityHeaders } from '../../shared/securityHeaders.ts';

// Lists the bases of the connected Airtable account, or the tables and fields
// of one base, so the admin screen can offer the exact table and field names.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const gate = await requireAdmin(base44);
    if (!gate.ok) return addSecurityHeaders(gate.response);

    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('airtable');

    if (body.base_id) {
      const tables = await listTables(accessToken, String(body.base_id));
      return addSecurityHeaders(Response.json({ tables }));
    }

    const bases = await listBases(accessToken);
    return addSecurityHeaders(Response.json({ bases }));
  } catch (error) {
    return addSecurityHeaders(Response.json({ error: error.message }, { status: 500 }));
  }
}