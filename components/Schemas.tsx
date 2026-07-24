/**
 * Hand-authored inline SVG "schémas" — one editorial diagram per landing
 * section, sharing a single stroke language: thin 1.6px strokes rendered at
 * constant width (vector-effect: non-scaling-stroke), round caps/joins, mono
 * labels, and occasional accent/success fills on the key nodes. They are
 * compositional anchors, not icons. All are decorative (aria-hidden): every
 * piece of information they carry also exists as real text in the section.
 *
 * Palette used: primary #1B3A4B (usually via currentColor so the parent
 * chooses light/dark ink), accent #D99A2B, success #2F6B4F,
 * background #F3F5F1, ink #1A1D1B.
 */

import type { ReactNode } from 'react'

const SW = 1.6
const MONO = 'var(--font-plex-mono)'

type SchemaProps = { className?: string }

/* ------------------------------------------------------------------ */
/* Diptych — Entreprises: a delivery network. A central accent hub     */
/* (e-Staf) wired to satellite client nodes.                           */
/* ------------------------------------------------------------------ */
export function NetworkSchema({ className = '' }: SchemaProps) {
  const hub = { x: 70, y: 72 }
  const nodes = [
    { x: 22, y: 28 },
    { x: 76, y: 14 },
    { x: 122, y: 34 },
    { x: 126, y: 96 },
    { x: 88, y: 126 },
    { x: 26, y: 108 },
  ]
  // Slightly bowed spokes rather than ruler-straight lines — drawn, not plotted.
  const spokes = [
    'M70 72 Q49 48 22 28',
    'M70 72 Q71.5 43 76 14',
    'M70 72 Q99 56 122 34',
    'M70 72 Q99 81 126 96',
    'M70 72 Q82 98 88 126',
    'M70 72 Q50 87 26 108',
  ]
  return (
    <svg viewBox="0 0 144 144" className={className} aria-hidden="true" fill="none">
      {spokes.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth={SW}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {/* two peer-to-peer cross links for the mesh feel */}
      <path
        d="M22 28 L76 14 M126 96 L88 126"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth={SW}
        strokeDasharray="3 5"
        vectorEffect="non-scaling-stroke"
      />
      {nodes.map((n) => (
        <circle
          key={`n-${n.x}-${n.y}`}
          cx={n.x}
          cy={n.y}
          r="5"
          stroke="currentColor"
          strokeOpacity="0.8"
          strokeWidth={SW}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <circle cx={hub.x} cy={hub.y} r="8.5" fill="#D99A2B" />
      <circle
        cx={hub.x}
        cy={hub.y}
        r="14.5"
        stroke="#D99A2B"
        strokeOpacity="0.5"
        strokeWidth={SW}
        strokeDasharray="2.5 5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Diptych — Talents: the staircase to C1. Four treads labeled with    */
/* the levels; the C1 landing carries the accent node.                 */
/* ------------------------------------------------------------------ */
export function StaircaseSchema({ className = '' }: SchemaProps) {
  return (
    <svg viewBox="0 0 152 144" className={className} aria-hidden="true" fill="none">
      {/* ascent guide */}
      <path
        d="M14 116 L118 52"
        stroke="#D99A2B"
        strokeOpacity="0.45"
        strokeWidth={SW}
        strokeDasharray="3 6"
        vectorEffect="non-scaling-stroke"
      />
      {/* the stairs — treads sit a touch off-level, as if inked freehand */}
      <path
        d="M8 127 L43 125.5 L44.2 100.5 L74 99 L75.2 73 L107 71.5 L108.2 46.5 L141 45"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {[
        { label: 'A1', x: 25, y: 119 },
        { label: 'B1', x: 58, y: 93 },
        { label: 'B2', x: 90, y: 66 },
      ].map((s) => (
        <text
          key={s.label}
          x={s.x}
          y={s.y}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="10"
          fill="currentColor"
          fillOpacity="0.6"
        >
          {s.label}
        </text>
      ))}
      <circle cx="127" cy="45.5" r="6" fill="#D99A2B" />
      <text x="127" y="34" textAnchor="middle" fontFamily={MONO} fontSize="11" fill="#D99A2B">
        C1
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* La méthode: the selection funnel. Many candidates in, dashed filter */
/* stages, one certified C1 profile out (success node).                */
/* ------------------------------------------------------------------ */
export function FunnelSchema({ className = '' }: SchemaProps) {
  const candidates = [
    { x: 52, y: 16 },
    { x: 84, y: 10 },
    { x: 114, y: 18 },
    { x: 144, y: 10 },
    { x: 170, y: 20 },
    { x: 68, y: 30 },
    { x: 132, y: 32 },
  ]
  return (
    <svg viewBox="0 0 220 172" className={className} aria-hidden="true" fill="none">
      {candidates.map((c, i) => (
        <circle
          key={`c-${c.x}`}
          cx={c.x}
          cy={c.y}
          r="4"
          stroke="currentColor"
          strokeOpacity={i % 3 === 0 ? 0.85 : 0.45}
          strokeWidth={SW}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {/* funnel body — corners a hair off-square, freehand */}
      <path
        d="M40 47 L180 44 L129 104 L92 106 Z"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* filter stages */}
      <path
        d="M58 66 L162 64.5 M75 86.5 L145 85"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth={SW}
        strokeDasharray="4 5"
        vectorEffect="non-scaling-stroke"
      />
      {/* outflow */}
      <path
        d="M110 106 Q109 116 109.6 126"
        stroke="currentColor"
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M105.5 120.5 L110 127 L114.5 120.5"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="110" cy="143" r="10.5" fill="#2F6B4F" />
      <text x="110" y="147" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill="#F3F5F1">
        C1
      </text>
      <text
        x="110"
        y="166"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="8.5"
        fill="currentColor"
        fillOpacity="0.55"
        letterSpacing="0.12em"
      >
        EXAMENS OFFICIELS
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Le double moteur: two rotors — ACADÉMIE and PRODUCTION — linked by  */
/* a C1-gated flow on top and the "aucun candidat n'est perdu" return  */
/* loop underneath, drawn in success green.                            */
/* ------------------------------------------------------------------ */
export function DoubleEngineSchema({ className = '' }: SchemaProps) {
  return (
    <svg viewBox="0 0 640 320" className={className} aria-hidden="true" fill="none">
      {/* rotor A — académie. Sketched as a nearly-closed arc whose ends miss
          each other slightly, the way a quick pen circle never quite closes. */}
      <path
        d="M172 68.6 A92 91 0 0 1 160 251.5 A90 92 0 0 1 166 66.9"
        stroke="currentColor"
        strokeOpacity="0.8"
        strokeWidth={SW}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="165"
        cy="160"
        rx="75"
        ry="72"
        transform="rotate(-6 165 160)"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth={SW}
        strokeDasharray="5 9"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x="165"
        y="158"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="16"
        fill="currentColor"
        letterSpacing="0.18em"
      >
        ACADÉMIE
      </text>
      <text
        x="165"
        y="178"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="9.5"
        fill="currentColor"
        fillOpacity="0.55"
        letterSpacing="0.14em"
      >
        A1 → C1
      </text>

      {/* rotor B — production */}
      <path
        d="M481 70.2 A91 90 0 0 1 470 250.8 A92 91 0 0 1 474.5 68.4"
        stroke="currentColor"
        strokeOpacity="0.8"
        strokeWidth={SW}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="475"
        cy="160"
        rx="73"
        ry="75"
        transform="rotate(5 475 160)"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth={SW}
        strokeDasharray="5 9"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x="475"
        y="158"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="16"
        fill="currentColor"
        letterSpacing="0.18em"
      >
        PRODUCTION
      </text>
      <text
        x="475"
        y="178"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="9.5"
        fill="currentColor"
        fillOpacity="0.55"
        letterSpacing="0.14em"
      >
        B2B
      </text>

      {/* top flow: académie → production, gated at C1 (curve deliberately uneven) */}
      <path
        d="M225 88 C270 36 365 44 415 88"
        stroke="#D99A2B"
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M411.3 79.8 L415 88 L406.3 85.5"
        stroke="#D99A2B"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="276" cy="57" r="3.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="360" cy="59" r="3.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="318" cy="52" r="15" fill="#D99A2B" />
      <text
        x="318"
        y="56.5"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="12.5"
        fontWeight="600"
        fill="#1A1D1B"
      >
        C1
      </text>

      {/* return loop: production → académie ("aucun candidat n'est perdu") */}
      <path
        d="M415 232 C368 284 272 276 225 232"
        stroke="#2F6B4F"
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M228.7 240.2 L225 232 L233.7 234.5"
        stroke="#2F6B4F"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="362" cy="263" r="3.5" fill="#2F6B4F" />
      <circle cx="278" cy="261" r="3.5" fill="#2F6B4F" />
      <text
        x="320"
        y="303"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="10"
        fill="#2F6B4F"
        letterSpacing="0.14em"
      >
        AUCUN CANDIDAT N&apos;EST PERDU
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Promesses: six tiny marks (28–36px) in the shared stroke language.  */
/* ------------------------------------------------------------------ */
function markSvg(children: ReactNode, className: string) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

/** 01 — locaux équipés & sécurisés */
export function MarkShield({ className = '' }: SchemaProps) {
  return markSvg(
    <>
      <path d="M16 4 L26 8 V15 C26 22 21.5 26.4 16 28 C10.5 26.4 6 22 6 15 V8 Z" vectorEffect="non-scaling-stroke" />
      <path d="M11.6 15.6 L14.8 19 L20.8 12.6" stroke="#2F6B4F" vectorEffect="non-scaling-stroke" />
    </>,
    className
  )
}

/** 02 — encadrement & pilotage: the pulse line under watch */
export function MarkPulse({ className = '' }: SchemaProps) {
  return markSvg(
    <>
      <path d="M3.5 17 H10 L13 9.5 L17.5 24 L20.5 17 H28.5" vectorEffect="non-scaling-stroke" />
      <circle cx="28.5" cy="17" r="2.2" fill="#D99A2B" stroke="none" />
    </>,
    className
  )
}

/** 03 — outils & CRM: layered systems */
export function MarkLayers({ className = '' }: SchemaProps) {
  return markSvg(
    <>
      <rect x="10.5" y="4.5" width="14" height="14" rx="1" strokeOpacity="0.35" transform="rotate(-3 17.5 11.5)" vectorEffect="non-scaling-stroke" />
      <rect x="7.5" y="8.5" width="14" height="14" rx="1" strokeOpacity="0.6" vectorEffect="non-scaling-stroke" />
      <rect x="4.5" y="12.5" width="14" height="14" rx="1" vectorEffect="non-scaling-stroke" />
    </>,
    className
  )
}

/** 04 — confidentialité tarifaire */
export function MarkLock({ className = '' }: SchemaProps) {
  return markSvg(
    <>
      <rect x="8" y="14" width="16" height="12" rx="1.5" vectorEffect="non-scaling-stroke" />
      <path d="M11.7 14 V10.6 a4.4 4.6 0 0 1 8.8 -0.2 V14" vectorEffect="non-scaling-stroke" />
      <circle cx="16" cy="20" r="1.8" fill="#D99A2B" stroke="none" />
    </>,
    className
  )
}

/** 05 — pilotage & reporting hebdomadaire */
export function MarkBars({ className = '' }: SchemaProps) {
  return markSvg(
    <>
      <path d="M4.5 27 H27.5" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
      <rect x="6.5" y="19.5" width="3.6" height="7.5" vectorEffect="non-scaling-stroke" />
      <rect x="12.3" y="14.6" width="4.2" height="12.4" vectorEffect="non-scaling-stroke" />
      <rect x="18.7" y="11.2" width="3.8" height="15.8" vectorEffect="non-scaling-stroke" />
      <rect x="24.4" y="5.8" width="4.1" height="21.2" stroke="#D99A2B" vectorEffect="non-scaling-stroke" />
    </>,
    className
  )
}

/** 06 — zéro turnover / remplacement garanti */
export function MarkRefresh({ className = '' }: SchemaProps) {
  return markSvg(
    <>
      <path d="M23.1 8.9 A10 10 0 1 0 23.1 23.1" vectorEffect="non-scaling-stroke" />
      <path d="M23.1 3.6 V8.9 H17.8" vectorEffect="non-scaling-stroke" />
      <circle cx="23.1" cy="23.1" r="2" fill="#2F6B4F" stroke="none" />
    </>,
    className
  )
}

/* ------------------------------------------------------------------ */
/* Catalogue: the diploma seal — serrated ring, dashed inner ring, C1  */
/* at the heart, two ribbon tails.                                     */
/* ------------------------------------------------------------------ */
export function SealSchema({ className = '' }: SchemaProps) {
  // Serration ticks with deterministic jitter in length and angle so the
  // seal reads as hand-cut rather than lathe-turned.
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const a = (i * Math.PI * 2) / 16 + (i % 2 === 0 ? 0.025 : -0.02)
    const r2 = 45 + ((i * 7) % 3)
    const x1 = 60 + Math.cos(a) * 41
    const y1 = 56 + Math.sin(a) * 41
    const x2 = 60 + Math.cos(a) * r2
    const y2 = 56 + Math.sin(a) * r2
    return `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 120 144" className={className} aria-hidden="true" fill="none">
      {/* ribbons first, tucked behind the medal */}
      <path
        d="M48 92 L40 128 L52 120 L58 134 L63 96"
        stroke="#D99A2B"
        strokeWidth={SW}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="60"
        cy="56"
        r="41"
        fill="#F3F5F1"
        stroke="currentColor"
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={ticks}
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="60"
        cy="56"
        r="31"
        stroke="#D99A2B"
        strokeWidth={SW}
        strokeDasharray="3 6"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x="60"
        y="55"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="17"
        fill="currentColor"
      >
        C1
      </text>
      <text
        x="60"
        y="70"
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="7"
        fill="currentColor"
        fillOpacity="0.55"
        letterSpacing="0.18em"
      >
        CERTIFIÉ
      </text>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Parcours: the C1 checkpoint gate — a candidate dot passes under the */
/* portal on a dashed track.                                           */
/* ------------------------------------------------------------------ */
export function GateSchema({ className = '' }: SchemaProps) {
  return (
    <svg viewBox="0 0 76 48" className={className} aria-hidden="true" fill="none">
      <path
        d="M6 40 H70"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth={SW}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M24 40 L24.8 16.3 M52 40 L51.2 15.6 M23.6 16.4 L52.6 15.5"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <text x="38" y="11" textAnchor="middle" fontFamily={MONO} fontSize="9.5" fill="#D99A2B">
        C1
      </text>
      <path
        d="M10 32 H60"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth={SW}
        strokeDasharray="3 4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M56 28.5 L60.5 32 L56 35.5"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="38" cy="32" r="4" fill="#2F6B4F" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Contact: envelope with an outgoing signal.                          */
/* ------------------------------------------------------------------ */
export function EnvelopeSchema({ className = '' }: SchemaProps) {
  return (
    <svg viewBox="0 0 60 44" className={className} aria-hidden="true" fill="none">
      <g transform="rotate(-2.5 24 25)">
        <rect
          x="5"
          y="13"
          width="37"
          height="25"
          rx="2"
          stroke="currentColor"
          strokeWidth={SW}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M6.5 15 L23.8 27.2 L40.5 14.6"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <path
        d="M46 12 a7.5 7.5 0 0 1 7 7"
        stroke="#D99A2B"
        strokeWidth={SW}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M46.5 5.5 a14 14 0 0 1 13 13"
        stroke="#D99A2B"
        strokeOpacity="0.55"
        strokeWidth={SW}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Hand annotations: a rough double-stroke underline and an open pen   */
/* ring, for marking up a word inside a heading. Stretch to fit via    */
/* preserveAspectRatio="none".                                         */
/* ------------------------------------------------------------------ */
export function RoughUnderline({ className = '' }: SchemaProps) {
  return (
    <svg
      viewBox="0 0 200 14"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4 9 C36 5.5 88 9.5 133 7 C158 5.6 180 7.8 196 6.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M10 12.5 C52 9.5 108 12 168 9.8"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth={SW}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function RoughRing({ className = '' }: SchemaProps) {
  return (
    <svg
      viewBox="0 0 80 48"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M62 8 C40 2 10 6 7 22 C4.5 37 30 45.5 52 42.5 C70 40 77.5 30 71 18.5 C66.5 9.5 50 4.5 38 6.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
