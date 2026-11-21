import type { SongDto } from '@wedding/shared';

/** Lowercase + strip accents/diacritics marks for Latin text; Devanagari is kept as is. */
function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Client-side search within an already-loaded category: instant, and keeps working offline.
 * Every word must appear in the title, artist or album (in any order).
 */
export function filterSongs(songs: SongDto[], query: string): SongDto[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return songs;
  return songs.filter((song) => {
    const haystack = normalize([song.title, song.artist ?? '', song.album ?? ''].join(' '));
    return words.every((word) => haystack.includes(word));
  });
}
