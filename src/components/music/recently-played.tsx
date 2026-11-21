'use client';

import type { SongDto } from '@wedding/shared';
import { Carousel } from '@/components/common/carousel';
import { MusicNoteIcon, PauseIcon, PlayIcon } from '@/components/common/icons';
import { player } from '@/features/playback/player-controller';
import { useIsCurrentSong } from '@/hooks/use-player';
import { cn } from '@/lib/cn';
import { usePlayerStore } from '@/store/player-store';
import { Artwork } from './artwork';
import { EqualizerIcon } from './song-list';

const RECENT_SOURCE = { kind: 'recent', slug: 'recent', name: 'Recently played' } as const;

const heading = (
  <h2 id="recent-heading" className="text-sm font-medium tracking-wide text-muted uppercase">
    Recently played
  </h2>
);

/**
 * Songs played on this device (stored in this browser only; nothing is sent to the server).
 * Always shown; with no history yet it explains what will appear here.
 */
export function RecentlyPlayed() {
  const recent = usePlayerStore((s) => s.recentlyPlayed);
  const hasHydrated = usePlayerStore((s) => s.hasHydrated);
  // Before the saved history is read, render nothing rather than flash the empty message.
  if (!hasHydrated) return null;

  if (recent.length === 0) {
    return (
      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        {heading}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">
          <MusicNoteIcon className="shrink-0 text-lg" />
          Songs you play on this device will show up here.
        </div>
      </section>
    );
  }

  return (
    <Carousel labelledBy="recent-heading" heading={heading}>
      {recent.map((song, index) => (
        <RecentCard
          key={song.id}
          song={song}
          onPlay={() => player.playList(recent, index, RECENT_SOURCE)}
        />
      ))}
    </Carousel>
  );
}

function RecentCard({ song, onPlay }: { song: SongDto; onPlay: () => void }) {
  const isCurrent = useIsCurrentSong(song.id);
  const status = usePlayerStore((s) => (isCurrent ? s.status : 'idle'));
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');

  return (
    <li className="w-36 shrink-0 snap-start sm:w-40">
      <button
        type="button"
        onClick={() => (isCurrent ? player.toggle() : onPlay())}
        aria-label={`${isPlaying ? 'Pause' : 'Play'} ${song.title}`}
        aria-current={isCurrent ? 'true' : undefined}
        className="group flex w-full flex-col gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-surface-raised/70 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="relative">
          <Artwork
            src={song.artworkUrl}
            title={song.title}
            categorySlug={song.category.slug}
            className={cn(
              'aspect-square w-full rounded-lg shadow-lg shadow-black/40',
              isCurrent && 'ring-2 ring-accent/70',
            )}
            iconClassName="size-1/3"
          />
          <span
            aria-hidden
            className={cn(
              'absolute right-2 bottom-2 flex size-10 items-center justify-center rounded-full bg-accent text-lg text-background shadow-xl shadow-black/50 transition-all duration-200',
              isPlaying
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100',
            )}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon className="translate-x-px" />}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
          <span className="flex items-center gap-1.5">
            {isCurrent && <EqualizerIcon animate={status === 'playing'} />}
            <span
              className={cn('truncate text-sm font-medium', isCurrent && 'text-accent')}
              title={song.title}
            >
              {song.title}
            </span>
          </span>
          <span className="truncate text-xs text-muted">{song.artist ?? song.category.name}</span>
        </div>
      </button>
    </li>
  );
}
