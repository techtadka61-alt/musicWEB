'use client';

import { useEffect } from 'react';
import { player } from '@/features/playback/player-controller';
import { usePlayerStore } from '@/store/player-store';

/**
 * Mounted once in the root layout. Connects the global audio engine to the store and
 * restores the saved queue/position/volume. Restoring does not start playback (browsers
 * block autoplay); the first tap on Play resumes from the saved position.
 */
export function AudioController() {
  useEffect(() => {
    player.connect();
    let cancelled = false;
    void Promise.resolve(usePlayerStore.persist.rehydrate()).finally(() => {
      if (!cancelled) usePlayerStore.setState({ hasHydrated: true });
    });

    const save = () => player.savePosition();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
