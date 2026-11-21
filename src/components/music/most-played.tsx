'use client';

import type { MostPlayedSongDto, SongDto } from '@wedding/shared';
import { useEffect, useRef } from 'react';
import { FlameIcon } from '@/components/common/icons';
import { RetryButton } from '@/components/common/states';
import { useMostPlayed } from '@/features/most-played/use-most-played';
import { player } from '@/features/playback/player-controller';
import { formatPlayCount } from '@/lib/format';
import { SongList } from './song-list';

const MOST_PLAYED_SOURCE = {
  kind: 'most-played',
  slug: 'most-played',
  name: 'Most played',
} as const;

/** Start loading the next page this far before the end of the list comes into view. */
const PREFETCH_MARGIN = '400px';

/** Queue entries are plain songs; a play count would only go stale in the saved queue. */
function toSong(ranked: MostPlayedSongDto): SongDto {
  const song: SongDto & { playCount?: number } = { ...ranked };
  delete song.playCount;
  return song;
}

/**
 * Songs ranked by how often everyone has listened to them; loads more while scrolling.
 * The whole section stays hidden until there is something to rank (also while loading or if
 * the request fails), so the home page never shows an empty box.
 */
export function MostPlayed() {
  const { songs, total, hasNextPage, fetchNextPage, isFetchingNextPage, isFetchNextPageError } =
    useMostPlayed();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasSongs = songs.length > 0;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasSongs || !sentinel || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void fetchNextPage();
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasSongs, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (!hasSongs) return null;

  return (
    <section aria-labelledby="most-played-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="most-played-heading"
          className="flex items-center gap-2 text-sm font-medium tracking-wide text-muted uppercase"
        >
          <FlameIcon className="text-base text-accent" />
          Most played
        </h2>
        <span className="text-xs text-muted">
          {total} {total === 1 ? 'song' : 'songs'}
        </span>
      </div>

      <SongList
        songs={songs}
        showRank
        onPlay={(index) => player.playList(songs.map(toSong), index, MOST_PLAYED_SOURCE)}
        renderExtra={(song) => (
          <span className="shrink-0 text-xs whitespace-nowrap tabular-nums text-muted">
            {formatPlayCount(song.playCount)}
          </span>
        )}
      />
      <div ref={sentinelRef} className="flex min-h-8 items-center justify-center">
        {isFetchingNextPage ? (
          <span role="status" className="flex items-center gap-2 text-xs text-muted">
            <span
              aria-hidden
              className="block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Loading more…
          </span>
        ) : isFetchNextPageError ? (
          <RetryButton label="Load more" onRetry={() => void fetchNextPage()} />
        ) : hasNextPage ? (
          // Scrolling loads more automatically; the button covers keyboard users.
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            className="text-xs text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Show more
          </button>
        ) : null}
      </div>
    </section>
  );
}
