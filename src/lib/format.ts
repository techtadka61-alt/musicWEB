/** 0 → "0:00", 75.4 → "1:15", 3725 → "1:02:05". Invalid input renders as "0:00". */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00';
  const seconds = Math.floor(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** 1 → "1 song", 9 → "9 songs". */
export function formatSongCount(count: number): string {
  return `${count} ${count === 1 ? 'song' : 'songs'}`;
}

/** Total length for headers: 2470 → "41 min", 4000 → "1 hr 7 min". */
export function formatTotalDuration(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** 1 → "1 play", 950 → "950 plays", 1234 → "1.2K plays". */
export function formatPlayCount(count: number): string {
  return `${compactNumber.format(count)} ${count === 1 ? 'play' : 'plays'}`;
}
