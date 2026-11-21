import type { StreamUrlDto } from '@wedding/shared';
import { fetchStreamUrl } from '@/services/api/catalog.api';

/** Reuse a signed URL only while it has at least this long left. */
const MIN_REMAINING_MS = 60_000;

const cache = new Map<string, StreamUrlDto>();

/** Signed stream URL for a song; cached until shortly before it expires. */
export async function getStreamUrl(
  songId: string,
  options: { forceRefresh?: boolean } = {},
): Promise<StreamUrlDto> {
  const cached = cache.get(songId);
  if (
    cached &&
    !options.forceRefresh &&
    new Date(cached.expiresAt).getTime() - Date.now() > MIN_REMAINING_MS
  ) {
    return cached;
  }
  const fresh = await fetchStreamUrl(songId);
  cache.set(songId, fresh);
  return fresh;
}

export function clearStreamUrlCache(): void {
  cache.clear();
}
