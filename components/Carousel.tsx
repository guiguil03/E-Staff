'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Horizontal scroll-snap carousel (edX-style card row): a native-scroll
 * track of slides with left/right arrow buttons and dot pagination that
 * tracks scroll position via IntersectionObserver.
 *
 * Each direct child is treated as one slide — the caller is responsible for
 * giving it a width, `shrink-0`, and the `carousel-item` class (scroll-snap
 * alignment lives on that class in globals.css). Arrows disable at either
 * end. All scrolling goes through `scrollBy`/`scrollTo`, gated on
 * `prefers-reduced-motion` (checked live, not cached, so a mid-session OS
 * change is respected).
 */
export function Carousel({
  children,
  ariaLabel,
}: {
  children: ReactNode
  ariaLabel: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const count = Children.count(children)
  const [active, setActive] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(count <= 1)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const items = Array.from(track.children) as HTMLElement[]
    if (!items.length) return

    const updateEdges = () => {
      setAtStart(track.scrollLeft <= 2)
      setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2)
    }
    updateEdges()

    const io = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null
        for (const entry of entries) {
          const idx = items.indexOf(entry.target as HTMLElement)
          if (idx === -1) continue
          if (entry.intersectionRatio > 0 && (!best || entry.intersectionRatio > best.ratio)) {
            best = { idx, ratio: entry.intersectionRatio }
          }
        }
        if (best) setActive(best.idx)
      },
      { root: track, threshold: [0.25, 0.5, 0.75, 1] }
    )
    items.forEach((el) => io.observe(el))

    track.addEventListener('scroll', updateEdges, { passive: true })
    window.addEventListener('resize', updateEdges)
    return () => {
      io.disconnect()
      track.removeEventListener('scroll', updateEdges)
      window.removeEventListener('resize', updateEdges)
    }
  }, [])

  const reducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const scrollByAmount = (dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const item = track.children[0] as HTMLElement | undefined
    const amount = item ? item.getBoundingClientRect().width + 16 : track.clientWidth * 0.8
    track.scrollBy({ left: dir * amount, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current
    const item = track?.children[idx] as HTMLElement | undefined
    if (!track || !item) return
    track.scrollTo({ left: item.offsetLeft, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <div role="group" aria-label={ariaLabel} className="relative">
      <div
        ref={trackRef}
        className="carousel-track flex snap-x snap-mandatory gap-4 overflow-x-auto motion-safe:scroll-smooth"
      >
        {children}
      </div>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center gap-5">
          <button
            type="button"
            aria-label="Élément précédent"
            onClick={() => scrollByAmount(-1)}
            disabled={atStart}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary motion-safe:transition-opacity disabled:opacity-30"
          >
            <CarouselChevron direction="left" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Aller à l'élément ${i + 1} sur ${count}`}
                aria-current={active === i}
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full motion-safe:transition-all ${
                  active === i ? 'w-5 bg-primary' : 'w-1.5 bg-primary/25'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            aria-label="Élément suivant"
            onClick={() => scrollByAmount(1)}
            disabled={atEnd}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary motion-safe:transition-opacity disabled:opacity-30"
          >
            <CarouselChevron direction="right" />
          </button>
        </div>
      )}
    </div>
  )
}

/** Hand-drawn minimal chevron — no icon library. */
function CarouselChevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M15 5 L8 12 L15 19' : 'M9 5 L16 12 L9 19'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
