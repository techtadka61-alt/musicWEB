import type { SongDto } from '@wedding/shared';

export interface MediaSessionActions {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (deltaSeconds: number) => void;
}

const supported = (): boolean => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

/** Lock-screen / notification / headset controls (Android Chrome, desktop, Safari). */
export function registerMediaSessionActions(actions: MediaSessionActions): void {
  if (!supported()) return;
  const session = navigator.mediaSession;
  const set = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
    try {
      session.setActionHandler(action, handler);
    } catch {
      // Action not supported by this browser.
    }
  };
  set('play', () => actions.play());
  set('pause', () => actions.pause());
  set('nexttrack', () => actions.next());
  set('previoustrack', () => actions.previous());
  set('seekbackward', (details) => actions.seekBy(-(details.seekOffset ?? 10)));
  set('seekforward', (details) => actions.seekBy(details.seekOffset ?? 10));
  set('seekto', (details) => {
    if (details.seekTime !== undefined) actions.seekTo(details.seekTime);
  });
}

export function updateMediaSessionMetadata(song: SongDto | null): void {
  if (!supported()) return;
  navigator.mediaSession.metadata = song
    ? new MediaMetadata({
        title: song.title,
        artist: song.artist ?? song.category.name,
        album: song.album ?? 'Nexqira Music',
        artwork: song.artworkUrl ? [{ src: song.artworkUrl }] : [],
      })
    : null;
}

export function updateMediaSessionState(playing: boolean): void {
  if (!supported()) return;
  navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}
