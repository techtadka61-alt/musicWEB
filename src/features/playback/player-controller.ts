import { PLAY_COUNT_MIN_LISTEN_SECONDS, type SongDto } from '@wedding/shared';
import { recordPlay } from '@/services/api/catalog.api';
import { ApiError } from '@/services/api/http-client';
import { audioEngine, type AudioEngine } from '@/services/audio/audio-engine';
import { getStreamUrl } from '@/services/audio/stream-url-cache';
import {
  RECENTLY_PLAYED_LIMIT,
  selectCurrentSong,
  usePlayerStore,
  type PlayerState,
  type QueueSource,
} from '@/store/player-store';
import { emitPlayRecorded } from './play-events';
import {
  registerMediaSessionActions,
  updateMediaSessionMetadata,
  updateMediaSessionState,
} from './media-session';
import {
  createShuffleOrder,
  getNextIndex,
  getPreviousIndex,
  playbackOrder,
  type AdvanceReason,
  type RepeatMode,
} from './queue';

/** "Previous" restarts the current song when it has played longer than this. */
export const RESTART_THRESHOLD_SECONDS = 3;
/** How often the playback position is saved for restore-after-refresh. */
const POSITION_COMMIT_INTERVAL_MS = 5_000;
/** Step of the rewind / fast-forward buttons. */
export const SEEK_STEP_SECONDS = 10;
/**
 * Gaps between time updates larger than this are seeks, not listening. Generous because
 * browsers fire timeupdate less often in background tabs.
 */
const MAX_LISTEN_TICK_SECONDS = 5;
/** Short songs count as played after this share of their length. */
const SHORT_SONG_PLAY_RATIO = 0.8;

interface PlayerStore {
  getState: () => PlayerState;
  setState: (partial: Partial<PlayerState>) => void;
}

export interface PlayerControllerDeps {
  engine: AudioEngine;
  store: PlayerStore;
  getStreamUrl: (songId: string, options?: { forceRefresh?: boolean }) => Promise<{ url: string }>;
  isOnline: () => boolean;
  /** Fire-and-forget: count one listen of a song. Failures (e.g. offline) are ignored. */
  reportPlay: (songId: string) => void;
  now: () => number;
  random: () => number;
}

export type PlayerController = ReturnType<typeof createPlayerController>;

export function playbackErrorMessage(error: unknown, online: boolean): string {
  if (!online) return "You're offline. This song can't be streamed right now.";
  if (error instanceof ApiError && error.statusCode === 404) {
    return 'This song is no longer available.';
  }
  return "Couldn't play this song. Check your connection and try again.";
}

const REPEAT_CYCLE: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

