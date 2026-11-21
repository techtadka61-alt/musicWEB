'use client';

import type { SongDto } from '@wedding/shared';
import type { ReactNode } from 'react';
import { PauseIcon, PlayIcon } from '@/components/common/icons';
import { player } from '@/features/playback/player-controller';
import { useIsCurrentSong } from '@/hooks/use-player';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { usePlayerStore } from '@/store/player-store';
import { Artwork } from './artwork';

/** Animated bars marking the song that is playing. */
export function EqualizerIcon({ animate }: { animate: boolean }) {
  return (
    <span aria-hidden className="flex h-3.5 items-end gap-[2px]">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className={cn('w-[3px] rounded-sm bg-accent', animate ? 'equalizer-bar' : 'h-1.5')}
          style={animate ? { animationDelay: `${bar * 0.18}s` } : undefined}
        />
      ))}
    </span>
  );
}

interface SongRowProps<TSong extends SongDto> {
  song: TSong;
  index: number;
  onPlay: (index: number) => void;
  showRank?: boolean;
  renderExtra?: (song: TSong) => ReactNode;
}

function SongRow<TSong extends SongDto>({
  song,
  index,
  onPlay,
  showRank,
  renderExtra,
}: SongRowProps<TSong>) {
  const isCurrent = useIsCurrentSong(song.id);
  const status = usePlayerStore((s) => (isCurrent ? s.status : 'idle'));
  const isPlaying = isCurrent && (status === 'playing' || status === 'loading');

  const handleClick = () => {
    if (isCurrent) player.toggle();
    else onPlay(index);
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`${isPlaying ? 'Pause' : 'Play'} ${song.title}`}
        aria-current={isCurrent ? 'true' : undefined}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
          'hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent',
          isCurrent && 'bg-surface-raised/70',
        )}
      >
        {showRank && (
          <span
            aria-label={`Rank ${index + 1}`}
            className={cn(
              'w-7 shrink-0 text-center font-display text-lg tabular-nums',
              index < 3 ? 'text-accent' : 'text-muted',
            )}
          >
            {index + 1}
          </span>
        )}
        <div className="relative">
          <Artwork
            src={song.artworkUrl}
            title={song.title}
            categorySlug={song.category.slug}
            className="size-12"
          />
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-md bg-black/55 text-lg text-foreground transition-opacity',
              isPlaying
                ? 'opacity-0 group-hover:opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
            )}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-medium', isCurrent && 'text-accent')}>
            {song.title}
          </p>
          <p className="truncate text-xs text-muted">
            {[song.artist, song.album].filter(Boolean).join(' · ') || song.category.name}
          </p>
        </div>
        {isCurrent && <EqualizerIcon animate={status === 'playing'} />}
        {renderExtra?.(song)}
        <span
          className={cn(
            'w-12 text-right text-xs tabular-nums text-muted',
            // Narrow screens: room for the extra info instead of the duration.
            renderExtra && 'hidden sm:inline',
          )}
        >
          {formatDuration(song.durationSeconds)}
        </span>
      </button>
    </li>
  );
}

interface SongListProps<TSong extends SongDto> {
  songs: TSong[];
  onPlay: (index: number) => void;
  /** Show the 1-based position in front of each row (rankings). */
  showRank?: boolean;
  /** Extra per-row info shown before the duration (e.g. play count). */
  renderExtra?: (song: TSong) => ReactNode;
}

export function SongList<TSong extends SongDto>({
  songs,
  onPlay,
  showRank,
  renderExtra,
}: SongListProps<TSong>) {
  return (
    <ul className="flex flex-col gap-0.5">
      {songs.map((song, index) => (
        <SongRow
          key={song.id}
          song={song}
          index={index}
          onPlay={onPlay}
          showRank={showRank}
          renderExtra={renderExtra}
        />
      ))}
    </ul>
  );
}
