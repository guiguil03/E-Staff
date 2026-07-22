import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="border border-muted/40 rounded p-5 bg-white">{children}</div>
}
