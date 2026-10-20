const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

/** Search and paginate the records actually loaded; never imply server totals. */
export function collectionView(records, { query = '', fields = [], predicate = () => true, page = 1, pageSize = 12 } = {}) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const filtered = (Array.isArray(records) ? records : []).filter((record) => {
    if (!predicate(record)) return false;
    const text = fields.map((field) => normalize(record[field])).join(' ');
    return terms.every((term) => text.includes(term));
  });
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(totalPages, Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1));
  const start = (currentPage - 1) * size;
  return { records: filtered.slice(start, start + size), count: filtered.length, page: currentPage, pageSize: size, totalPages, start: filtered.length ? start + 1 : 0, end: Math.min(start + size, filtered.length) };
}
