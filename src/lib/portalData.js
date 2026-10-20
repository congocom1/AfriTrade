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
