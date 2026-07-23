'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type From = 'up' | 'left' | 'right'

/**
 * Scroll-triggered reveal wrapper. Renders its children in a div that starts
 * hidden (opacity 0, offset by `from` direction — see .reveal* in globals.css)
 * and transitions to its natural position the first time it enters the
 * viewport (IntersectionObserver, once). `delay` (ms) staggers siblings.
 *
 * The hidden state only exists under `prefers-reduced-motion: no-preference`,
 * so reduced-motion users always see fully visible static content.
 */
export function Reveal({
  children,
  from = 'up',
  delay = 0,
  className,
}: {
  children: ReactNode
  from?: From
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -5% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const classes = ['reveal', `reveal-${from}`]
  if (revealed) classes.push('is-revealed')
  if (className) classes.push(className)

  return (
    <div
      ref={ref}
      className={classes.join(' ')}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
