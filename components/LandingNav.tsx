'use client'

const LINKS = [
  { href: '#probleme', label: 'Le problème' },
  { href: '#solution', label: 'La solution' },
  { href: '#double-moteur', label: 'Le double moteur' },
  { href: '#confiance', label: 'Preuve de sérieux' },
  { href: '#apporteurs-clients', label: 'Entreprises & apporteurs' },
  { href: '#offres', label: 'Offres' },
]

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-10 bg-background border-b border-muted/30" aria-label="Navigation de la page">
      <ul className="mx-auto max-w-5xl px-4 py-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs overflow-x-auto">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="whitespace-nowrap hover:text-primary">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
