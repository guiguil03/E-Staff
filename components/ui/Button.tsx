import Link from 'next/link'
import type { ReactNode } from 'react'

const VARIANTS = {
  primary: 'bg-primary text-white hover:opacity-90',
  accent: 'bg-accent text-ink hover:opacity-90',
  ghost: 'bg-transparent text-primary border border-primary hover:bg-primary hover:text-white',
} as const

export function Button({
  href,
  variant = 'primary',
  children,
  type = 'button',
}: {
  href?: string
  variant?: keyof typeof VARIANTS
  children: ReactNode
  type?: 'button' | 'submit'
}) {
  const classes = `inline-block rounded px-5 py-2.5 font-medium transition-colors ${VARIANTS[variant]}`
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} className={classes}>
      {children}
    </button>
  )
}
