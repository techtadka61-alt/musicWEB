import { describe, expect, it } from 'vitest';
import { filterSongs } from '../src/features/songs/filter-songs';
import {
  formatDuration,
  formatPlayCount,
  formatSongCount,
  formatTotalDuration,
} from '../src/lib/format';
import { makeSong } from './helpers';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [5.9, '0:05'],
    [75.4, '1:15'],
    [304.35, '5:04'],
    [3725, '1:02:05'],
    [Number.NaN, '0:00'],
    [-3, '0:00'],
  ])('%s → %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe('formatPlayCount', () => {
  it('pluralises and abbreviates large counts', () => {
    expect(formatPlayCount(1)).toBe('1 play');
    expect(formatPlayCount(950)).toBe('950 plays');
    expect(formatPlayCount(1234)).toBe('1.2K plays');
  });
});

describe('formatSongCount / formatTotalDuration', () => {
  it('pluralises and summarises', () => {
    expect(formatSongCount(1)).toBe('1 song');
    expect(formatSongCount(9)).toBe('9 songs');
    expect(formatTotalDuration(2470)).toBe('41 min');
    expect(formatTotalDuration(4000)).toBe('1 hr 7 min');
    expect(formatTotalDuration(3600)).toBe('1 hr');
  });
});

describe('filterSongs', () => {
  const songs = [
    makeSong(1, {
      title: 'Saajanji Ghar Aaye',
      artist: 'Alka Yagnik',
      album: 'Kuch Kuch Hota Hai',
    }),
    makeSong(2, { title: 'लॉलीपॉप लागेलू (Lollypop Lagelu)', artist: 'Pawan Singh' }),
    makeSong(3, { title: 'Ghagra', artist: 'Rekha Bhardwaj', album: 'Yeh Jawaani Hai Deewani' }),
  ];
  const titles = (q: string) => filterSongs(songs, q).map((s) => s.title);

  it('returns everything for an empty query', () => {
    expect(filterSongs(songs, '   ')).toHaveLength(3);
  });

  it('matches partial words in title, artist or film, case-insensitively', () => {
    expect(titles('saaj')).toEqual(['Saajanji Ghar Aaye']);
    expect(titles('PAWAN')).toEqual(['लॉलीपॉप लागेलू (Lollypop Lagelu)']);
    expect(titles('jawaani')).toEqual(['Ghagra']);
  });

  it('requires every word, in any order', () => {
    expect(titles('kuch alka')).toEqual(['Saajanji Ghar Aaye']);
    expect(titles('kuch pawan')).toEqual([]);
  });

  it('matches Devanagari', () => {
    expect(titles('लॉलीपॉप')).toHaveLength(1);
  });
});
