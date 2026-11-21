import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  createPlayerController,
  SEEK_STEP_SECONDS,
  type PlayerController,
} from '../src/features/playback/player-controller';
import type { AudioEngine, AudioEngineEvents } from '../src/services/audio/audio-engine';
import { ApiError } from '../src/services/api/http-client';
import { initialPlayerState, type PlayerState } from '../src/store/player-store';
import { makeSong } from './helpers';

/** In-memory stand-in for the HTMLAudioElement wrapper; tests drive its events. */
function createFakeEngine() {
  let events: AudioEngineEvents | null = null;
  let time = 0;
  let src: string | null = null;
  let playing = false;
  const engine = {
    loads: [] as { src: string; startAt: number }[],
    playError: null as Error | null,
    connect: (e: AudioEngineEvents) => {
      events = e;
    },
    load: vi.fn(async (url: string, { startAt }: { startAt: number; autoplay: boolean }) => {
      src = url;
      time = startAt;
      engine.loads.push({ src: url, startAt });
      if (engine.playError) throw engine.playError;
      playing = true;
    }),
    play: vi.fn(async () => {
      playing = true;
    }),
    pause: vi.fn(() => {
      playing = false;
      events?.onPause();
    }),
    seek: vi.fn((t: number) => {
      time = t;
    }),
    setVolume: vi.fn(),
    hasSource: () => src !== null,
    currentTime: () => time,
    isPlaying: () => playing,
    emit: () => events!,
    setTime: (t: number) => {
      time = t;
    },
  };
  return engine;
}

