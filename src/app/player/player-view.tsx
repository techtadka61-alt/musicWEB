'use client';

import Link from 'next/link';
import { MusicNoteIcon } from '@/components/common/icons';
import { HomeLink, MessageState, Skeleton } from '@/components/common/states';
import { Artwork } from '@/components/music/artwork';
import {
  ForwardButton,
  NextButton,
  PlaybackError,
  PlayPauseButton,
  PreviousButton,
  RepeatButton,
  RewindButton,
  SeekBar,
  ShuffleButton,
  VolumeControl,
} from '@/components/player/controls';
import { QueueList } from '@/components/player/queue-list';
import { useCurrentSong, usePlaybackStatus } from '@/hooks/use-player';
import { usePlayerStore } from '@/store/player-store';

export function PlayerView() {
  const song = useCurrentSong();
  const source = usePlayerStore((s) => s.source);
  const { hasHydrated } = usePlaybackStatus();

  if (!hasHydrated) {
    return <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-2xl" />;
  }

  if (!song) {
    return (
      <MessageState
        icon={<MusicNoteIcon />}
        title="Nothing playing yet"
        description="Pick a category and tap a song to start listening."
        action={<HomeLink />}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
      <section
        aria-label="Now playing"
        className="flex flex-col items-center gap-6 lg:sticky lg:top-24"
      >
        {source && (
          <p className="text-xs tracking-[0.2em] text-muted uppercase">
            Playing from{' '}
            {source.kind === 'category' ? (
              <Link href={`/category/${source.slug}`} className="text-accent hover:underline">
                {source.name}
              </Link>
            ) : (
              <span className="text-accent">{source.name}</span>
            )}
          </p>
        )}
        <Artwork
          src={song.artworkUrl}
          title={song.title}
          categorySlug={song.category.slug}
          className="aspect-square w-full max-w-sm rounded-2xl shadow-2xl shadow-black/60"
          iconClassName="size-1/4"
        />
        <div className="w-full text-center">
          <h1 className="font-display text-2xl leading-tight sm:text-3xl">{song.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {[song.artist, song.album].filter(Boolean).join(' · ') || song.category.name}
          </p>
        </div>
        <SeekBar />
        <div className="flex items-center gap-1 sm:gap-3">
          <PreviousButton />
          <RewindButton />
          <PlayPauseButton size="lg" />
          <ForwardButton />
          <NextButton />
        </div>
        <div className="-mt-3 flex items-center gap-6">
          <ShuffleButton />
          <RepeatButton />
        </div>
        <PlaybackError />
        <div className="hidden sm:block">
          <VolumeControl />
        </div>
      </section>
      <QueueList />
    </div>
  );
}
