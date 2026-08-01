/**
 * Small hand-authored line icons (24x24, single stroke, round caps/joins) —
 * a friendlier, lighter companion to the large decorative "schémas" in
 * `components/Schemas.tsx`. Used inside `FoldCard`/`StepCard` icon badges
 * across the Studio Métier, FOL pillars and Communauté sections. Every icon
 * is decorative (aria-hidden): the information they carry also exists as
 * real text next to them. No icon library — these are inline SVG paths.
 *
 * `className` is applied directly to the `<svg>` (same convention as
 * `components/Schemas.tsx`'s mark components) and controls size + color via
 * `currentColor`; it defaults to a sensible 24px box when the caller omits it.
 */

import type { ReactNode } from 'react'

type IconProps = { className?: string }

function icon(children: ReactNode, className: string) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || 'h-6 w-6'}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/** Présenter avec charisme — a spotlight burst. */
export function IconSpotlight({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M12 3 L12 6.4" />
      <path d="M5.6 5.6 L8 8" />
      <path d="M18.4 5.6 L16 8" />
      <path d="M3 12 H6.4" />
      <path d="M17.6 12 H21" />
      <circle cx="12" cy="14.5" r="4.2" />
    </>,
    className
  )
}

/** Diriger avec autorité — a crown. */
export function IconCrown({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M4 18 H20" />
      <path d="M4.5 18 L4 10 L9 14 L12 8 L15 14 L20 10 L19.5 18 Z" strokeLinejoin="round" />
    </>,
    className
  )
}

/** Négocier avec élégance / Closer — a handshake. */
export function IconHandshake({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M2.5 12 L6.5 8.6 C7.4 7.9 8.6 7.9 9.4 8.6 L11.5 10.4" />
      <path d="M21.5 12 L17.5 8.6 C16.6 7.9 15.4 7.9 14.6 8.6 L12.5 10.4" />
      <path d="M9.4 8.6 L13 12 C13.7 12.7 13.7 13.7 13 14.3 C12.3 15 11.3 15 10.6 14.3 L8.7 12.4" />
      <path d="M6.5 8.6 L3.5 11.3" />
      <path d="M17.5 8.6 L20.5 11.3" />
    </>,
    className
  )
}

/** Répondre avec brio — a lightning bolt. */
export function IconBolt({ className = '' }: IconProps) {
  return icon(
    <path d="M13 3 L6 13.5 H11.2 L10 21 L18 10 H12.6 Z" strokeLinejoin="round" />,
    className
  )
}

/** Incarner la posture PDG — a briefcase. */
export function IconBriefcase({ className = '' }: IconProps) {
  return icon(
    <>
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" />
      <path d="M9 8 V6 a2 2 0 0 1 2 -2 h2 a2 2 0 0 1 2 2 V8" />
      <path d="M3.5 13 H20.5" />
    </>,
    className
  )
}

/** Téléconseiller — a headset. */
export function IconHeadset({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M4 13.5 V12 a8 8 0 0 1 16 0 v1.5" />
      <rect x="3.2" y="13" width="3.4" height="5.4" rx="1.4" />
      <rect x="17.4" y="13" width="3.4" height="5.4" rx="1.4" />
      <path d="M17.4 18.4 V19.5 a2 2 0 0 1 -2 2 H13.4" />
    </>,
    className
  )
}

/** Setter — a target. */
export function IconTarget({ className = '' }: IconProps) {
  return icon(
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>,
    className
  )
}

/** Agent support émailing — an envelope. */
export function IconMail({ className = '' }: IconProps) {
  return icon(
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M3.5 6.5 L12 13 L20.5 6.5" />
    </>,
    className
  )
}

/** Conseiller chat / support digital — a speech bubble. */
export function IconChat({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M4 5.5 H20 V15.5 H9.5 L6 18.5 V15.5 H4 Z" strokeLinejoin="round" />
      <path d="M8 9.5 H16 M8 12.2 H13" />
    </>,
    className
  )
}

/** Voix off & habillage sonore — a microphone. */
export function IconMic({ className = '' }: IconProps) {
  return icon(
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11 a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5 V21 M9 21 H15" />
    </>,
    className
  )
}

/** Community manager — a megaphone. */
export function IconMegaphone({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M3 10.5 V14 h3 l7 4 V6.5 l-7 4 Z" strokeLinejoin="round" />
      <path d="M13.5 8 a4.5 4.5 0 0 1 0 8" />
      <path d="M6.5 14 L7.5 18.5" />
    </>,
    className
  )
}

/** Rédacteur web & stratégie d'écriture — a pen. */
export function IconPen({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M15.5 4.5 L19.5 8.5 L8.5 19.5 L3.8 20.2 L4.5 15.5 Z" strokeLinejoin="round" />
      <path d="M13 7 L17 11" />
    </>,
    className
  )
}

/** Mur des performances — a photo/camera placeholder mark. */
export function IconCamera({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M4 8.5 H7.2 L8.6 6.2 H15.4 L16.8 8.5 H20 V18 H4 Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.4" />
    </>,
    className
  )
}

/** Mur des performances — a video placeholder mark. */
export function IconVideo({ className = '' }: IconProps) {
  return icon(
    <>
      <rect x="3" y="6" width="13" height="12" rx="1.5" />
      <path d="M16 10 L21 7.5 V16.5 L16 14" strokeLinejoin="round" />
    </>,
    className
  )
}

/** Like affordance — a heart. */
export function IconHeart({ className = '', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className || 'h-6 w-6'}
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20 C7 16.4 3 13 3 8.9 C3 6.2 5.1 4.3 7.6 4.3 C9.1 4.3 10.5 5 12 6.6 C13.5 5 14.9 4.3 16.4 4.3 C18.9 4.3 21 6.2 21 8.9 C21 13 17 16.4 12 20 Z" />
    </svg>
  )
}

