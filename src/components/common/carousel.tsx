'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/common/icons';
import { cn } from '@/lib/cn';

/** Pointer travel (px) after which a press becomes a drag and the click is cancelled. */
const DRAG_THRESHOLD_PX = 6;

interface CarouselProps {
  /** Section heading id the list is labelled by. */
  labelledBy: string;
  heading: ReactNode;
  children: ReactNode;
  className?: string;
}

interface ScrollEdges {
  start: boolean;
  end: boolean;
}

/**
 * Horizontal carousel built on native scrolling: touch swipe, trackpad and keyboard work as
 * usual, scroll-snap aligns cards, and arrows page through on desktop. The scrollbar is hidden;
 * faded edges hint that more is available. Mouse users can also drag to scroll.
 * Children should be <li> elements.
 */
export function Carousel({ labelledBy, heading, children, className }: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState<ScrollEdges>({ start: true, end: true });
  const drag = useRef<{ pointerId: number; startX: number; startScroll: number; moved: boolean }>(
    null,
  );
  const [dragging, setDragging] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px tolerance: scrollLeft can be fractional on zoomed / high-DPI screens.
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    const resize = new ResizeObserver(updateEdges);
    resize.observe(el);
    // Cards added/removed (e.g. a new recently played song) change the scroll width.
    const mutations = new MutationObserver(updateEdges);
    mutations.observe(el, { childList: true });
    return () => {
      el.removeEventListener('scroll', updateEdges);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [updateEdges]);

  const page = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLUListElement>) => {
    // Touch and pen already scroll natively; only emulate it for a mouse.
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLUListElement>) => {
    const state = drag.current;
    const el = trackRef.current;
    if (!state || !el || state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.startX;
    if (!state.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      state.moved = true;
      setDragging(true);
      el.setPointerCapture(event.pointerId);
    }
    el.scrollLeft = state.startScroll - dx;
  };

  const endDrag = (event: ReactPointerEvent<HTMLUListElement>) => {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    drag.current = null;
    if (state.moved) {
      // Swallow the click that follows a drag so it doesn't start a song.
      const el = trackRef.current;
      const cancelClick = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
      };
      el?.addEventListener('click', cancelClick, { capture: true, once: true });
      // If no click follows (released outside a card), drop the listener on the next tick.
      setTimeout(() => el?.removeEventListener('click', cancelClick, { capture: true }), 0);
      setDragging(false);
    }
  };

  const scrollable = !(edges.start && edges.end);

  return (
    <section aria-labelledby={labelledBy} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between gap-4">
        {heading}
        {scrollable && (
          <div className="hidden items-center gap-1.5 sm:flex">
            <ArrowButton label="Scroll left" disabled={edges.start} onClick={() => page(-1)}>
              <ChevronLeftIcon />
            </ArrowButton>
            <ArrowButton label="Scroll right" disabled={edges.end} onClick={() => page(1)}>
              <ChevronRightIcon />
            </ArrowButton>
          </div>
        )}
      </div>
      <ul
        ref={trackRef}
        aria-labelledby={labelledBy}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()} // no native image/link dragging
        className={cn(
          // scroll-px matches px: cards snap to the padded edge, so the first one rests at
          // scrollLeft 0 (otherwise snapping pushes it flush to the edge and "start" is never reached).
          'carousel-track -mx-4 flex scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pb-1',
          dragging ? 'cursor-grabbing select-none' : 'snap-x snap-mandatory',
          !edges.start && 'carousel-fade-start',
          !edges.end && 'carousel-fade-end',
        )}
      >
        {children}
      </ul>
    </section>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-full border border-line bg-surface text-lg text-foreground/85 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
