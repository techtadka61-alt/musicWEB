/**
 * The app's single audio element. Lives outside React so playback survives page navigation
 * (Next.js keeps hidden pages alive with <Activity>, and pages must not own audio).
 */
export interface AudioEngineEvents {
  onPlaying: () => void;
  onPause: () => void;
  onWaiting: () => void;
  onEnded: () => void;
  onTimeUpdate: (seconds: number) => void;
  onDurationChange: (seconds: number) => void;
  onError: (error: MediaError | null) => void;
}

export interface AudioEngine {
  connect(events: AudioEngineEvents): void;
  /** Loads a new source, seeks to `startAt` once metadata is available, then plays if asked. */
  load(src: string, options: { startAt: number; autoplay: boolean }): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  setVolume(volume: number, muted: boolean): void;
  hasSource(): boolean;
  currentTime(): number;
  isPlaying(): boolean;
}

/** Browsers reject play() when a newer load() interrupts it; that is expected, not an error. */
function isInterruption(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function createAudioEngine(): AudioEngine {
  let audio: HTMLAudioElement | null = null;
  let events: AudioEngineEvents | null = null;
  let loadToken = 0;

  const element = (): HTMLAudioElement => {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('playing', () => events?.onPlaying());
    audio.addEventListener('pause', () => events?.onPause());
    audio.addEventListener('waiting', () => events?.onWaiting());
    audio.addEventListener('ended', () => events?.onEnded());
    audio.addEventListener('timeupdate', () => events?.onTimeUpdate(audio?.currentTime ?? 0));
    audio.addEventListener('durationchange', () => {
      const duration = audio?.duration ?? 0;
      if (Number.isFinite(duration) && duration > 0) events?.onDurationChange(duration);
    });
    audio.addEventListener('error', () => events?.onError(audio?.error ?? null));
    return audio;
  };

  const play = async (): Promise<void> => {
    try {
      await element().play();
    } catch (error) {
      if (!isInterruption(error)) throw error;
    }
  };

  return {
    connect(handlers) {
      events = handlers;
    },

    async load(src, { startAt, autoplay }) {
      const el = element();
      const token = ++loadToken;
      el.src = src;
      if (startAt > 0) {
        el.addEventListener(
          'loadedmetadata',
          () => {
            if (token === loadToken) el.currentTime = Math.min(startAt, el.duration || startAt);
          },
          { once: true },
        );
      }
      el.load();
      if (autoplay) await play();
    },

    play,

    pause() {
      audio?.pause();
    },

    seek(seconds) {
      const el = element();
      if (Number.isFinite(seconds)) el.currentTime = Math.max(0, seconds);
    },

    setVolume(volume, muted) {
      const el = element();
      el.volume = Math.min(1, Math.max(0, volume));
      el.muted = muted;
    },

    hasSource() {
      return Boolean(audio?.currentSrc);
    },

    currentTime() {
      return audio?.currentTime ?? 0;
    },

    isPlaying() {
      return Boolean(audio && !audio.paused && !audio.ended);
    },
  };
}

export const audioEngine: AudioEngine = createAudioEngine();
