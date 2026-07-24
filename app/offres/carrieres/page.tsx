import { LanguageRibbon } from '@/components/LanguageRibbon'
import { Button } from '@/components/ui/Button'

export default function CarrieresPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <LanguageRibbon variant="static" />
      <h1 className="text-3xl mt-6 mb-4">Candidater chez e-Staf</h1>
      <p className="mb-6">
        On recrute des agents formés pour des clients internationaux. La sélection se fait
        sur le niveau de langue réel, pas sur le diplôme affiché. Si tu es déjà à l&apos;aise à
        l&apos;oral, ou prêt à te former, dépose ta candidature.
      </p>
      <p className="mb-6 border-l-4 border-accent bg-background p-4 font-mono text-xs leading-relaxed">
        L&apos;accès à nos missions et à nos grands comptes est réservé aux talents validant
        le niveau C1 après notre test de sélection — un niveau certifié par la réussite
        réelle des examens officiels, jamais auto-déclaré. Si tu n&apos;y es pas encore,
        l&apos;académie te fait monter jusque-là.
      </p>
      <p className="mb-8 text-sm text-muted">
        Le test de sélection en ligne ouvre bientôt directement sur ce site. En attendant,
        contacte-nous pour passer le test et faire ton inscription.
      </p>
      <Button href="/contact" variant="accent">Passer le test &amp; rejoindre e-Staf</Button>
    </main>
  )
}
