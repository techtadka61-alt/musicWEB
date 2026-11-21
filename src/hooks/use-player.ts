'use client';

import { useShallow } from 'zustand/react/shallow';
import { selectCurrentSong, usePlayerStore } from '@/store/player-store';

export function useCurrentSong() {
  return usePlayerStore(selectCurrentSong);
}

/** True for the song that is loaded in the player (playing, paused or loading). */
export function useIsCurrentSong(songId: string): boolean {
  return usePlayerStore((s) => selectCurrentSong(s)?.id === songId);
}

export function usePlaybackStatus() {
  return usePlayerStore(
    useShallow((s) => ({
      status: s.status,
      errorMessage: s.errorMessage,
      hasHydrated: s.hasHydrated,
    })),
  );
}

export function usePlaybackProgress() {
  return usePlayerStore(useShallow((s) => ({ position: s.position, duration: s.duration })));
}

export function usePlaybackModes() {
  return usePlayerStore(
    useShallow((s) => ({ shuffle: s.shuffle, repeat: s.repeat, volume: s.volume, muted: s.muted })),
  );
}
