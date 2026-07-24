'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Card wrapper with a desktop-only cursor spotlight: a gradient border that
 * brightens near the pointer plus a faint interior highlight, both driven by
 * the --px/--py custom properties this component writes (rAF-throttled, one
 * rect read then one write per frame — see .spot-card in globals.css).
 *
 * On touch devices and under prefers-reduced-motion no listener is attached
 * and the CSS never applies: the card renders exactly like a plain div.
 */
export function SpotlightCard({
  children,
  className = '',
  tone = 'light',
}: {
  children: ReactNode
  className?: string
  tone?: 'light' | 'dark'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return

    let raf = 0
    let cx = 0
    let cy = 0

    const apply = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--px', `${cx - rect.left}px`)
      el.style.setProperty('--py', `${cy - rect.top}px`)
    }
    const onMove = (e: PointerEvent) => {
      cx = e.clientX
      cy = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      el.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} className={`spot-card spot-card-${tone} relative ${className}`}>
      {children}
    </div>
  )
}
