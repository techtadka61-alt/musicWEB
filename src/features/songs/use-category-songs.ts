'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchCategorySongs } from '@/services/api/catalog.api';

export function useCategorySongs(slug: string) {
  return useQuery({
    queryKey: queryKeys.categorySongs(slug),
    queryFn: ({ signal }) => fetchCategorySongs(slug, signal),
    staleTime: 5 * 60_000,
  });
}
