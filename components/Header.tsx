import Image from 'next/image'
import Link from 'next/link'

const NAV = [
  { href: '/publications', label: 'Actualités' },
  { href: '/offres/examens', label: 'Se préparer aux examens' },
  { href: '/offres/carrieres', label: 'Candidater' },
  { href: '/entreprises', label: 'Proposer un partenariat' },
  { href: '/communaute', label: 'Communauté' },
]

export function Header() {
  return (
    <header className="border-b border-muted/30">
      <nav className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt="e-Staf"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full"
            priority
          />
          <span className="font-display text-xl text-primary">e-Staf</span>
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
