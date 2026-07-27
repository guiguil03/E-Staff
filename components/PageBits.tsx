import Link from 'next/link'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { SpotlightCard } from '@/components/SpotlightCard'

/**
 * Shared editorial "devices" used across the home page and the two
 * audience deep-dive pages (`/entreprises`, `/offres/carrieres`) so the
 * three pages read as one consistent system rather than three unrelated
 * layouts. Extracted from the original single-page `app/page.tsx` during
 * the site split so none of these small, load-bearing pieces of chrome
 * get silently duplicated (and drift) across pages.
 */

/** Grainy noise overlay for a dark banner (inline feTurbulence data-URI). */
export const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Huge watermark act/number letters positioned behind a section's content. */
export function ActWatermark({
  level,
  tone = 'light',
  side = 'right',
}: {
  level: string
  tone?: 'light' | 'dark'
  side?: 'left' | 'right'
}) {
  return (
    <span
      aria-hidden="true"
      className={`watermark-float pointer-events-none absolute top-2 select-none font-mono font-medium leading-none text-[8rem] md:text-[14rem] ${
        side === 'right' ? 'right-0 md:right-4' : 'left-0 md:left-4'
      } ${tone === 'dark' ? 'text-background/5' : 'text-primary/5'}`}
    >
      {level}
    </span>
  )
}

/** Per-word staggered rise for the biggest headings: each word carries its
 * own transition delay and lifts in once the surrounding Reveal fires (see
 * .stagger-rise in globals.css — static under reduced motion). */
export function SplitWords({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="stagger-rise inline-block"
            style={{ '--sd': `${i * 70}ms` } as CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}

/** Mono section kicker: a short label with a thin accent rule that draws
 * itself in shortly after the reveal (see .kicker-rule in globals.css). */
export function ActKicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-accent">
      <span>{children}</span>
      <span aria-hidden="true" className="kicker-rule h-px w-10 shrink-0 bg-accent/70 md:w-16" />
    </p>
  )
}

/** Chapter break between two sections: a centered mono divider mark (short
 * accent rules + dots) so every section boundary reads as intentional. */
export function ChapterBreak() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center gap-4 pt-14 md:pt-16">
      <span className="h-px w-10 bg-accent/60 md:w-14" />
      <span className="font-mono text-xs tracking-[0.6em] text-muted">···</span>
      <span className="h-px w-10 bg-accent/60 md:w-14" />
    </div>
  )
}

/** A small honest-claim chip: mono uppercase label + punchy display value. */
export function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono uppercase text-[10px] md:text-xs tracking-wide text-muted mb-1">
        {label}
      </p>
      <p className="font-display text-lg md:text-xl text-ink">{value}</p>
    </div>
  )
}

/** Mono availability/status badge — the typographic replacement for the
 * client's emoji markers. `available` renders in success green, otherwise a
 * muted primary "waiting" treatment. */
export function StatusBadge({
  available = false,
  children,
}: {
  available?: boolean
  children: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
        available
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-primary/20 bg-primary/5 text-primary/80'
      }`}
    >
      {available && (
        <span aria-hidden="true" className="relative mr-1.5 inline-flex h-1.5 w-1.5 shrink-0">
          <span className="badge-ping absolute inset-0 rounded-full bg-success opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
      )}
      {children}
    </span>
  )
}

/** Compact in-card action link with the site's arrow affordance. */
export function CardAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary">
      {children}
      <span
        aria-hidden="true"
        className="motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  )
}

/** Small floating "preview" card over a dark opener (edX-style glance-proof
 * device): a thin colored top bar stands in for the course-thumbnail zone we
 * don't have photos for, then a mono kicker, a bold title and one mono
 * metadata line. Static — a glance device, not the primary interactive
 * element — but still wrapped in SpotlightCard for the same subtle
 * cursor-glow treatment already used on the lot/carousel cards. Reused
 * identically on all three pages (home, entreprises, carrieres) with
 * page-specific content so the pattern reads as one system. */
export function HeroPreviewCard({
  kicker,
  bar = 'accent',
  title,
  meta,
  badge,
}: {
  kicker: string
  bar?: 'accent' | 'success'
  title: string
  meta: string
  badge: ReactNode
}) {
  return (
    <SpotlightCard className="overflow-hidden rounded bg-white shadow-lg shadow-primary/20">
      <span
        aria-hidden="true"
        className={`block h-1.5 w-full ${bar === 'success' ? 'bg-success' : 'bg-accent'}`}
      />
      <div className="p-4">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">{kicker}</p>
        <p className="mb-2 font-display text-base leading-snug text-ink">{title}</p>
        <p className="mb-3 font-mono text-xs text-muted">{meta}</p>
        {badge}
      </div>
    </SpotlightCard>
  )
}

/** Quiet trust/fact strip at a hero-to-content seam (edX's institution-logo
 * row, reskinned): a slim, minimal horizontal row of short mono capability
 * tags. Content varies per page/audience — only the structure is shared. */
export function TrustStrip({ items }: { items: readonly string[] }) {
  return (
    <div className="relative bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center">
          {items.map((item, i) => (
            <span key={item} className="flex items-center gap-x-2">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted md:text-xs">
                {item}
              </span>
              {i < items.length - 1 && (
                <span aria-hidden="true" className="text-muted/40">
                  ·
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

/** Course-catalogue row: oversized Fraunces programme name on the left,
 * description + CTA in the second editorial column. Whole row is a link. */
export function CatalogueRow({
  href,
  index,
  title,
  description,
  cta,
}: {
  href: string
  index: string
  title: string
  description: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group grid gap-3 py-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12 md:py-10"
    >
      <div>
        <p className="mb-3 font-mono text-xs tracking-widest text-accent">{index}</p>
        <h3 className="font-display text-2xl leading-[1.08] tracking-tight text-ink motion-safe:transition-colors motion-safe:duration-200 group-hover:text-primary md:text-4xl">
          {title}
        </h3>
      </div>
      <div className="md:pt-8">
        <p className="mb-3 text-sm text-muted">{description}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {cta}
          <span
            aria-hidden="true"
            className="motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  )
}
