import { describe, expect, it } from 'vitest';
import {
  createShuffleOrder,
  getNextIndex,
  getPreviousIndex,
  playbackOrder,
} from '../src/features/playback/queue';

const linear = [0, 1, 2, 3];

describe('getNextIndex', () => {
  it('advances in order and stops at the end with repeat off', () => {
    expect(
      getNextIndex({ length: 4, currentIndex: 1, order: linear, repeat: 'off', reason: 'user' }),
    ).toBe(2);
    expect(
      getNextIndex({ length: 4, currentIndex: 3, order: linear, repeat: 'off', reason: 'auto' }),
    ).toBeNull();
  });

  it('wraps to the first song with repeat all', () => {
    expect(
      getNextIndex({ length: 4, currentIndex: 3, order: linear, repeat: 'all', reason: 'auto' }),
    ).toBe(0);
  });

  it('repeat one replays when a song ends, but Next still advances', () => {
    expect(
      getNextIndex({ length: 4, currentIndex: 2, order: linear, repeat: 'one', reason: 'auto' }),
    ).toBe(2);
    expect(
      getNextIndex({ length: 4, currentIndex: 2, order: linear, repeat: 'one', reason: 'user' }),
    ).toBe(3);
  });

  it('follows the shuffle order', () => {
    const order = [2, 0, 3, 1];
    expect(getNextIndex({ length: 4, currentIndex: 2, order, repeat: 'off', reason: 'user' })).toBe(
      0,
    );
    expect(getNextIndex({ length: 4, currentIndex: 3, order, repeat: 'off', reason: 'user' })).toBe(
      1,
    );
    expect(
      getNextIndex({ length: 4, currentIndex: 1, order, repeat: 'off', reason: 'auto' }),
    ).toBeNull();
  });

  it('handles an empty queue', () => {
    expect(
      getNextIndex({ length: 0, currentIndex: -1, order: [], repeat: 'all', reason: 'auto' }),
    ).toBeNull();
  });
});

describe('getPreviousIndex', () => {
  it('goes back in order, null at the start unless repeat all', () => {
    expect(getPreviousIndex({ length: 4, currentIndex: 2, order: linear, repeat: 'off' })).toBe(1);
    expect(
      getPreviousIndex({ length: 4, currentIndex: 0, order: linear, repeat: 'off' }),
    ).toBeNull();
    expect(getPreviousIndex({ length: 4, currentIndex: 0, order: linear, repeat: 'all' })).toBe(3);
  });
});

describe('createShuffleOrder', () => {
  it('is a permutation that starts with the current song', () => {
    for (let run = 0; run < 50; run += 1) {
      const order = createShuffleOrder(10, 7);
      expect(order[0]).toBe(7);
      expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
  });

  it('is deterministic for a given random source', () => {
    const seq = [0.1, 0.9, 0.4, 0.7, 0.2];
    let i = 0;
    const random = () => seq[i++ % seq.length]!;
    expect(createShuffleOrder(5, 0, random)).toEqual(
      createShuffleOrder(
        5,
        0,
        (() => {
          let j = 0;
          return () => seq[j++ % seq.length]!;
        })(),
      ),
    );
  });
});

describe('playbackOrder', () => {
  it('uses a valid shuffle order and ignores a stale one', () => {
    expect(playbackOrder(3, true, [2, 0, 1])).toEqual([2, 0, 1]);
    expect(playbackOrder(3, true, [2, 0])).toEqual([0, 1, 2]); // queue changed size
    expect(playbackOrder(3, true, [0, 0, 1])).toEqual([0, 1, 2]); // not a permutation
    expect(playbackOrder(3, false, [2, 0, 1])).toEqual([0, 1, 2]);
  });
});
