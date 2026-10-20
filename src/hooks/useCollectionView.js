import { useState } from 'react';
import { collectionView } from '@/lib/collectionView';

export function useCollectionView(records, fields, matches = () => true) {
  const [query, setQueryValue] = useState('');
  const [filter, setFilterValue] = useState('all');
  const [page, setPage] = useState(1);
  const view = collectionView(records, { query, fields, predicate: (record) => matches(record, filter), page });
  const setQuery = (value) => { setQueryValue(value); setPage(1); };
  const setFilter = (value) => { setFilterValue(value); setPage(1); };
  const reset = () => { setQueryValue(''); setFilterValue('all'); setPage(1); };
  return { ...view, query, setQuery, filter, setFilter, setPage, reset };
}
