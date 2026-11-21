/**
 * Pure queue navigation. Indices always refer to positions in the queue array; shuffle only
 * changes the *order* those indices are visited in, so the queue itself never mutates.
 */
export type RepeatMode = 'off' | 'all' | 'one';

export type AdvanceReason = 'auto' | 'user';

/** Random visiting order of 0..length-1 that starts with `firstIndex` (the song playing now). */
export function createShuffleOrder(
  length: number,
  firstIndex: number,
  random: () => number = Math.random,
): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== firstIndex);
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return firstIndex >= 0 && firstIndex < length ? [firstIndex, ...rest] : rest;
}

/** The order to walk the queue in: the shuffle order when valid, otherwise 0..length-1. */
export function playbackOrder(length: number, shuffle: boolean, shuffleOrder: number[]): number[] {
  if (shuffle && isPermutation(shuffleOrder, length)) return shuffleOrder;
  return Array.from({ length }, (_, i) => i);
}

export interface NavigationInput {
  length: number;
  currentIndex: number;
  order: number[];
  repeat: RepeatMode;
}

/**
 * Next queue index, or null when playback should stop.
 * Repeat-one replays the same song only when a song ends by itself; pressing Next still advances.
 */
export function getNextIndex(input: NavigationInput & { reason: AdvanceReason }): number | null {
  const { length, currentIndex, order, repeat, reason } = input;
  if (length === 0) return null;
  if (reason === 'auto' && repeat === 'one' && currentIndex >= 0) return currentIndex;

  const position = order.indexOf(currentIndex);
  if (position === -1) return order[0] ?? null;
  if (position < order.length - 1) return order[position + 1] ?? null;
  return repeat === 'all' || repeat === 'one' ? (order[0] ?? null) : null;
}

/** Previous queue index, or null at the start (the caller then restarts the current song). */
export function getPreviousIndex(input: NavigationInput): number | null {
  const { length, currentIndex, order, repeat } = input;
  if (length === 0) return null;
  const position = order.indexOf(currentIndex);
  if (position > 0) return order[position - 1] ?? null;
  return repeat === 'all' ? (order[order.length - 1] ?? null) : null;
}

function isPermutation(order: number[], length: number): boolean {
  if (order.length !== length) return false;
  const seen = new Set(order);
  return seen.size === length && order.every((i) => Number.isInteger(i) && i >= 0 && i < length);
}
