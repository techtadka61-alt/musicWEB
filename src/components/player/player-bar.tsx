'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Artwork } from '@/components/music/artwork';
import { useCurrentSong, usePlaybackProgress, usePlaybackStatus } from '@/hooks/use-player';
import { ForwardButton, NextButton, PlayPauseButton, RewindButton } from './controls';

/** Persistent mini player shown on every page except the full player. */
export function PlayerBar() {
  const song = useCurrentSong();
  const { status, errorMessage, hasHydrated } = usePlaybackStatus();
  const { position, duration } = usePlaybackProgress();
  const pathname = usePathname();

  if (!hasHydrated || !song || pathname === '/player') return null;
  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="h-0.5 bg-line" aria-hidden>
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link
          href="/player"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-accent"
          aria-label={`Open player: ${song.title}`}
        >
          <Artwork
            src={song.artworkUrl}
            title={song.title}
            categorySlug={song.category.slug}
            className="size-11"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{song.title}</p>
            <p className="truncate text-xs text-muted">
              {status === 'error' && errorMessage ? (
                <span className="text-red-300">{errorMessage}</span>
              ) : (
                (song.artist ?? song.category.name)
              )}
            </p>
          </div>
        </Link>
        <RewindButton className="max-sm:hidden" />
        <PlayPauseButton size="sm" />
        <ForwardButton className="max-sm:hidden" />
        <NextButton className="max-sm:hidden" />
      </div>
    </div>
  );
}
