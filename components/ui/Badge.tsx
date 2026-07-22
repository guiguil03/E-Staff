export function Badge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded bg-primary/10 text-primary font-mono text-xs px-2 py-1">
      {children}
    </span>
  )
}
