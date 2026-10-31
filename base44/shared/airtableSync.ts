/**
 * Reads an Airtable table and applies its rows to AfriTrade products.
 *
 * Rows are matched on the product's supplier reference (external_product_id),
 * then on its slug. Matched products get their stock, price, title and photo
 * updated; unmatched rows that carry a title and a price create a new product.
 */

const PAGE_SIZE = 100;
const MAX_PAGES = 40;
const API = 'https://api.airtable.com/v0';

function norm(value) {
  return String(value ?? '').trim().toLowerCase();
}

function toNumber(value) {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function attachmentUrl(fields, fieldName) {
  if (!fieldName) return '';
  const value = fields[fieldName];
  if (Array.isArray(value) && value.length && value[0]?.url) return value[0].url;
  return '';
}

function slugify(title) {
  return String(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function airtableGet(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(20000),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `Airtable a répondu ${res.status}`);
  return body;
}

export async function listBases(accessToken) {
  const body = await airtableGet(`${API}/meta/bases`, accessToken);
  return (body.bases || []).map((b) => ({ id: b.id, name: b.name }));
}

export async function listTables(accessToken, baseId) {
  if (!baseId) throw new Error('Base Airtable manquante');
  const body = await airtableGet(`${API}/meta/bases/${baseId}/tables`, accessToken);
  return (body.tables || []).map((t) => ({
    id: t.id,
    name: t.name,
    fields: (t.fields || []).map((f) => ({ name: f.name, type: f.type })),
  }));
}

async function fetchRecords(accessToken, baseId, tableId) {
  const records = [];
  let offset = '';
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${API}/${baseId}/${tableId}`);
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    if (offset) url.searchParams.set('offset', offset);
    const body = await airtableGet(url.toString(), accessToken);
    records.push(...(body.records || []));
    offset = body.offset || '';
    if (!offset) break;
  }
  return records;
}

async function loadProducts(base44, supplierId) {
  const query = supplierId ? { supplier_id: supplierId } : {};
  const all = [];
  for (let skip = 0; ; skip += 500) {
    const page = await base44.asServiceRole.entities.Product.filter(query, '-created_date', 500, skip);
    all.push(...page);
    if (page.length < 500) break;
  }
  return all;
}

export async function syncAirtableSource(base44, source, accessToken) {
  const records = await fetchRecords(accessToken, source.base_id, source.table_id);
  const products = await loadProducts(base44, source.supplier_id);

  const byRef = new Map();
  for (const p of products) {
    if (p.slug) byRef.set(norm(p.slug), p);
    if (p.external_product_id) byRef.set(norm(p.external_product_id), p);
  }

  const updates = [];
  const creations = [];
  const unmatched = [];
  const seen = new Set();
  let rows = 0;

  for (const record of records) {
    const fields = record.fields || {};
    const sku = String(fields[source.sku_field] ?? '').trim();
    if (!sku) continue;
    rows += 1;

    const stock = source.stock_field ? toNumber(fields[source.stock_field]) : null;
    const price = source.price_field ? toNumber(fields[source.price_field]) : null;
    const title = source.title_field ? String(fields[source.title_field] ?? '').trim() : '';
    const description = source.description_field ? String(fields[source.description_field] ?? '').trim() : '';
    const image = attachmentUrl(fields, source.image_field);

    const product = byRef.get(norm(sku));

    if (!product) {
      if (!title || price === null || seen.has(norm(sku))) {
        if (!title || price === null) unmatched.push(sku);
        continue;
      }
      seen.add(norm(sku));
      creations.push({
        title,
        slug: slugify(title) || norm(sku),
        external_product_id: sku,
        price_usd: price,
        stock: stock === null ? 0 : Math.max(0, Math.floor(stock)),
        status: 'published',
        source_type: source.supplier_id ? 'local_warehouse' : 'local_seller',
        ...(image ? { images: [image] } : {}),
        ...(description ? { description } : {}),
        ...(source.supplier_id ? { supplier_id: source.supplier_id, supplier_name: source.supplier_name || '' } : {}),
      });
      continue;
    }

    const patch = {};
    if (stock !== null) {
      const next = Math.max(0, Math.floor(stock));
      if (Number(product.stock || 0) !== next) patch.stock = next;
    }
    if (price !== null && Number(product.price_usd || 0) !== price) patch.price_usd = price;
    if (title && title !== product.title) patch.title = title;
    if (description && description !== product.description) patch.description = description;
    if (image && image !== (product.images || [])[0]) patch.images = [image];
    if (Object.keys(patch).length) updates.push({ id: product.id, ...patch });
  }

  for (let i = 0; i < updates.length; i += 500) {
    await base44.asServiceRole.entities.Product.bulkUpdate(updates.slice(i, i + 500));
  }
  for (let i = 0; i < creations.length; i += 200) {
    await base44.asServiceRole.entities.Product.bulkCreate(creations.slice(i, i + 200));
  }

  return { rows, updated: updates.length, created: creations.length, unmatched: unmatched.slice(0, 50) };
}