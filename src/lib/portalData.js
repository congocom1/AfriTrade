/** Reject failed/malformed reads instead of displaying a successful zero total. */
export async function loadRecordGroups(requests) {
  const entries = await Promise.all(Object.entries(requests).map(async ([name, request]) => {
    const rows = await request();
    if (!Array.isArray(rows)) throw new Error(`Invalid ${name} response`);
    return [name, rows];
  }));
  return Object.fromEntries(entries);
}

/** Base44 function invocation returns an HTTP response with its JSON in data. */
export function functionData(response) {
  const data = response?.data;
  if (data == null || typeof data !== 'object' || data.error) {
    throw new Error('Invalid function response');
  }
  return data;
}

/** A replayed event must not inflate counters or leave deleted records visible. */
export function mergeRealtimeRecord(records, event, limit = 150) {
  const id = event?.data?.id || event?.id;
  if (!id || !['create', 'update', 'delete'].includes(event.type)) return records;
  const remaining = records.filter(row => row.id !== id);
  if (event.type === 'delete') return remaining;
  const existing = records.find(row => row.id === id);
  return [{ ...existing, ...event.data, id }, ...remaining]
    .sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')))
    .slice(0, limit);
}
