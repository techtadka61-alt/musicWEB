'use client';

import Link from 'next/link';
import { MusicNoteIcon } from '@/components/common/icons';
import { MessageState, RetryButton, Skeleton } from '@/components/common/states';
import { useCategories } from '@/features/categories/use-categories';
import { cn } from '@/lib/cn';
import { formatSongCount } from '@/lib/format';
import { categoryTint } from './artwork';

export function CategoryGrid() {
  const { data, isPending, isError, refetch } = useCategories();

  if (isPending) {
    return (
      <div role="status" aria-label="Loading categories" className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <MessageState
        tone="error"
        title="Couldn't load music categories"
        description="The music server didn't respond. Check your connection and try again."
        action={<RetryButton onRetry={() => void refetch()} />}
      />
    );
  }

  if (data.length === 0) {
    return (
      <MessageState
        icon={<MusicNoteIcon />}
        title="No music yet"
        description="Categories will appear here once songs have been added."
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {data.map((category) => (
        <li key={category.id}>
          <Link
            href={`/category/${category.slug}`}
            className={cn(
              'group relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl border border-line p-5',
              'bg-linear-to-br transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/60',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              categoryTint(category.slug),
            )}
          >
            <MusicNoteIcon
              aria-hidden
              className="absolute -top-3 -right-3 size-28 text-foreground/10 transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="font-display text-2xl">{category.name}</span>
            <span className="text-sm text-foreground/70">
              {formatSongCount(category.songCount)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
