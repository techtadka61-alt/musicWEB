import { describe, expect, it } from 'vitest';
import { initialPlayerState, mergePersistedState } from '../src/store/player-store';
import { makeSong } from './helpers';

const valid = {
  queue: [makeSong(1), makeSong(2)],
  source: { kind: 'category', slug: 'hindi', name: 'Hindi' },
  currentIndex: 1,
  shuffle: false,
  shuffleOrder: [],
  repeat: 'all',
  volume: 0.4,
  muted: false,
  resumePosition: 73.2,
  recentlyPlayed: [makeSong(2)],
};

describe('mergePersistedState (restore after refresh)', () => {
  it('restores the queue, position and settings as a paused player', () => {
    const state = mergePersistedState(valid, initialPlayerState);
    expect(state).toMatchObject({
      currentIndex: 1,
      repeat: 'all',
      volume: 0.4,
      resumePosition: 73.2,
      position: 73.2,
      status: 'paused',
      duration: valid.queue[1]!.durationSeconds,
    });
  });

  it.each([
    ['null', null],
    ['a string', 'garbage'],
    ['a wrong shape', { queue: 'nope' }],
    ['an invalid song', { ...valid, queue: [{ id: 1 }] }],
    ['an out-of-range volume', { ...valid, volume: 7 }],
  ])('falls back to defaults for %s', (_label, persisted) => {
    expect(mergePersistedState(persisted, initialPlayerState)).toEqual(initialPlayerState);
  });

  it('drops a currentIndex that points outside the queue', () => {
    const state = mergePersistedState({ ...valid, currentIndex: 9 }, initialPlayerState);
    expect(state).toMatchObject({ currentIndex: -1, status: 'idle', resumePosition: 0 });
  });
});
