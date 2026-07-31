import Link from 'next/link'
import type { ReactNode } from 'react'

const VARIANTS = {
  primary: 'bg-primary text-white hover:opacity-90',
  accent: 'bg-accent text-ink hover:opacity-90 motion-safe:hover:scale-[1.02]',
  ghost: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
} as const

export function Button({
  href,
  variant = 'primary',
  children,
  type = 'button',
  onClick,
  disabled = false,
}: {
  href?: string
  variant?: keyof typeof VARIANTS
  children: ReactNode
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
}) {
  const classes = `inline-block rounded px-5 py-2.5 font-medium motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none ${VARIANTS[variant]}`
  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
