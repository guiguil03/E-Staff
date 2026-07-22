import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border border-muted/40 rounded p-5 bg-white ${className}`.trim()}>{children}</div>
}
