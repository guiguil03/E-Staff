import type { CSSProperties } from 'react'

// One rising curve from A1 to C1. Marker coordinates sit exactly on the
// path (control points are chosen collinear through each marker so the
// curve passes smoothly through them).
const PATH =
  'M 40 210 C 140 214 220 186 320 160 C 420 134 500 132 600 100 C 700 68 780 66 860 40'

const MARKERS = [
  { level: 'A1', x: 40, y: 210 },
  { level: 'B1', x: 320, y: 160 },
  { level: 'B2', x: 600, y: 100 },
  { level: 'C1', x: 860, y: 40 },
] as const

/**
 * The hero's oversized level ribbon: a long curving SVG path that draws
 * itself on load (pathLength=1 + stroke-dashoffset keyframe, so no JS
 * measurement is needed), fading from pale to accent as it climbs to C1.
 * Purely decorative. Reduced motion: fully drawn, markers visible.
 */
export function HeroRibbon() {
  return (
    <svg viewBox="0 0 900 250" className="w-full" aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="hero-ribbon-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F3F5F1" stopOpacity="0.35" />
          <stop offset="0.65" stopColor="#F3F5F1" stopOpacity="0.6" />
          <stop offset="1" stopColor="#D99A2B" />
        </linearGradient>
      </defs>
      {/* Ghost of the full journey, always visible behind the draw. */}
      <path d={PATH} stroke="#F3F5F1" strokeOpacity="0.12" strokeWidth="2" />
      <path
        d={PATH}
        className="ribbon-draw"
        stroke="url(#hero-ribbon-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
      />
      {MARKERS.map((marker, i) => {
        const isFinal = i === MARKERS.length - 1
        return (
          <g
            key={marker.level}
            className="ribbon-marker"
            style={{ '--d': `${1.2 + i * 0.35}s` } as CSSProperties}
          >
            <circle
              className={isFinal ? 'ribbon-final-glow' : undefined}
              cx={marker.x}
              cy={marker.y}
              r={7}
              fill={isFinal ? '#D99A2B' : '#1B3A4B'}
              stroke={isFinal ? '#D99A2B' : 'rgba(243, 245, 241, 0.7)'}
              strokeWidth={2}
            />
            <text
              x={marker.x}
              y={marker.y - 18}
              textAnchor="middle"
              fontFamily="var(--font-plex-mono)"
              fontSize={16}
              fill={isFinal ? '#D99A2B' : 'rgba(243, 245, 241, 0.65)'}
            >
              {marker.level}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
