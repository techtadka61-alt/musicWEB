import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-raised', className)} />;
}

export function SongListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading songs" className="flex flex-col gap-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-12" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

interface MessageStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  tone?: 'neutral' | 'error';
}

export function MessageState({
  title,
  description,
  action,
  icon,
  tone = 'neutral',
}: MessageStateProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-10 text-center"
    >
      {icon && <div className="text-3xl text-muted">{icon}</div>}
      <p className={cn('font-medium', tone === 'error' && 'text-red-300')}>{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function RetryButton({
  onRetry,
  label = 'Try again',
}: {
  onRetry: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
    >
      {label}
    </button>
  );
}

export function HomeLink() {
  return (
    <Link
      href="/"
      className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
    >
      Back to home
    </Link>
  );
}
