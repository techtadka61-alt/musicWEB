import {
  categorySchema,
  MOST_PLAYED_DEFAULT_PAGE_SIZE,
  mostPlayedSongSchema,
  paginatedSchema,
  playRecordedSchema,
  songSchema,
  SONGS_MAX_PAGE_SIZE,
  streamUrlSchema,
  type CategoryDto,
  type MostPlayedSongDto,
  type Paginated,
  type PlayRecordedDto,
  type SongDto,
  type StreamUrlDto,
} from '@wedding/shared';
import { z } from 'zod';
import { apiClient } from './client';

const categoryListSchema = z.array(categorySchema);
const songPageSchema = paginatedSchema(songSchema);

export function fetchCategories(signal?: AbortSignal): Promise<CategoryDto[]> {
  return apiClient.get('/categories', categoryListSchema, { signal });
}

export function fetchCategory(slug: string, signal?: AbortSignal): Promise<CategoryDto> {
  return apiClient.get(`/categories/${encodeURIComponent(slug)}`, categorySchema, { signal });
}

/** All songs of a category (follows pagination). Libraries are small, so the whole list is the queue. */
export async function fetchCategorySongs(slug: string, signal?: AbortSignal): Promise<SongDto[]> {
  const songs: SongDto[] = [];
  for (let page = 1; ; page += 1) {
    const query = new URLSearchParams({
      category: slug,
      page: String(page),
      limit: String(SONGS_MAX_PAGE_SIZE),
    });
    const result = await apiClient.get(`/songs?${query.toString()}`, songPageSchema, { signal });
    songs.push(...result.items);
    if (page >= result.totalPages) return songs;
  }
}

export function fetchStreamUrl(songId: string, signal?: AbortSignal): Promise<StreamUrlDto> {
  return apiClient.get(`/songs/${encodeURIComponent(songId)}/stream-url`, streamUrlSchema, {
    signal,
  });
}

const mostPlayedPageSchema = paginatedSchema(mostPlayedSongSchema);

/** One page of the "Most played" ranking (loaded page by page as the list scrolls). */
export function fetchMostPlayed(
  page: number,
  signal?: AbortSignal,
): Promise<Paginated<MostPlayedSongDto>> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(MOST_PLAYED_DEFAULT_PAGE_SIZE),
  });
  return apiClient.get(`/songs/most-played?${query.toString()}`, mostPlayedPageSchema, { signal });
}

/** Counts one listen. keepalive lets it finish even if the page is being closed. */
export function recordPlay(songId: string): Promise<PlayRecordedDto> {
  return apiClient.post(`/songs/${encodeURIComponent(songId)}/plays`, playRecordedSchema, {
    keepalive: true,
  });
}
