import { HeroVideo } from '@/components/layout/hero-video';
import { CategoryGrid } from '@/components/music/category-grid';
import { MostPlayed } from '@/components/music/most-played';
import { RecentlyPlayed } from '@/components/music/recently-played';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      {/* Desktop: a short banner; the full video frame sits on the right at its own aspect ratio
          (nothing cropped) over a blurred copy of itself. Phones: full banner on top, text below. */}
      <section className="relative isolate -mx-4 flex flex-col gap-2 px-4 pb-2 sm:mx-0 sm:h-64 sm:justify-center sm:gap-3 sm:overflow-hidden sm:rounded-3xl sm:px-10 sm:py-0 lg:h-72">
        <HeroVideo />
        <p className="text-[0.65rem] font-medium tracking-[0.3em] text-accent uppercase sm:text-xs">
          Wedding Music
        </p>
        <h1 className="font-display text-3xl leading-tight sm:text-5xl">Nexqira Music</h1>
        <p className="max-w-sm text-sm text-foreground/80 sm:text-base">
          Hindi, Bhojpuri and Punjabi wedding songs. Pick a category and start playing.
        </p>
      </section>

      <section aria-labelledby="categories-heading" className="flex flex-col gap-3">
        <h2
          id="categories-heading"
          className="text-sm font-medium tracking-wide text-muted uppercase"
        >
          Categories
        </h2>
        <CategoryGrid />
      </section>

      <RecentlyPlayed />

      <MostPlayed />
    </div>
  );
}
