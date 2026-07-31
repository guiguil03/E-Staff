'use client'
import { useEffect, useRef } from 'react'

const LEVELS = ['A1', 'B1', 'B2', 'C1'] as const
type Level = (typeof LEVELS)[number]

export function LanguageRibbon({
  variant = 'static',
  reachedLevel,
}: {
  variant?: 'animated' | 'static'
  reachedLevel?: Level
}) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    if (variant !== 'animated' || !pathRef.current) return
    const length = pathRef.current.getTotalLength()
    pathRef.current.style.strokeDasharray = `${length}`
    pathRef.current.style.strokeDashoffset = `${length}`
    pathRef.current.getBoundingClientRect() // force reflow before transition
    pathRef.current.style.transition = 'stroke-dashoffset 1.2s ease-out'
    pathRef.current.style.strokeDashoffset = '0'
  }, [variant])

  return (
    <svg viewBox="0 0 400 40" className="w-full max-w-md" aria-hidden="true">
      <path
        ref={pathRef}
        d="M10 20 H390"
        stroke="#0F1E37"
        strokeWidth="2"
        fill="none"
      />
      {LEVELS.map((level, i) => {
        const x = 10 + (i * 380) / (LEVELS.length - 1)
        const reached = reachedLevel && LEVELS.indexOf(reachedLevel) >= i
        return (
          <g key={level}>
            <circle cx={x} cy={20} r={6} fill={reached ? '#2F6B4F' : '#F4F3EF'} stroke="#0F1E37" strokeWidth="2" />
            <text x={x} y={36} textAnchor="middle" fontFamily="var(--font-plex-mono)" fontSize="10" fill="#14161A">
              {level}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