export function createPlayerController(deps: PlayerControllerDeps) {
  const { engine, store } = deps;
  const state = (): PlayerState => store.getState();
  const set = (partial: Partial<PlayerState>): void => store.setState(partial);
  const currentSong = (): SongDto | null => selectCurrentSong(state());

  let connected = false;
  /** True from load() until the new source plays or fails; old-source pause events are ignored. */
  let loading = false;
  /** Increments per load so a slow URL fetch for an old song cannot start it after a newer one. */
  let loadSequence = 0;
  /** Song id whose stream URL was already refreshed once after a media error. */
  let retriedSongId: string | null = null;
  let lastPositionCommit = 0;
  /** Seconds actually heard of the current play (seeks excluded), for the play count. */
  let listenedSeconds = 0;
  let lastTick: number | null = null;
  let playCounted = false;

  function startNewPlay(): void {
    listenedSeconds = 0;
    lastTick = null;
    playCounted = false;
  }

  /** Counts one play once enough of the song has been heard (once per play). */
  function trackListening(seconds: number): void {
    const song = currentSong();
    if (!song || playCounted) return;
    if (lastTick !== null) {
      const delta = seconds - lastTick;
      if (delta > 0 && delta <= MAX_LISTEN_TICK_SECONDS) listenedSeconds += delta;
    }
    lastTick = seconds;
    const length = state().duration || song.durationSeconds;
    const threshold = Math.min(PLAY_COUNT_MIN_LISTEN_SECONDS, length * SHORT_SONG_PLAY_RATIO);
    if (threshold > 0 && listenedSeconds >= threshold) {
      playCounted = true;
      deps.reportPlay(song.id);
    }
  }

  function commitPosition(position: number): void {
    set({ resumePosition: position });
    lastPositionCommit = deps.now();
  }

  function rememberRecent(song: SongDto | undefined): void {
    if (!song) return;
    const recent = [song, ...state().recentlyPlayed.filter((s) => s.id !== song.id)];
    set({ recentlyPlayed: recent.slice(0, RECENTLY_PLAYED_LIMIT) });
  }

  function fail(error: unknown): void {
    loading = false;
    set({ status: 'error', errorMessage: playbackErrorMessage(error, deps.isOnline()) });
    updateMediaSessionState(false);
  }

  async function loadCurrent(
    startAt: number,
    options: { refreshUrl?: boolean } = {},
  ): Promise<void> {
    const song = currentSong();
    if (!song) return;
    const sequence = ++loadSequence;
    loading = true;
    lastTick = null;
    set({
      status: 'loading',
      errorMessage: null,
      position: startAt,
      resumePosition: startAt,
      duration: song.durationSeconds,
    });
    updateMediaSessionMetadata(song);

    try {
      const { url } = await deps.getStreamUrl(song.id, { forceRefresh: options.refreshUrl });
      if (sequence !== loadSequence) return;
      engine.setVolume(state().volume, state().muted);
      await engine.load(url, { startAt, autoplay: true });
    } catch (error) {
      if (sequence !== loadSequence) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        // Browser blocked autoplay (no user gesture yet): ready, waiting for a tap.
        loading = false;
        set({ status: 'paused' });
        return;
      }
      fail(error);
    }
  }

  function startIndex(index: number): void {
    retriedSongId = null;
    startNewPlay();
    set({ currentIndex: index });
    rememberRecent(state().queue[index]);
    void loadCurrent(0);
  }

  const controller = {
    /** Wires audio element and lock-screen events to the store. Idempotent. */
    connect(): void {
      if (connected) return;
      connected = true;
      engine.connect({
        onPlaying: () => {
          loading = false;
          set({ status: 'playing', errorMessage: null });
          updateMediaSessionState(true);
        },
        onPause: () => {
          if (loading) return;
          lastTick = null;
          set({ status: 'paused' });
          commitPosition(engine.currentTime());
          updateMediaSessionState(false);
        },
        onWaiting: () => {
          if (state().status === 'playing') set({ status: 'loading' });
        },
        onTimeUpdate: (seconds) => {
          set({ position: seconds });
          trackListening(seconds);
          if (deps.now() - lastPositionCommit >= POSITION_COMMIT_INTERVAL_MS) {
            commitPosition(seconds);
          }
        },
        onDurationChange: (seconds) => set({ duration: seconds }),
        onEnded: () => controller.next('auto'),
        onError: (mediaError) => {
          const song = currentSong();
          // A signed URL may have expired (S3 answers 403): refresh it once and resume.
          if (song && retriedSongId !== song.id && deps.isOnline()) {
            retriedSongId = song.id;
            void loadCurrent(state().position, { refreshUrl: true });
            return;
          }
          fail(mediaError);
        },
      });
      registerMediaSessionActions({
        play: () => controller.play(),
        pause: () => controller.pause(),
        next: () => controller.next('user'),
        previous: () => controller.previous(),
        seekTo: (seconds) => controller.seek(seconds),
        seekBy: (delta) => controller.seekBy(delta),
      });
    },

    /** Replace the queue with `songs` and play `index` (-1 with shuffle = random start). */
    playList(
      songs: SongDto[],
      index: number,
      source: QueueSource,
      options: { shuffle?: boolean } = {},
    ): void {
      if (songs.length === 0) return;
      const shuffle = options.shuffle ?? state().shuffle;
      const first =
        index >= 0 && index < songs.length ? index : Math.floor(deps.random() * songs.length);
      set({
        queue: songs,
        source,
        shuffle,
        shuffleOrder: shuffle ? createShuffleOrder(songs.length, first, deps.random) : [],
      });
      startIndex(first);
    },

    /** Play a song that is already in the queue. */
    playIndex(index: number): void {
      if (index < 0 || index >= state().queue.length) return;
      startIndex(index);
    },

    play(): void {
      const { status } = state();
      if (!currentSong() || status === 'playing') return;
      if (status === 'error') {
        retriedSongId = null;
        void loadCurrent(state().position, { refreshUrl: true });
        return;
      }
      if (engine.hasSource()) {
        engine.play().catch(fail);
      } else {
        // First play after a refresh: resume where the user left off.
        void loadCurrent(state().resumePosition);
      }
    },

    pause(): void {
      engine.pause();
    },

    toggle(): void {
      const { status } = state();
      if (status === 'playing' || (status === 'loading' && engine.isPlaying())) {
        controller.pause();
      } else {
        controller.play();
      }
    },

    next(reason: AdvanceReason = 'user'): void {
      const s = state();
      const order = playbackOrder(s.queue.length, s.shuffle, s.shuffleOrder);
      const next = getNextIndex({
        length: s.queue.length,
        currentIndex: s.currentIndex,
        order,
        repeat: s.repeat,
        reason,
      });
      if (next === null) {
        if (reason === 'auto') {
          // End of the queue: stop at the start of the last song, ready to replay.
          engine.seek(0);
          set({ status: 'paused', position: 0 });
          commitPosition(0);
        }
        return;
      }
      if (next === s.currentIndex) {
        startNewPlay();
        engine.seek(0);
        engine.play().catch(fail);
        return;
      }
      startIndex(next);
    },

    previous(): void {
      const s = state();
      if (engine.currentTime() > RESTART_THRESHOLD_SECONDS) {
        controller.seek(0);
        return;
      }
      const previous = getPreviousIndex({
        length: s.queue.length,
        currentIndex: s.currentIndex,
        order: playbackOrder(s.queue.length, s.shuffle, s.shuffleOrder),
        repeat: s.repeat,
      });
      if (previous === null) {
        controller.seek(0);
      } else {
        startIndex(previous);
      }
    },

    seek(seconds: number): void {
      const duration = state().duration || Number.POSITIVE_INFINITY;
      const target = Math.min(Math.max(0, seconds), duration);
      if (engine.hasSource()) engine.seek(target);
      lastTick = null;
      set({ position: target });
      commitPosition(target);
    },

    /** Rewind (negative) or fast-forward (positive) by a number of seconds. */
    seekBy(deltaSeconds: number): void {
      if (!currentSong()) return;
      const from = engine.hasSource() ? engine.currentTime() : state().position;
      controller.seek(from + deltaSeconds);
    },

    setVolume(volume: number): void {
      const clamped = Math.min(1, Math.max(0, volume));
      const muted = clamped === 0;
      set({ volume: clamped, muted });
      engine.setVolume(clamped, muted);
    },

    toggleMute(): void {
      const { volume, muted } = state();
      const nextMuted = !muted;
      // Unmuting from volume 0 restores an audible level.
      const nextVolume = !nextMuted && volume === 0 ? 0.6 : volume;
      set({ muted: nextMuted, volume: nextVolume });
      engine.setVolume(nextVolume, nextMuted);
    },

    toggleShuffle(): void {
      const s = state();
      if (s.shuffle) {
        set({ shuffle: false, shuffleOrder: [] });
      } else {
        set({
          shuffle: true,
          shuffleOrder: createShuffleOrder(s.queue.length, s.currentIndex, deps.random),
        });
      }
    },

    cycleRepeat(): void {
      set({ repeat: REPEAT_CYCLE[state().repeat] });
    },

    /** Save the exact position (called when the page is hidden/closed). */
    savePosition(): void {
      if (currentSong() && engine.hasSource()) commitPosition(engine.currentTime());
    },
  };

  return controller;
}

export const player: PlayerController = createPlayerController({
  engine: audioEngine,
  store: usePlayerStore,
  getStreamUrl,
  isOnline: () => typeof navigator === 'undefined' || navigator.onLine,
  reportPlay: (songId) => {
    recordPlay(songId)
      .then(() => emitPlayRecorded(songId))
      .catch(() => {
        // Best effort: a missed count (offline, rate limited) must never disturb playback.
      });
  },
  now: () => Date.now(),
  random: Math.random,
});
