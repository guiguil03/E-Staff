import Link from 'next/link'
import { LanguageRibbon } from '@/components/LanguageRibbon'

export function Footer() {
  return (
    <footer className="border-t border-muted/30 mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <LanguageRibbon variant="static" />
        <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  )
}
