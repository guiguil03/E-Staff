import { Button } from '@/components/ui/Button'

export default function FolPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">Programme FOL — Français Oratoire des Leaders</h1>
      <p className="mb-6">
        Un programme pour les professionnels qui doivent convaincre en français : prise de
        parole en public, argumentation face à des objections, gestion des questions
        difficiles en réunion ou en conférence.
      </p>
      <h2 className="text-xl mb-2">Pour qui</h2>
      <p className="mb-6">
        Cadres, responsables d&apos;équipe, porteurs de projet — déjà à l&apos;aise à l&apos;oral, qui
        veulent gagner en impact plutôt qu&apos;en vocabulaire.
      </p>
      <h2 className="text-xl mb-2">Format</h2>
      <p className="mb-6">
        Douze semaines, un groupe restreint par session, mises en situation filmées et
        débriefées individuellement.
      </p>
      <Button href="/contact" variant="accent">Demander un entretien d&apos;admission</Button>
    </main>
  )
}
