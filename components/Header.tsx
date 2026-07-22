import Link from 'next/link'

const NAV = [
  { href: '/publications', label: 'Publications' },
  { href: '/offres/examens', label: 'Examens' },
  { href: '/offres/fol', label: 'FOL' },
  { href: '/offres/carrieres', label: 'Recrutement' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  return (
    <header className="border-b border-muted/30">
      <nav className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl text-primary">
          Académie & Production
        </Link>
        <ul className="flex flex-wrap gap-4 text-sm">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
