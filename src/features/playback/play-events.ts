/**
 * Tiny pub/sub so UI (e.g. the "Most played" list) can refresh after the player records a
 * play, without the player controller depending on React or the query client.
 */
type Listener = (songId: string) => void;
const listeners = new Set<Listener>();

export function onPlayRecorded(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitPlayRecorded(songId: string): void {
  for (const listener of listeners) listener(songId);
}
