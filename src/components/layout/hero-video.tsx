const VIDEO_SRC = '/media/bg-music-loop.mp4';

/**
 * Decorative, muted banner loop for the home hero (1672×940). Hidden for users who prefer
 * reduced motion; the gradient underneath stays as the fallback.
 *
 * - Phones: the full frame as a banner above the text.
 * - Larger screens: the banner is shorter than 16:9, so the full frame is shown on the right
 *   at its own aspect ratio (never cropped), fading into a blurred copy that fills the rest.
 */
export function HeroVideo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative -z-10 -mx-4 mb-2 aspect-[1672/940] overflow-hidden sm:absolute sm:inset-0 sm:m-0 sm:aspect-auto"
    >
      <div className="absolute inset-0 bg-linear-to-br from-accent/15 via-background to-background" />
      {/* Blurred fill behind everything (larger screens only). */}
      <video
        className="absolute inset-0 hidden size-full scale-110 object-cover opacity-45 blur-2xl motion-reduce:hidden sm:block"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* The full frame. */}
      <video
        className="hero-frame absolute inset-0 size-full object-cover motion-reduce:hidden sm:inset-auto sm:top-0 sm:right-0 sm:aspect-[1672/940] sm:h-full sm:w-auto"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* Phones: fade into the page below. Larger screens: darken the left where the text sits. */}
      <div className="absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent sm:bg-linear-to-r sm:from-background/85 sm:via-background/35" />
    </div>
  );
}
