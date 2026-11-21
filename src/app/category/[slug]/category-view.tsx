'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  MusicNoteIcon,
  PlayIcon,
  SearchIcon,
  ShuffleIcon,
} from '@/components/common/icons';
import { SearchInput } from '@/components/common/search-input';
import {
  HomeLink,
  MessageState,
  RetryButton,
  Skeleton,
  SongListSkeleton,
} from '@/components/common/states';
import { categoryTint } from '@/components/music/artwork';
import { SongList } from '@/components/music/song-list';
import { useCategory } from '@/features/categories/use-categories';
import { player } from '@/features/playback/player-controller';
import { filterSongs } from '@/features/songs/filter-songs';
import { useCategorySongs } from '@/features/songs/use-category-songs';
import { ApiError } from '@/services/api/http-client';
import { cn } from '@/lib/cn';
import { formatSongCount, formatTotalDuration } from '@/lib/format';

export function CategoryView({ slug }: { slug: string }) {
  const category = useCategory(slug);
  const songs = useCategorySongs(slug);
  const [search, setSearch] = useState('');
  const visible = useMemo(() => filterSongs(songs.data ?? [], search), [songs.data, search]);

  const notFound =
    (category.error instanceof ApiError && category.error.statusCode === 404) ||
    (songs.error instanceof ApiError && songs.error.statusCode === 404);
  if (notFound) {
    return (
      <MessageState
        icon={<MusicNoteIcon />}
        title="Category not found"
        description="This category doesn't exist or isn't available right now."
        action={<HomeLink />}
      />
    );
  }

  const source = { kind: 'category' as const, slug, name: category.data?.name ?? slug };
  const totalSeconds = (songs.data ?? []).reduce((sum, s) => sum + s.durationSeconds, 0);
  const canPlay = visible.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <header
        className={cn(
          '-mx-4 flex flex-col gap-4 bg-linear-to-b px-4 pt-6 pb-2 sm:mx-0 sm:rounded-2xl sm:p-6',
          categoryTint(slug),
        )}
      >
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm text-foreground/70 hover:text-foreground"
        >
          <ChevronLeftIcon /> All categories
        </Link>
        {category.isPending ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <h1 className="font-display text-4xl sm:text-5xl">{category.data?.name ?? slug}</h1>
        )}
        <p className="text-sm text-foreground/70" aria-live="polite">
          {songs.data
            ? `${formatSongCount(songs.data.length)}${totalSeconds > 0 ? ` · ${formatTotalDuration(totalSeconds)}` : ''}`
            : ' '}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={!canPlay}
            onClick={() => player.playList(visible, 0, source, { shuffle: false })}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent-strong disabled:opacity-40"
          >
            <PlayIcon /> Play all
          </button>
          <button
            type="button"
            disabled={!canPlay}
            onClick={() => player.playList(visible, -1, source, { shuffle: true })}
            className="inline-flex items-center gap-2 rounded-full border border-foreground/25 px-5 py-2.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
          >
            <ShuffleIcon /> Shuffle
          </button>
        </div>
      </header>

      <SearchInput
        value={search}
        onChange={setSearch}
        label={`Search ${category.data?.name ?? ''} songs`}
        placeholder="Search by song, artist or film"
      />

      {songs.isPending ? (
        <SongListSkeleton />
      ) : songs.isError ? (
        <MessageState
          tone="error"
          title="Couldn't load songs"
          description="The music server didn't respond. Check your connection and try again."
          action={<RetryButton onRetry={() => void songs.refetch()} />}
        />
      ) : songs.data.length === 0 ? (
        <MessageState
          icon={<MusicNoteIcon />}
          title="No songs here yet"
          description="Songs added to this category will show up here."
        />
      ) : visible.length === 0 ? (
        <MessageState
          icon={<SearchIcon />}
          title={`No songs match “${search.trim()}”`}
          description="Try a different spelling, or search by artist or film."
          action={<RetryButton onRetry={() => setSearch('')} label="Clear search" />}
        />
      ) : (
        <SongList songs={visible} onPlay={(index) => player.playList(visible, index, source)} />
      )}
    </div>
  );
}
