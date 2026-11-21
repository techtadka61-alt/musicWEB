'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, navLinkClass } from './nav-config';

/** Reads the URL, so it must render inside <Suspense> (dynamic routes resolve it at request time). */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex gap-1 text-sm">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={navLinkClass(active)}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
