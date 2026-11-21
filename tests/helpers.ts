import type { SongDto } from '@wedding/shared';

export function makeSong(n: number, overrides: Partial<SongDto> = {}): SongDto {
  return {
    id: `65f0000000000000000000${String(n).padStart(2, '0')}`,
    title: `Song ${n}`,
    artist: `Artist ${n}`,
    album: null,
    category: { id: '65f00000000000000000aaaa', slug: 'hindi', name: 'Hindi' },
    artworkUrl: null,
    durationSeconds: 200 + n,
    fileSize: 1_000_000 + n,
    mimeType: 'audio/mpeg',
    checksum: 'a'.repeat(63) + String(n % 10),
    ...overrides,
  };
}
