import type { ReactNode } from 'react'

/**
 * Light, rounded "programme card" language — per the client's reference
 * visuals (`01-reference.png`, `02-reference.png`): white/off-white cards on
 * the page's light background, a colored top band, a soft folded-corner
 * accent, an icon badge, generous rounded corners and a soft shadow. Used
 * for job tracks (Studio Métier), the FOL 5-pillar panel and the Communauté
 * post cards — new elements added in this phase, deliberately distinct from
 * the site's older dark-navy editorial "schéma" panels used elsewhere.
 *
 * Only existing brand tokens are used for tone: primary (navy), accent
 * (gold) and success (green) stand in for the reference's navy/teal/gold
 * gradient band.
 */

const TONE = {
  primary: { bg: 'bg-primary', text: 'text-primary', ring: 'ring-primary/25', soft: 'bg-primary/10' },
  accent: { bg: 'bg-accent', text: 'text-accent', ring: 'ring-accent/30', soft: 'bg-accent/10' },
  success: { bg: 'bg-success', text: 'text-success', ring: 'ring-success/25', soft: 'bg-success/10' },
} as const

export type Tone = keyof typeof TONE

/** Rounded light card: colored top band, folded-corner accent, icon badge,
 * title + description. Renders as a `<button>` when `onClick` is passed
 * (job-track / pillar selection), otherwise a plain `<div>`. */
export function FoldCard({
  tone = 'accent',
  icon,
  title,
  description,
  actionLabel,
  active = false,
  onClick,
  compact = false,
  className = '',
}: {
  tone?: Tone
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  active?: boolean
  onClick?: () => void
  /** Smaller icon badge + body text, for narrow grids (3-4 per row) where the
   * default text-lg title has little room to breathe — see the "Notre
   * vision" talent/entreprise cards on the home page. */
  compact?: boolean
  className?: string
}) {
  const t = TONE[tone]
  const shared = `group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 ${
    compact ? 'p-4' : 'p-5'
  } ${active ? `border-transparent ring-2 ${t.ring} shadow-md` : 'border-muted/15 hover:shadow-md'} ${className}`

  const inner = (
    <>
      <span aria-hidden="true" className={`absolute left-0 top-0 h-1.5 w-full ${t.bg}`} />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-7 -right-7 h-16 w-16 rotate-45 opacity-[0.14] ${t.bg}`}
      />
      {icon && (
        <span
          aria-hidden="true"
          className={`relative mt-1 inline-flex shrink-0 items-center justify-center rounded-full ${
            compact ? 'mb-3 h-9 w-9 p-2' : 'mb-4 h-11 w-11 p-2.5'
          } ${t.soft} ${t.text}`}
        >
          {icon}
        </span>
      )}
      <h3
        className={`relative mb-1.5 break-words font-display leading-snug text-ink ${
          compact ? 'text-base' : 'text-lg'
        }`}
        style={{ hyphens: 'auto' }}
        lang="fr"
      >
        {title}
      </h3>
      {description && <p className="relative text-sm text-muted">{description}</p>}
      {actionLabel && (
        <span className={`relative mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${t.text}`}>
          {actionLabel}
          <span
            aria-hidden="true"
            className="motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={active} className={shared}>
        {inner}
      </button>
    )
  }
  return <div className={shared}>{inner}</div>
}

/** Numbered step card with a solid colored header band (per the "01 / 02 /
 * 03" gradient-band cards in `02-reference.png`) and a white body below for
 * detail text. Used for short selective processes (FOL's two-step
 * presélection/élite process, the Studio Métier readiness steps). */
export function StepCard({
  number,
  title,
  tone = 'primary',
  children,
  className = '',
}: {
  number: string
  title: string
  tone?: Tone
  children: ReactNode
  className?: string
}) {
  const t = TONE[tone]
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-muted/15 bg-white shadow-sm ${className}`}
    >
      <div className={`px-5 py-5 ${t.bg}`}>
        <p className="mb-1 font-mono text-xs tracking-widest text-white/70">{number}</p>
        <h3 className="font-display text-lg leading-snug text-white md:text-xl">{title}</h3>
      </div>
      <div className="flex-1 p-5 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  )
}
