import type { CSSProperties } from 'react'

const REPEAT = 4

/**
 * Full-width editorial ticker band: two identical tracks laid side by side,
 * each animated translateX(0 → -100%) so the loop is seamless (see
 * .marquee-track in globals.css). `direction="right"` plays the same loop
 * backwards; hovering the band pauses it so it becomes readable. `tilt`
 * rotates the whole band -1.5deg so it cuts across the page diagonally —
 * the wrapper overlaps its neighbours slightly (negative margins) and clips
 * horizontally only, so the page never overflows sideways.
 * Under prefers-reduced-motion the animation never applies and the first
 * track simply sits static.
 * The whole band is decorative (every phrase also exists as real content
 * elsewhere on the page), hence aria-hidden.
 */
export function MarqueeBand({
  items,
  variant = 'accent',
  duration = 36,
  direction = 'left',
  tilt = false,
}: {
  items: readonly string[]
  variant?: 'accent' | 'dark'
  duration?: number
  direction?: 'left' | 'right'
  tilt?: boolean
}) {
  const isAccent = variant === 'accent'
  const trackClass = direction === 'left' ? 'marquee-track' : 'marquee-track-reverse'
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

  const band = (
    <div
      aria-hidden="true"
      className={`marquee-band overflow-hidden py-5 md:py-7 ${
        isAccent ? 'bg-accent' : 'bg-primary'
      }`}
    >
      <div
        className="flex w-max"
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        <div className={`${trackClass} flex shrink-0 items-center`}>{track}</div>
        <div className={`${trackClass} flex shrink-0 items-center`}>{track}</div>
      </div>
    </div>
  )

  if (!tilt) return band

  return (
    <div className="relative z-10 -my-4 overflow-x-clip md:-my-6">
      <div className="w-[104%] -ml-[2%] -rotate-[1.5deg]">{band}</div>
    </div>
  )
}
