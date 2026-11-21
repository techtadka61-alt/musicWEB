'use client';

import { useState } from 'react';
import { MusicNoteIcon } from '@/components/common/icons';
import { cn } from '@/lib/cn';

/** Fallback tints per category, so songs without cover art still look intentional. */
const CATEGORY_TINTS: Record<string, string> = {
  hindi: 'from-amber-400/35 via-amber-900/30 to-rose-950/60',
  bhojpuri: 'from-rose-400/35 via-rose-900/30 to-orange-950/60',
  punjabi: 'from-emerald-400/30 via-emerald-900/30 to-yellow-950/60',
};
const DEFAULT_TINT = 'from-accent/35 via-surface-raised to-background';

export function categoryTint(slug: string | undefined): string {
  return (slug && CATEGORY_TINTS[slug]) || DEFAULT_TINT;
}

interface ArtworkProps {
  src: string | null;
  /** Used for the image alt text. */
  title: string;
  categorySlug?: string;
  className?: string;
  /** Size of the fallback note icon. */
  iconClassName?: string;
}

/**
 * Cover image with a graceful fallback (missing, failed or slow images).
 * Plain <img>: artwork URLs redirect to short-lived signed URLs that next/image cannot optimise.
 */
export function Artwork({ src, title, categorySlug, className, iconClassName }: ArtworkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = src !== null && src !== failedSrc;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-md bg-linear-to-br',
        categoryTint(categorySlug),
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Cover of ${title}`}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-foreground/70">
          <MusicNoteIcon className={cn('size-1/3', iconClassName)} />
        </div>
      )}
    </div>
  );
}
