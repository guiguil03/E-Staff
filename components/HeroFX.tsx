'use client'

import { useEffect, useRef } from 'react'

/**
 * Client-side hero effects, all reduced to writing CSS custom properties on
 * the hero section (rAF-throttled, passive listeners):
 *
 * - Cursor spotlight (fine pointers only): --mx/--my feed the radial
 *   gradient of the .hero-spotlight overlay this component renders, and
 *   data-spot on the section fades it in/out.
 * - Blob scroll parallax: --hero-scroll (unitless px scrolled, clamped)
 *   is multiplied by each blob wrapper's --pf factor in CSS.
 *
 * Under prefers-reduced-motion and on touch devices nothing is attached and
 * the hero behaves exactly as before. Purely decorative.
 */
export function HeroFX() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = ref.current
    const hero = overlay?.parentElement
    if (!overlay || !hero) return
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let raf = 0
    let px = 0
    let py = 0
    let scroll = 0
    let hasPointer = false
    let hasScroll = false

    const apply = () => {
      raf = 0
      if (hasPointer) {
        hasPointer = false
        const rect = hero.getBoundingClientRect()
        hero.style.setProperty('--mx', `${px - rect.left}px`)
        hero.style.setProperty('--my', `${py - rect.top}px`)
      }
      if (hasScroll) {
        hasScroll = false
        hero.style.setProperty('--hero-scroll', String(Math.min(scroll, 600)))
      }
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      hasPointer = true
      schedule()
    }
    const onEnter = () => hero.setAttribute('data-spot', 'on')
    const onLeave = () => hero.removeAttribute('data-spot')
    const onScroll = () => {
      scroll = window.scrollY
      hasScroll = true
      schedule()
    }

    hero.addEventListener('pointermove', onMove, { passive: true })
    hero.addEventListener('pointerenter', onEnter)
    hero.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerenter', onEnter)
      hero.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="hero-spotlight pointer-events-none absolute inset-0"
    />
  )
}
