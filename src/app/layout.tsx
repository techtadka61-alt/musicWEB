import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Suspense } from 'react';
import { OfflineBanner } from '@/components/common/offline-banner';
import { SiteHeader } from '@/components/layout/site-header';
import { AudioController } from '@/components/player/audio-controller';
import { PlayerBar } from '@/components/player/player-bar';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

const sans = Inter({ variable: '--font-sans-family', subsets: ['latin'] });
const display = Playfair_Display({ variable: '--font-display-family', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Nexqira Music', template: '%s · Nexqira Music' },
  description: 'Hindi, Bhojpuri and Punjabi wedding songs.',
  applicationName: 'Nexqira Music',
};

export const viewport: Viewport = {
  themeColor: '#0b0b0c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. ColorZilla's `cz-shortcut-listen`) add
    // attributes to <html>/<body> before React hydrates. Applies to these two elements only.
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        <QueryProvider>
          {/* The player lives in the layout, outside pages, so navigation never interrupts audio. */}
          <AudioController />
          <OfflineBanner />
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32">{children}</main>
          {/* PlayerBar reads the URL (hidden on /player), so it streams in behind Suspense. */}
          <Suspense fallback={null}>
            <PlayerBar />
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}
