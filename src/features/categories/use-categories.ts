'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { fetchCategories, fetchCategory } from '@/services/api/catalog.api';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => fetchCategories(signal),
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.category(slug),
    queryFn: ({ signal }) => fetchCategory(slug, signal),
  });
}
