'use client';

import { useShallow } from 'zustand/react/shallow';
import { Artwork } from '@/components/music/artwork';
import { EqualizerIcon } from '@/components/music/song-list';
import { player } from '@/features/playback/player-controller';
import { playbackOrder } from '@/features/playback/queue';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { usePlayerStore } from '@/store/player-store';

/** The queue in the order it will play (respects shuffle), current song first highlighted. */
export function QueueList() {
  const { queue, currentIndex, shuffle, shuffleOrder, status } = usePlayerStore(
    useShallow((s) => ({
      queue: s.queue,
      currentIndex: s.currentIndex,
      shuffle: s.shuffle,
      shuffleOrder: s.shuffleOrder,
      status: s.status,
    })),
  );
  const order = playbackOrder(queue.length, shuffle, shuffleOrder);
  const start = Math.max(0, order.indexOf(currentIndex));
  const upcoming = [...order.slice(start), ...order.slice(0, start)];

  return (
    <section aria-labelledby="queue-heading" className="flex flex-col gap-2">
      <h2 id="queue-heading" className="text-sm font-medium tracking-wide text-muted uppercase">
        Queue · {queue.length}
      </h2>
      <ol className="flex flex-col gap-0.5">
        {upcoming.map((index) => {
          const song = queue[index];
          if (!song) return null;
          const isCurrent = index === currentIndex;
          return (
            <li key={`${song.id}-${index}`}>
              <button
                type="button"
                onClick={() => (isCurrent ? player.toggle() : player.playIndex(index))}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent',
                  isCurrent && 'bg-surface-raised/70',
                )}
              >
                <Artwork
                  src={song.artworkUrl}
                  title={song.title}
                  categorySlug={song.category.slug}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm', isCurrent && 'text-accent')}>{song.title}</p>
                  <p className="truncate text-xs text-muted">{song.artist ?? song.category.name}</p>
                </div>
                {isCurrent && <EqualizerIcon animate={status === 'playing'} />}
                <span className="text-xs tabular-nums text-muted">
                  {formatDuration(song.durationSeconds)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
