import type { CSSProperties } from 'react'

const REPEAT = 4

/**
 * Full-width editorial ticker band: two identical tracks laid side by side,
 * each animated translateX(0 → -100%) so the loop is seamless (see
 * .marquee-track in globals.css). Under prefers-reduced-motion the
 * animation never applies and the first track simply sits static.
 * The whole band is decorative (every phrase also exists as real content
 * elsewhere on the page), hence aria-hidden.
 */
export function MarqueeBand({
  items,
  variant = 'accent',
  duration = 36,
}: {
  items: readonly string[]
  variant?: 'accent' | 'dark'
  duration?: number
}) {
  const isAccent = variant === 'accent'
  const track = (
    <>
      {Array.from({ length: REPEAT }).map((_, r) =>
        items.map((item, i) => (
          <span
            key={`${r}-${i}`}
            className="flex items-center whitespace-nowrap font-display text-2xl md:text-4xl tracking-tight"
          >
            <span className={isAccent ? 'text-primary' : 'text-stroke-light'}>
              {item}
            </span>
            <span
              className={`mx-5 md:mx-8 ${isAccent ? 'text-primary/40' : 'text-background/30'}`}
            >
              —
            </span>
          </span>
        ))
      )}
    </>
  )

  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden py-5 md:py-7 ${isAccent ? 'bg-accent' : 'bg-primary'}`}
    >
      <div
        className="flex w-max"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className="marquee-track flex shrink-0 items-center">{track}</div>
        <div className="marquee-track flex shrink-0 items-center">{track}</div>
      </div>
    </div>
  )
}
