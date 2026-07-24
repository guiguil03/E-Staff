import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

/** Mono status badge — typographic stand-in for the client's emoji markers. */
function StatutBadge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded border border-success/40 bg-success/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-success">
      {children}
    </span>
  )
}

/** Mono cohort badge for the DFP sub-programs. */
function CohorteBadge({ children }: { children: string }) {
  return (
    <span className="inline-block rounded border border-primary/20 bg-primary/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-primary/80">
      {children}
    </span>
  )
}

const DFP = [
  {
    name: 'DFP Affaires',
    cibles: 'Commerciaux, managers, entrepreneurs, cadres.',
    mission:
      "Validez la capacité à négocier, rédiger des contrats, animer des réunions, gérer la relation client et piloter la stratégie d'une structure en français.",
    cohorte: 'Prochaine cohorte : 10 septembre 2026',
  },
  {
    name: 'DFP Relations Internationales',
    cibles: 'Diplomates, fonctionnaires internationaux, ONG, juristes.',
    mission:
      'Maîtrisez le langage diplomatique, la rédaction de notes de synthèse, les comptes-rendus officiels et la négociation bilatérale ou multilatérale.',
    cohorte: 'Prochaine cohorte : 1er octobre 2026',
  },
  {
    name: 'DFP Tourisme, Hôtellerie & Restauration',
    cibles: 'Professionnels du tourisme, managers d’hôtels, restaurateurs.',
    mission:
      'Gérez la clientèle exigeante, résolvez les litiges, commercialisez des prestations touristiques et pilotez l’accueil avec un raffinement irréprochable.',
    cohorte: 'Prochaine cohorte : 15 septembre 2026',
  },
  {
    name: 'DFP Santé',
    cibles: 'Médecins, infirmiers, chercheurs, personnel de santé.',
    mission:
      'Maîtrisez le lexique médical, rédigez des dossiers patients, communiquez avec les confrères et interagissez avec rigueur auprès des patients.',
    cohorte: 'Prochaine cohorte : 1er octobre 2026',
  },
] as const

export default function ExamensPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
        Catalogue des programmes
      </p>
      <h1 className="text-3xl mb-4">Se préparer aux examens officiels</h1>
      <p className="mb-4">
        Ces préparations s&apos;adressent à celles et ceux qui poursuivent leurs propres
        objectifs — immigration, carrière, diplôme. Pas besoin de vouloir devenir agent
        chez e-Staf pour s&apos;inscrire : la montée en compétences de nos candidats vers
        la production est un parcours distinct.
      </p>
      <p className="mb-10 text-sm text-muted">
        C&apos;est d&apos;ailleurs sur ces mêmes examens que repose notre exigence : les
        candidats e-Staf destinés à la production passent réellement les épreuves
        officielles pour certifier leur niveau C1 — jamais auto-déclaré.
      </p>

      {/* ------------------------------------------------------------ */}
      <section className="mb-12 border-t border-muted/30 pt-8">
        <h2 className="text-xl mb-2">DELF / DALF</h2>
        <div className="mb-3 flex gap-2">
          <Badge>B1</Badge>
          <Badge>B2</Badge>
          <Badge>C1</Badge>
          <Badge>C2</Badge>
        </div>
        <p className="mb-4">
          Maîtrisez les codes, la structure des épreuves et l&apos;art de rédiger ou de
          plaider pour décrocher votre diplôme officiel de français.
        </p>
        <p className="mb-5">
          <StatutBadge>
            Préparations ouvertes — sessions en continu, passage des examens planifié
          </StatutBadge>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button href="/contact" variant="accent">
            S&apos;inscrire à la préparation DELF/DALF
          </Button>
          <Button href="/contact" variant="ghost">
            Réserver mon évaluation initiale
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      <section className="mb-12 border-t border-muted/30 pt-8">
        <h2 className="text-xl mb-2">TEF Canada / TCF</h2>
        <p className="mb-4">
          Chaque point compte pour votre projet d&apos;immigration ou d&apos;expatriation.
          Un entraînement chirurgical aux épreuves chronométrées pour maximiser votre
          score (CLB 7, 8, 9+).
        </p>
        <p className="mb-5">
          <StatutBadge>Préparations ouvertes — boost spécial immigration</StatutBadge>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button href="/contact" variant="accent">
            Maximiser mon score TEF/TCF
          </Button>
          <Button href="/contact" variant="ghost">
            Réserver ma session d&apos;entraînement
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      <section id="dfp" className="mb-12 border-t border-muted/30 pt-8">
        <h2 className="text-xl mb-2">DFP — Diplômes de Français Professionnel</h2>
        <p className="mb-6">
          Ne dites plus simplement que vous parlez français : prouvez que vous dominez le
          jargon et les codes de votre secteur au niveau international. Inscriptions
          ouvertes pour les quatre spécialisations.
        </p>
        <div className="flex flex-col divide-y divide-muted/30 border-y border-muted/30">
          {DFP.map((programme) => (
            <div key={programme.name} className="py-5">
              <h3 className="text-lg mb-2">{programme.name}</h3>
              <p className="mb-1 text-sm text-muted">
                <span className="font-mono text-xs uppercase tracking-wide">Cibles :</span>{' '}
                {programme.cibles}
              </p>
              <p className="mb-3 text-sm text-muted">
                <span className="font-mono text-xs uppercase tracking-wide">Mission :</span>{' '}
                {programme.mission}
              </p>
              <CohorteBadge>{`${programme.cohorte} — inscriptions ouvertes`}</CohorteBadge>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button href="/contact" variant="accent">
            Rejoindre une cohorte DFP
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      <p className="mb-6 text-sm text-muted">
        Le programme phare FOL — Français Oratoire des Leaders, avec son Cursus
        d&apos;Élite de 6 mois, a{' '}
        <Link href="/offres/fol" className="text-primary underline">
          sa propre page
        </Link>
        .
      </p>
    </main>
  )
}
