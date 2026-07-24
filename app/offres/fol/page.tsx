import { Button } from '@/components/ui/Button'

const PARCOURS = [
  {
    step: '01',
    title: 'Le Test d’Entrée',
    body: 'Un premier filtre sans concession.',
  },
  {
    step: '02',
    title: 'Le Camp de Présélection (6 semaines)',
    body: '15 candidats poussés dans leurs derniers retranchements : posture, non-verbal, art de convaincre.',
  },
  {
    step: '03',
    title: 'Le Verdict (Top 5)',
    body: 'Seulement 5 élus sur 15 décrochent leur place pour le grand cursus.',
  },
] as const

export default function FolPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
        Programme phare de l&apos;académie
      </p>
      <h1 className="text-3xl mb-4">Programme FOL — Français Oratoire des Leaders</h1>
      <p className="mb-8">
        Vous avez déjà perdu des contrats, non pas à cause de votre technique, mais de
        votre impact. Changez de dimension : devenez celui qu&apos;on écoute, qu&apos;on
        respecte et qu&apos;on suit.
      </p>

      <h2 className="text-xl mb-2">Le Cursus d&apos;Élite (6 mois)</h2>
      <p className="mb-8">
        Maîtrisez l&apos;art de négocier, brisez les objections, imposez votre cadre et
        développez une prestance inébranlable.
      </p>

      <h2 className="text-xl mb-4">Le Parcours du Combattant</h2>
      <ol className="mb-10 flex flex-col divide-y divide-muted/30 border-y border-muted/30">
        {PARCOURS.map((item) => (
          <li key={item.step} className="flex items-start gap-5 py-5">
            <span
              aria-hidden="true"
              className="font-mono text-3xl leading-none shrink-0 w-12 text-primary/15"
            >
              {item.step}
            </span>
            <div>
              <h3 className="text-lg mb-1">{item.title}</h3>
              <p className="text-sm text-muted">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button href="/contact" variant="accent">
          Passer le test d&apos;entrée
        </Button>
        <Button href="/contact" variant="ghost">
          S&apos;inscrire à la prochaine session
        </Button>
      </div>
    </main>
  )
}
