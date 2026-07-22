import { LanguageRibbon } from '@/components/LanguageRibbon'
import { Button } from '@/components/ui/Button'

export default function CarrieresPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <LanguageRibbon variant="static" />
      <h1 className="text-3xl mt-6 mb-4">Vous cherchez du travail ?</h1>
      <p className="mb-6">
        On recrute des agents formés pour des clients internationaux. La sélection se fait
        sur le niveau de langue réel, pas sur le diplôme affiché. Si tu es déjà à l&apos;aise à
        l&apos;oral, ou prêt à te former, dépose ta candidature.
      </p>
      <p className="mb-8 text-sm text-muted">
        Le dépôt de candidature (CV, test de niveau) ouvre bientôt directement sur ce site.
        En attendant, contacte-nous.
      </p>
      <Button href="/contact" variant="accent">Déposer ma candidature</Button>
    </main>
  )
}