function createStore(initial: Partial<PlayerState> = {}) {
  let state: PlayerState = { ...initialPlayerState, hasHydrated: true, ...initial };
  return {
    getState: () => state,
    setState: (partial: Partial<PlayerState>) => {
      state = { ...state, ...partial };
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const songs = [makeSong(1), makeSong(2), makeSong(3)];
const source = { kind: 'category' as const, slug: 'hindi', name: 'Hindi' };

describe('player controller', () => {
  let engine: ReturnType<typeof createFakeEngine>;
  let store: ReturnType<typeof createStore>;
  type GetStreamUrl = (
    id: string,
    options?: { forceRefresh?: boolean },
  ) => Promise<{ url: string }>;
  let getStreamUrl: Mock<GetStreamUrl>;
  let online: boolean;
  let reportPlay: Mock<(songId: string) => void>;
  let player: PlayerController;

  beforeEach(() => {
    engine = createFakeEngine();
    store = createStore();
    online = true;
    let counter = 0;
    getStreamUrl = vi.fn<GetStreamUrl>(async (id) => ({
      url: `https://cdn.test/${id}?v=${++counter}`,
    }));
    reportPlay = vi.fn<(songId: string) => void>();
    player = createPlayerController({
      engine: engine as unknown as AudioEngine,
      store,
      getStreamUrl,
      isOnline: () => online,
      reportPlay,
      now: () => Date.now(),
      random: () => 0.5,
    });
    player.connect();
  });

  it('plays a list from the chosen song and records it as recently played', async () => {
    player.playList(songs, 1, source);
    await flush();
    engine.emit().onPlaying();

    const s = store.getState();
    expect(s.queue).toHaveLength(3);
    expect(s.currentIndex).toBe(1);
    expect(s.status).toBe('playing');
    expect(s.source).toEqual(source);
    expect(engine.loads.at(-1)).toEqual({ src: expect.stringContaining(songs[1]!.id), startAt: 0 });
    expect(s.recentlyPlayed.map((x) => x.id)).toEqual([songs[1]!.id]);
  });

  it('advances to the next song when one ends, and stops after the last (repeat off)', async () => {
    player.playList(songs, 1, source);
    await flush();
    engine.emit().onEnded();
    await flush();
    expect(store.getState().currentIndex).toBe(2);

    engine.emit().onEnded();
    await flush();
    expect(store.getState().currentIndex).toBe(2);
    expect(store.getState().status).toBe('paused');
    expect(store.getState().resumePosition).toBe(0);
  });

  it('repeat one replays the same song without reloading it', async () => {
    store.setState({ repeat: 'one' });
    player.playList(songs, 0, source);
    await flush();
    const loadsBefore = engine.loads.length;
    engine.setTime(201);
    engine.emit().onEnded();
    expect(engine.seek).toHaveBeenCalledWith(0);
    expect(engine.play).toHaveBeenCalled();
    expect(engine.loads.length).toBe(loadsBefore);
  });

  it('Previous restarts the song after 3 seconds, otherwise goes to the previous song', async () => {
    player.playList(songs, 1, source);
    await flush();
    engine.setTime(42);
    player.previous();
    expect(engine.seek).toHaveBeenCalledWith(0);
    expect(store.getState().currentIndex).toBe(1);

    engine.setTime(1);
    player.previous();
    await flush();
    expect(store.getState().currentIndex).toBe(0);
  });

  it('refreshes an expired stream URL once on a media error and resumes at the same position', async () => {
    player.playList(songs, 0, source);
    await flush();
    engine.emit().onPlaying();
    engine.emit().onTimeUpdate(95);

    engine.emit().onError(null);
    await flush();
    expect(getStreamUrl).toHaveBeenLastCalledWith(songs[0]!.id, { forceRefresh: true });
    expect(engine.loads.at(-1)).toEqual({ src: expect.stringContaining('v=2'), startAt: 95 });

    // A second failure for the same song is reported instead of retrying forever.
    engine.emit().onError(null);
    expect(store.getState().status).toBe('error');
    expect(store.getState().errorMessage).toMatch(/Couldn't play/);
  });

  it('reports an offline-specific message and does not retry while offline', async () => {
    player.playList(songs, 0, source);
    await flush();
    online = false;
    engine.emit().onError(null);
    expect(getStreamUrl).toHaveBeenCalledTimes(1);
    expect(store.getState().errorMessage).toMatch(/offline/);
  });

  it('reports a removed song clearly', async () => {
    getStreamUrl.mockRejectedValueOnce(new ApiError('Song not found', 'http', 404, 'NOT_FOUND'));
    player.playList(songs, 0, source);
    await flush();
    expect(store.getState().status).toBe('error');
    expect(store.getState().errorMessage).toBe('This song is no longer available.');
  });

  it('treats a blocked autoplay as paused, not as an error', async () => {
    engine.playError = new DOMException('blocked', 'NotAllowedError');
    player.playList(songs, 0, source);
    await flush();
    expect(store.getState().status).toBe('paused');
    expect(store.getState().errorMessage).toBeNull();
  });

  it('ignores a slow URL response for a song the user already skipped', async () => {
    let resolveFirst: (value: { url: string }) => void = () => undefined;
    getStreamUrl.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)));
    player.playList(songs, 0, source);
    player.next('user'); // user taps Next before the first URL arrives
    await flush();
    resolveFirst({ url: 'https://cdn.test/stale' });
    await flush();
    expect(engine.loads.map((l) => l.src)).not.toContain('https://cdn.test/stale');
    expect(store.getState().currentIndex).toBe(1);
  });

  it('after a refresh, the first Play resumes from the saved position', async () => {
    store.setState({ queue: songs, currentIndex: 2, resumePosition: 61, status: 'paused' });
    player.play();
    await flush();
    expect(engine.loads.at(-1)).toEqual({
      src: expect.stringContaining(songs[2]!.id),
      startAt: 61,
    });
  });

  it('shuffle keeps the current song and visits every song once', async () => {
    player.playList(songs, 1, source);
    await flush();
    player.toggleShuffle();
    const { shuffleOrder } = store.getState();
    expect(shuffleOrder[0]).toBe(1);
    expect([...shuffleOrder].sort()).toEqual([0, 1, 2]);
    player.toggleShuffle();
    expect(store.getState().shuffleOrder).toEqual([]);
  });

  it('fast-forward / rewind move by 10 s, clamped to the song', async () => {
    player.playList(songs, 0, source);
    await flush();
    engine.setTime(50);
    player.seekBy(SEEK_STEP_SECONDS);
    expect(engine.seek).toHaveBeenLastCalledWith(60);
    player.seekBy(-SEEK_STEP_SECONDS * 10);
    expect(engine.seek).toHaveBeenLastCalledWith(0);
    store.setState({ duration: 65 });
    engine.setTime(60);
    player.seekBy(SEEK_STEP_SECONDS);
    expect(engine.seek).toHaveBeenLastCalledWith(65);
  });

  /** Simulates listening from `from` to `to` seconds with ~quarter-second time updates. */
  const listen = (from: number, to: number) => {
    for (let t = from; t <= to; t += 0.25) {
      engine.setTime(t);
      engine.emit().onTimeUpdate(t);
    }
  };

  it('counts a play once, after 30 s of actual listening', async () => {
    player.playList(songs, 0, source);
    await flush();
    listen(0, 29.5);
    expect(reportPlay).not.toHaveBeenCalled();
    listen(29.75, 120);
    expect(reportPlay).toHaveBeenCalledTimes(1);
    expect(reportPlay).toHaveBeenCalledWith(songs[0]!.id);
  });

  it('skipping ahead does not count as listening', async () => {
    player.playList(songs, 0, source);
    await flush();
    listen(0, 10);
    player.seek(150);
    listen(150, 165);
    player.seekBy(SEEK_STEP_SECONDS);
    listen(175, 178);
    expect(reportPlay).not.toHaveBeenCalled(); // 10 + 15 + 3 = 28 s heard
    listen(178.25, 181);
    expect(reportPlay).toHaveBeenCalledTimes(1);
  });

  it('a new song (or a repeat-one replay) is a new play', async () => {
    store.setState({ repeat: 'one' });
    player.playList(songs, 0, source);
    await flush();
    listen(0, 40);
    engine.emit().onEnded(); // repeat one: same song again
    listen(0, 40);
    player.next('user');
    await flush();
    listen(0, 40);
    expect(reportPlay.mock.calls.map(([id]) => id)).toEqual([
      songs[0]!.id,
      songs[0]!.id,
      songs[1]!.id,
    ]);
  });

  it('a short song counts after most of it is heard', async () => {
    const short = { ...makeSong(9), durationSeconds: 20 };
    player.playList([short], 0, source);
    await flush();
    listen(0, 15);
    expect(reportPlay).not.toHaveBeenCalled();
    listen(15.25, 16.5);
    expect(reportPlay).toHaveBeenCalledTimes(1);
  });

  it('cycles repeat off → all → one → off', () => {
    const seen = [store.getState().repeat];
    for (let i = 0; i < 3; i += 1) {
      player.cycleRepeat();
      seen.push(store.getState().repeat);
    }
    expect(seen).toEqual(['off', 'all', 'one', 'off']);
  });

  it('volume 0 mutes; unmuting from 0 restores an audible level', () => {
    player.setVolume(0);
    expect(store.getState()).toMatchObject({ volume: 0, muted: true });
    player.toggleMute();
    expect(store.getState()).toMatchObject({ volume: 0.6, muted: false });
    expect(engine.setVolume).toHaveBeenLastCalledWith(0.6, false);
  });
});
