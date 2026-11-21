'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { MostPlayedSongDto } from '@wedding/shared';
import { useEffect, useMemo } from 'react';
import { onPlayRecorded } from '@/features/playback/play-events';
import { queryKeys } from '@/lib/query-keys';
import { fetchMostPlayed } from '@/services/api/catalog.api';

/**
 * "Most played" ranking, fetched page by page (infinite scroll). Refreshes when this device
 * records a play, so the counts move while you listen.
 */
export function useMostPlayed() {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.mostPlayed,
    queryFn: ({ pageParam, signal }) => fetchMostPlayed(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 30_000,
  });

  useEffect(
    () =>
      onPlayRecorded(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.mostPlayed });
      }),
    [queryClient],
  );

  // Counts can change between page loads, shifting a song onto the next page as well;
  // keep its first (higher-ranked) appearance only.
  const songs = useMemo(() => {
    const seen = new Set<string>();
    const result: MostPlayedSongDto[] = [];
    for (const page of query.data?.pages ?? []) {
      for (const song of page.items) {
        if (seen.has(song.id)) continue;
        seen.add(song.id);
        result.push(song);
      }
    }
    return result;
  }, [query.data]);

  return { ...query, songs, total: query.data?.pages.at(-1)?.total ?? 0 };
}
