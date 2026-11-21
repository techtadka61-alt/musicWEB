import Link from 'next/link';
import { Suspense } from 'react';
import { NAV_ITEMS, navLinkClass } from './nav-config';
import { NavLinks } from './nav-links';

/** Static header; only the active-link highlight depends on the URL (streamed in via Suspense). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl tracking-wide text-accent">
          Nexqira Music
        </Link>
        <nav aria-label="Main">
          <Suspense
            fallback={
              <ul className="flex gap-1 text-sm">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={navLinkClass(false)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            }
          >
            <NavLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
