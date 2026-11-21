import { cn } from '@/lib/cn';

/** Shared by the server header and the client NavLinks (no 'use client': plain values). */
export const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/player', label: 'Now playing' },
] as const;

export function navLinkClass(active: boolean): string {
  return cn(
    'rounded-full px-3 py-1.5 transition-colors',
    active ? 'bg-surface-raised text-foreground' : 'text-muted hover:text-foreground',
  );
}
