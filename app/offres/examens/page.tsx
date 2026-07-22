import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default function ExamensPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl mb-4">Préparation aux examens internationaux</h1>
      <p className="mb-6">
        On prépare cinq examens de français qui ouvrent des portes concrètes : DELF/DALF,
        TEF Canada, EAF, DFP (Diplôme de Français Professionnel). Pas de bachotage
        générique — chaque groupe est construit autour du niveau réel des élèves.
      </p>
      <div className="flex gap-2 mb-8">
        <Badge>A2</Badge>
        <Badge>B1</Badge>
        <Badge>B2</Badge>
        <Badge>C1</Badge>
      </div>
      <h2 className="text-xl mb-2">Durée et rythme</h2>
      <p className="mb-6">
        Sessions intensives de 3 à 6 semaines selon le niveau de départ et l&apos;examen visé.
        Cours en présentiel, groupes de 8 élèves maximum, tests blancs chronométrés dès la
        deuxième semaine.
      </p>
      <p className="mb-6 text-sm text-muted">
        Le programme FOL, pour les professionnels, a{' '}
        <Link href="/offres/fol" className="text-primary underline">
          sa propre page
        </Link>
        .
      </p>
      <Button href="/contact" variant="accent">Demander les prochaines dates</Button>
    </main>
  )
}
