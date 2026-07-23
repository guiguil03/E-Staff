'use client'

import { useEffect, useRef, useState } from 'react'

const LEVELS = ['A1', 'B1', 'B2', 'C1'] as const

// The three section anchors that mark the start of each later band. Band 0
// (A1) is simply "top of page" and needs no marker. Once the visitor
// scrolls past a marker's midpoint, its band lights up — the rail is a
// literal scroll-position readout using the site's own level progression.
const BAND_SECTION_IDS = ['solution', 'double-moteur', 'confiance'] as const

export function ScrollProgressRail() {
  const [reachedBand, setReachedBand] = useState(0)
  const tickingRef = useRef(false)

  useEffect(() => {
    // An IntersectionObserver watching a thin trigger line only fires when
    // the browser actually samples an element crossing that exact line —
    // an instant jump (e.g. the hero's own `href="#apporteurs-clients"`
    // anchor link, or a fast programmatic scroll) can leap straight over
    // that line between samples and never fire at all. Reading live
    // bounding rects on scroll/resize (rAF-throttled) is just as cheap for
    // three elements and stays correct at any scroll speed, including
    // instant jumps, so it's used here instead of a threshold-crossing
    // observer.
    const compute = () => {
      tickingRef.current = false
      const half = window.innerHeight / 2
      let count = 0
      for (const id of BAND_SECTION_IDS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= half) count += 1
      }
      setReachedBand((prev) => (prev === count ? prev : count))
    }

    const onScrollOrResize = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(compute)
    }

    compute()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 hidden lg:flex"
    >
      <div className="relative flex h-56 flex-col items-center justify-between">
        <span className="absolute left-1/2 top-1 bottom-1 w-px -translate-x-1/2 bg-primary/20" />
        <span
          className="absolute left-1/2 top-1 w-px origin-top -translate-x-1/2 bg-success motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out"
          style={{
            height: 'calc(100% - 0.5rem)',
            transform: `scaleY(${reachedBand / (LEVELS.length - 1)})`,
          }}
        />
        {LEVELS.map((level, i) => {
          const reached = i <= reachedBand
          return (
            <div key={level} className="relative z-10 flex items-center gap-2">
              <span className="relative block h-3 w-3 shrink-0">
                <span className="absolute inset-0 rounded-full border-2 border-primary bg-background" />
                <span
                  className={`absolute inset-0 rounded-full bg-success motion-safe:transition-opacity motion-safe:duration-500 ${
                    reached ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                {level}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