/** Comment affordance — a compact speech bubble. */
export function IconCommentBubble({ className = '' }: IconProps) {
  return icon(
    <path d="M4 5.5 H20 V15.5 H9.5 L6 18.5 V15.5 H4 Z" strokeLinejoin="round" />,
    className
  )
}

/** Importer une photo — an upload arrow into a tray. */
export function IconUpload({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M12 15 V4.5" />
      <path d="M8 8.5 L12 4.5 L16 8.5" />
      <path d="M4 15.5 V18 a1.5 1.5 0 0 0 1.5 1.5 h13 a1.5 1.5 0 0 0 1.5 -1.5 V15.5" />
    </>,
    className
  )
}

/* ------------------------------------------------------------------ */
/* Added for the "Notre vision" columns and the "Notre parcours"       */
/* roadmap (01-reference.png / 02-reference.png): abstract, sober       */
/* marks in the same single-stroke language as the icons above — never  */
/* literal clip-art.                                                    */
/* ------------------------------------------------------------------ */

/** Du côté des Talents — an abstract dove: two wing sweeps meeting at a
 * body point, a small head dot. Elegant stand-in for "potential in flight". */
export function IconDove({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M2.5 14 C6 9 9.5 9 12 12.5 C14.5 9 18 9 21.5 14" />
      <path d="M12 12.5 V17.5" />
      <circle cx="12" cy="8.6" r="1.1" fill="currentColor" stroke="none" />
    </>,
    className
  )
}

/** Du côté des Entreprises — two overlapping abstract gears (radiating
 * spokes on a ring, same idiom as IconSpotlight), for "structure". */
export function IconGearDuo({ className = '' }: IconProps) {
  return icon(
    <>
      <circle cx="9.3" cy="10" r="4.6" />
      <path d="M9.3 3.6 V5.4 M9.3 14.6 V16.4 M2.7 10 H4.5 M14.1 10 H15.9 M4.9 5.6 L6.2 6.9 M12.4 13.1 L13.7 14.4 M13.7 5.6 L12.4 6.9 M6.2 13.1 L4.9 14.4" />
      <circle cx="16.8" cy="16.5" r="3" />
      <path d="M16.8 11.9 V13.1 M16.8 19.9 V21.1 M12.2 16.5 H13.4 M20.2 16.5 H21.4" />
    </>,
    className
  )
}

/** Se préparer aux examens — a certificate: document with a hanging
 * ribbon seal. */
export function IconCertificate({ className = '' }: IconProps) {
  return icon(
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M6.5 8 H17.5 M6.5 11 H13.5" />
      <path d="M9.5 16 L9 21 L12 19.2 L15 21 L14.5 16" strokeLinejoin="round" />
    </>,
    className
  )
}

/** Découvrir nos meilleurs talents — a person silhouette with a star,
 * for excellence rather than a literal trophy. */
export function IconPersonStar({ className = '' }: IconProps) {
  return icon(
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20 C6.3 15.8 8.8 13.6 12 13.6 C15.2 13.6 17.7 15.8 18.5 20" />
      <path d="M12 1.9 L12.7 3.5 L14.4 3.7 L13.1 4.8 L13.5 6.5 L12 5.6 L10.5 6.5 L10.9 4.8 L9.6 3.7 L11.3 3.5 Z" strokeLinejoin="round" />
    </>,
    className
  )
}

/** Roadmap 01 — évaluation initiale: a clipboard with a check. */
export function IconClipboardCheck({ className = '' }: IconProps) {
  return icon(
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="1.5" />
      <path d="M9 4.5 V3.3 a1.2 1.2 0 0 1 1.2 -1.2 h3.6 a1.2 1.2 0 0 1 1.2 1.2 V4.5" />
      <path d="M8.5 13 L11 15.5 L15.7 10" />
    </>,
    className
  )
}

/** Roadmap 02 — montée en compétence: a brain lobe paired with a small
 * gear, for "trained skill + mechanism". */
export function IconBrainGear({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M9 4.6 C6.4 4.6 4.6 6.6 4.9 9 C3.4 9.9 3.2 12.3 4.7 13.4 C4.3 15.6 6 17.4 8.2 17 C8.7 18.5 11.3 18.6 11.9 17 V6 C11.5 5.1 10.2 4.6 9 4.6 Z" strokeLinejoin="round" />
      <path d="M9 8 V14 M6.6 9.4 H9 M9 11.6 H6.9" />
      <circle cx="18" cy="17" r="2.6" />
      <path d="M18 12.4 V13.6 M18 20.4 V21.6 M13.4 17 H14.6 M21.4 17 H22.6 M14.9 13.9 L15.7 14.7 M20.3 19.3 L21.1 20.1 M20.3 14.7 L21.1 13.9 M14.9 20.1 L15.7 19.3" />
    </>,
    className
  )
}

/** Roadmap 03 — certification & placement: a graduation cap. */
export function IconGraduationCap({ className = '' }: IconProps) {
  return icon(
    <>
      <path d="M2.5 9.5 L12 5 L21.5 9.5 L12 14 Z" strokeLinejoin="round" />
      <path d="M6.5 11.4 V16 C6.5 17.7 9 19 12 19 C15 19 17.5 17.7 17.5 16 V11.4" />
      <path d="M21.5 9.5 V15" />
    </>,
    className
  )
}

/** Small connector chevron between roadmap steps. */
export function IconChevron({ className = '' }: IconProps) {
  return icon(<path d="M9 5 L16 12 L9 19" />, className)
}
