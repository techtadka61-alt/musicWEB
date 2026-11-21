import { songSchema, type SongDto } from '@wedding/shared';
import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { RepeatMode } from '@/features/playback/queue';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface QueueSource {
  kind: 'category' | 'recent' | 'most-played';
  /** Category slug, 'recent' or 'most-played'. */
  slug: string;
  name: string;
}

export interface PlayerState {
  // Persisted across refreshes
  queue: SongDto[];
  source: QueueSource | null;
  currentIndex: number;
  shuffle: boolean;
  shuffleOrder: number[];
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  /** Last committed playback position of the current song (seconds). */
  resumePosition: number;
  recentlyPlayed: SongDto[];

  // Runtime only
  status: PlaybackStatus;
  position: number;
  duration: number;
  errorMessage: string | null;
  /** False until saved state has been read from localStorage (client only). */
  hasHydrated: boolean;
}

export const RECENTLY_PLAYED_LIMIT = 12;

export const initialPlayerState: PlayerState = {
  queue: [],
  source: null,
  currentIndex: -1,
  shuffle: false,
  shuffleOrder: [],
  repeat: 'off',
  volume: 1,
  muted: false,
  resumePosition: 0,
  recentlyPlayed: [],
  status: 'idle',
  position: 0,
  duration: 0,
  errorMessage: null,
  hasHydrated: false,
};

const persistedSchema = z.object({
  queue: z.array(songSchema).max(1000),
  source: z
    .object({
      kind: z.enum(['category', 'recent', 'most-played']),
      slug: z.string(),
      name: z.string(),
    })
    .nullable(),
  currentIndex: z.number().int().min(-1),
  shuffle: z.boolean(),
  shuffleOrder: z.array(z.number().int().nonnegative()),
  repeat: z.enum(['off', 'all', 'one']),
  volume: z.number().min(0).max(1),
  muted: z.boolean(),
  resumePosition: z.number().nonnegative(),
  recentlyPlayed: z.array(songSchema).max(RECENTLY_PLAYED_LIMIT),
});
type PersistedState = z.infer<typeof persistedSchema>;

/**
 * Restores saved state only if it is fully valid; corrupted or outdated data falls back to
 * defaults instead of crashing the player. Keeps currentIndex inside the queue.
 */
export function mergePersistedState(persisted: unknown, current: PlayerState): PlayerState {
  const parsed = persistedSchema.safeParse(persisted);
  if (!parsed.success) return current;
  const saved = parsed.data;
  const currentIndex = saved.currentIndex < saved.queue.length ? saved.currentIndex : -1;
  return {
    ...current,
    ...saved,
    currentIndex,
    resumePosition: currentIndex === -1 ? 0 : saved.resumePosition,
    status: currentIndex === -1 ? 'idle' : 'paused',
    position: currentIndex === -1 ? 0 : saved.resumePosition,
    duration: saved.queue[currentIndex]?.durationSeconds ?? 0,
  };
}

/** localStorage can throw (private mode, quota, blocked storage); playback must not. */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage full or unavailable: keep playing, just don't persist.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const usePlayerStore = create<PlayerState>()(
  persist(() => initialPlayerState, {
    name: 'wedding-player',
    version: 1,
    storage: createJSONStorage(() => safeLocalStorage),
    // Hydrated explicitly by AudioController after mount, so server and first client render match.
    skipHydration: true,
    partialize: (state): PersistedState => ({
      queue: state.queue,
      source: state.source,
      currentIndex: state.currentIndex,
      shuffle: state.shuffle,
      shuffleOrder: state.shuffleOrder,
      repeat: state.repeat,
      volume: state.volume,
      muted: state.muted,
      resumePosition: state.resumePosition,
      recentlyPlayed: state.recentlyPlayed,
    }),
    merge: mergePersistedState,
  }),
);

export function selectCurrentSong(state: PlayerState): SongDto | null {
  return state.queue[state.currentIndex] ?? null;
}
