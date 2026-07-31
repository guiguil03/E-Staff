import Image from 'next/image'
import Link from 'next/link'
import { LanguageRibbon } from '@/components/LanguageRibbon'

export function Footer() {
  return (
    <footer className="border-t border-muted/30 mt-16">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center gap-2.5">
          <Image
            src="/brand/logo.png"
            alt="e-Staf"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full"
          />
          <span className="font-display text-lg text-primary">e-Staf</span>
        </div>
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
