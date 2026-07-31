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
