import Link from 'next/link'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { ContactForm } from '@/components/ContactForm'
import { ScrollProgressRail } from '@/components/ScrollProgressRail'

const TESTIMONIALS = [
  {
    quote: 'Le rythme est soutenu, mais on sait exactement où on en est chaque semaine.',
    firstname: 'Iavo',
    result: 'agent en production, client international',
  },
  {
    quote:
      "J'ai raté le niveau pour la production, on m'a proposé l'académie au lieu de me dire non.",
    firstname: 'Tovo',
    result: 'apprenant, préparation DELF B1',
  },
  {
    quote:
      "La coupure de courant, c'est le premier truc que j'ai vérifié avant de signer. Ça n'a jamais lâché.",
    firstname: 'Marc',
    result: "client, centre d'appel partenaire",
  },
  {
    quote: 'On nous a apporté un profil qualifié en dix jours, formé et prêt à prendre des appels.',
    firstname: 'Nathalie',
    result: "apporteuse d'affaires",
  },
] as const

/** A ledger row: an oversized, muted mono index number beside a heading + body.
 * Replaces the old "heading + 3 bordered cards" pattern for plain, non-clickable
 * informational content. Stack rows inside a `divide-y divide-muted/30` container. */
function LedgerRow({
  index,
  title,
  children,
}: {
  index: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-5 md:gap-10 items-start py-6 md:py-8">
      <span
        aria-hidden="true"
        className="font-mono text-4xl md:text-7xl leading-none shrink-0 w-14 md:w-24 text-primary/15"
      >
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg md:text-xl mb-2">{title}</h3>
        <div className="text-sm text-muted">{children}</div>
      </div>
    </div>
  )
}

/** The clickable counterpart to LedgerRow: same oversized index number, but
 * wrapped in a Link with a trailing arrow affordance and a hover tint/left-accent
 * instead of the old shadow-lift card treatment. */
function OffreRow({
  href,
  index,
  title,
  description,
  cta,
}: {
  href: string
  index: string
  title: string
  description: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group flex gap-5 md:gap-10 items-start py-6 md:py-8 -mx-4 px-4 md:-mx-6 md:px-6 border-l-2 border-transparent hover:border-l-accent hover:bg-background/70 motion-safe:transition-colors motion-safe:duration-200"
    >
      <span
        aria-hidden="true"
        className="font-mono text-4xl md:text-7xl leading-none shrink-0 w-14 md:w-24 text-primary/15"
      >
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg md:text-xl mb-2">{title}</h3>
        <p className="text-sm text-muted mb-3">{description}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {cta}
          <span
            aria-hidden="true"
            className="motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  )
}

/** A small honest-claim chip: mono uppercase label + punchy display value.
 * Used in place of "[X]" bracket placeholders for stats that aren't tracked yet. */
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono uppercase text-[10px] md:text-xs tracking-wide text-muted mb-1">
        {label}
      </p>
      <p className="font-display text-lg md:text-xl text-ink">{value}</p>
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      <ScrollProgressRail />

      <section id="hero" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-[7fr_5fr] items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted mb-2">
              Fiche N°01 — Programme actif
            </p>
            <p className="font-mono text-xs uppercase tracking-wide text-muted mb-3">
              Académie de langues et agence de staffing B2B — Madagascar
            </p>
            <LanguageRibbon variant="animated" reachedLevel="B2" />
            <h1 className="text-4xl md:text-6xl leading-[1.05] tracking-tight mt-6 mb-4">
              Des agents de centre d&apos;appel formés en langues, prêts avant leur premier
              appel client.
            </h1>
            <p className="mb-6 text-muted max-w-xl">
              On forme des candidats en langues à l&apos;académie et on place les agents
              qualifiés chez des clients internationaux, avec une infrastructure sécurisée
              déjà en place.
            </p>
            <QuoteBlock
              quote="Je ne pensais pas tenir une conversation de 20 minutes sans bloquer."
              person={{ firstname: 'Fara' }}
              result="poste de support client international"
            />
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <Button href="/offres/carrieres" variant="accent">
                Déposer ma candidature
              </Button>
              <Link
                href="#apporteurs-clients"
                className="group text-primary font-medium"
              >
                <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:content-[''] group-hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline">
                  Je suis une entreprise ou un apporteur d&apos;affaires
                </span>{' '}
                <span
                  aria-hidden="true"
                  className="inline-block motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-x-10 gap-y-4">
              <StatChip label="Sélection" value="Test de niveau réel" />
              <StatChip label="Infrastructure" value="Sécurisée 24/7" />
              <StatChip label="Suivi" value="Supervision quotidienne" />
            </div>
          </div>
          <div className="relative -m-3 p-3 md:-m-6 md:p-6 md:-ml-8 overflow-hidden rotate-0 md:-rotate-1">
            <div
              aria-hidden="true"
              className="absolute -z-10 -top-10 -right-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-accent/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -z-10 -bottom-12 -left-12 w-48 h-48 md:w-64 md:h-64 rounded-full bg-success/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -z-10 top-1/3 -right-8 w-28 h-28 rounded-full bg-primary/10 blur-2xl"
            />

            <div className="relative rounded bg-primary p-6 md:p-8 flex flex-col justify-center md:min-h-[420px]">
              <div
                className="absolute top-4 right-4 md:top-5 md:right-5 rotate-6 w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-success bg-background/10 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 md:w-7 md:h-7 text-success"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="pr-14 md:pr-16">
                <p className="font-mono text-xs uppercase tracking-wide text-background/60">
                  Parcours vérifié
                </p>
                <p className="font-display text-xl text-background mt-1">Fara</p>
              </div>

              <div className="mt-8">
                <p className="font-mono text-xs uppercase tracking-wide text-background/60 mb-1">
                  Niveau atteint
                </p>
                <p className="font-display text-3xl md:text-4xl text-accent mb-4">B2</p>
                <LanguageRibbon variant="static" reachedLevel="B2" />
              </div>

              <div className="border-t border-dashed border-background/30 my-6" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-success shrink-0" aria-hidden="true" />
                  <p className="text-background/90 text-sm">
                    En poste — support client international
                  </p>
                </div>
                <p className="font-mono text-xs text-background/50">
                  17 jours de formation intensive avant le premier poste
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="probleme" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-4">Le problème</h2>
          <p className="mb-8 text-muted max-w-2xl">
            Ce sont, dans cet ordre, les trois raisons qui font hésiter une entreprise à
            confier son service client à un centre d&apos;appel basé en Afrique.
          </p>
          <div className="flex flex-col divide-y divide-muted/30">
            <LedgerRow index="01" title="Profils sous-qualifiés">
              <p>
                Beaucoup de candidats visés n&apos;ont pas le niveau de langue réel pour
                tenir un appel de 20 minutes, même avec un CV qui dit le contraire. Le
                décalage n&apos;apparaît souvent qu&apos;au premier appel client, une fois le
                coût de recrutement déjà engagé.
              </p>
            </LedgerRow>
            <LedgerRow index="02" title="Turnover massif">
              <p>
                Une partie des agents recrutés ailleurs part après un mois, souvent avant
                d&apos;être rentable pour le client qui les a formés. Chaque départ oblige à
                retrouver, réembaucher et reformer un remplaçant, ce qui coûte du temps et
                de l&apos;argent au client plutôt qu&apos;à l&apos;agence.
              </p>
            </LedgerRow>
            <LedgerRow index="03" title="Infrastructure instable">
              <p>
                Coupures d&apos;électricité et de connexion en pleine mission client : le
                premier frein cité contre l&apos;outsourcing vers Madagascar. Un appel coupé
                en plein milieu, côté agent, retombe directement sur l&apos;image du client
                final.
              </p>
            </LedgerRow>
          </div>
        </div>
      </section>

      <section id="solution" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-8">La solution</h2>
          <div className="flex flex-col divide-y divide-muted/30">
            <LedgerRow index="01" title="Sélection sur test de niveau réel">
              <p>
                Avant toute embauche, chaque candidat passe un test de niveau réel, pas
                une déclaration sur CV. On mesure la capacité à tenir une conversation
                orale de bout en bout, dans des conditions proches d&apos;un appel client.
                Seuls les profils qui atteignent le niveau requis sont proposés en
                production.
              </p>
            </LedgerRow>
            <LedgerRow index="02" title="Formation continue pendant la mission">
              <p>
                La formation ne s&apos;arrête pas à l&apos;embauche. Chaque agent en poste
                continue de progresser pendant sa mission, avec un suivi régulier de son
                niveau de langue et de sa performance sur les appels. L&apos;objectif est
                de réduire le turnover en gardant les agents motivés et en progression,
                plutôt que de les laisser stagner.
              </p>
            </LedgerRow>
            <LedgerRow index="03" title="Infrastructure sécurisée déjà en place">
              <p>
                Onduleurs, secours énergétique et connexion stable sont installés avant
                l&apos;arrivée du premier agent, pas ajoutés après une première coupure. Le
                client n&apos;a rien à financer ni à mettre en place de son côté sur ce
                point : l&apos;infrastructure est déjà opérationnelle et supervisée en
                continu.
              </p>
            </LedgerRow>
            <LedgerRow index="04" title="Le client branche juste ses outils métier">
              <p>
                Une fois les agents sélectionnés et l&apos;infrastructure en place, le
                client connecte simplement son CRM et ses logiciels métier existants.
                Aucune migration technique n&apos;est demandée côté client : on
                s&apos;adapte aux outils déjà en place plutôt que d&apos;imposer les nôtres.
              </p>
            </LedgerRow>
          </div>
        </div>
      </section>

      <section
        id="double-moteur"
        className="bg-primary"
        style={{
          clipPath:
            'polygon(0 32px, 100% 0, 100% calc(100% - 32px), 0 100%)',
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-20 md:py-28">
          <h2 className="text-2xl md:text-3xl mb-10 text-background">Le double moteur</h2>
          <div className="grid gap-10 md:grid-cols-2 mb-12">
            <div>
              <h3 className="font-display text-2xl md:text-3xl text-background mb-4">
                Académie
              </h3>
              <ul className="text-sm text-background/80 flex flex-col gap-3">
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>
                    Préparation aux examens internationaux (DELF/DALF, TEF Canada, EAF, DFP)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>Programme FOL pour professionnels et leaders</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>Les apprenants paient directement leur formation</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display text-2xl md:text-3xl text-background mb-4">
                Production B2B
              </h3>
              <ul className="text-sm text-background/80 flex flex-col gap-3">
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>Agents placés par lots de dix chez des clients internationaux</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>
                    Infrastructure sécurisée fournie (onduleurs, secours, connexion stable)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent shrink-0">→</span>
                  <span>Supervision continue une fois en poste</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-l-4 border-success pl-6 md:pl-8 py-1">
            <p className="font-mono text-xs uppercase tracking-wide text-background/70 mb-2">
              Aucun candidat n&apos;est perdu
            </p>
            <p className="text-base md:text-lg font-display text-background/90 max-w-2xl">
              Un candidat qui n&apos;atteint pas encore le niveau requis pour un placement
              en production n&apos;est pas refusé sans suite : il est orienté vers une
              formation à l&apos;académie pour élever son niveau. Une fois le niveau requis
              atteint, il redevient éligible à un placement en production, dans la mesure
              où cette orientation reste pertinente pour son profil.
            </p>
          </div>
        </div>
      </section>

      <section id="confiance" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-4">Preuve de sérieux</h2>
          <p className="mb-6 text-muted max-w-2xl">
            Chaque poste en production est supervisé et mesuré au quotidien avec une
            méthode fixe, appliquée sur des critères écrits à l&apos;avance plutôt qu&apos;un
            suivi ponctuel :
          </p>
          <div className="flex flex-col divide-y divide-muted/30 mb-10">
            <LedgerRow index="01" title="Constat">
              <p>Mesure quotidienne des indicateurs de performance de chaque agent en poste.</p>
            </LedgerRow>
            <LedgerRow index="02" title="Analyse">
              <p>Identification des causes précises derrière chaque écart constaté.</p>
            </LedgerRow>
            <LedgerRow index="03" title="Amélioration">
              <p>Ajustement ciblé de la formation ou du process pour corriger l&apos;écart.</p>
            </LedgerRow>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-y border-muted/30 divide-x divide-y divide-muted/30 md:divide-y-0 mb-10">
            <div className="p-4 md:p-6">
              <StatChip label="Sélection" value="Test de niveau réel" />
            </div>
            <div className="p-4 md:p-6">
              <StatChip label="Formation" value="Continue en poste" />
            </div>
            <div className="p-4 md:p-6">
              <StatChip label="Infrastructure" value="Sécurisée 24/7" />
            </div>
            <div className="p-4 md:p-6">
              <StatChip label="Suivi" value="Supervision quotidienne" />
            </div>
          </div>

          <h3 className="text-xl mb-2">Avis</h3>
          <div className="flex flex-col divide-y divide-muted/30">
            {TESTIMONIALS.map((t) => (
              <div key={t.firstname} className="relative py-8 md:py-10">
                <span
                  aria-hidden="true"
                  className="absolute -top-2 md:-top-4 left-0 font-display text-6xl md:text-8xl text-primary/10 select-none"
                >
                  &ldquo;
                </span>
                <div className="relative pl-10 md:pl-16">
                  <p className="text-lg font-display mb-3">{t.quote}</p>
                  <p className="font-mono text-sm text-muted">
                    <span className="text-ink font-medium">{t.firstname}</span> — {t.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apporteurs-clients" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-8">Apporteurs d&apos;affaires et entreprises</h2>
          <div className="grid gap-10 md:grid-cols-2">
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-xl mb-2">Devenir apporteur d&apos;affaires</h3>
                <p className="mb-3 text-sm text-muted">
                  Concrètement, voici comment ça fonctionne :
                </p>
                <ul className="text-sm text-muted flex flex-col gap-2">
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>
                      Tu mets en relation un client potentiel avec nous, ou tu apportes un
                      CV qualifié.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>On qualifie le client ou le candidat, puis on procède au placement.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>
                      Tu touches une commission mensuelle récurrente tant que le profil
                      reste en poste ou que le contrat client court.
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl mb-2">Vous êtes une entreprise</h3>
                <p className="mb-3 text-sm text-muted">Ce que vous obtenez :</p>
                <ul className="text-sm text-muted flex flex-col gap-2">
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>Des agents sélectionnés sur leur niveau réel, pas déclaré.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>Une infrastructure fournie et déjà opérationnelle.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>Une supervision quotidienne des agents en poste.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-success shrink-0">→</span>
                    <span>Aucune gestion RH à assurer de votre côté.</span>
                  </li>
                </ul>
                <p className="mt-3 text-sm text-muted">
                  Le seul élément que vous fournissez : vos outils et logiciels métier
                  (CRM, scripts, procédures internes).
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl mb-2">Nous contacter</h3>
              <p className="font-mono text-xs uppercase tracking-wide text-muted mb-4">
                Formulaire de contact
              </p>
              <div className="border border-muted/30 p-6">
                <ContactForm defaultSubject="Devenir apporteur d'affaires" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="offres" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-4">Offres phares</h2>
          <p className="mb-8 text-muted max-w-2xl">
            Trois points d&apos;entrée selon où vous en êtes : préparer un examen précis,
            gagner en aisance à l&apos;oral pour votre poste, ou trouver un emploi en
            production.
          </p>
          <div className="flex flex-col divide-y divide-muted/30">
            <OffreRow
              href="/offres/examens"
              index="01"
              title="Préparation aux examens internationaux"
              description="DELF/DALF, TEF Canada, EAF, DFP — préparation ciblée par niveau, du A2 au C1, en groupes restreints avec tests blancs chronométrés."
              cta="Voir la préparation aux examens"
            />
            <OffreRow
              href="/offres/fol"
              index="02"
              title="Programme FOL"
              description="Français oratoire pour professionnels et leaders qui parlent déjà bien mais ont besoin de plus d'impact à l'oral, en réunion ou face à un public."
              cta="Voir le programme FOL"
            />
            <OffreRow
              href="/offres/carrieres"
              index="03"
              title="Vous cherchez du travail ?"
              description="Déposez votre CV et vos coordonnées, puis passez une évaluation en ligne : on vous recontacte avec la suite adaptée à votre niveau."
              cta="Déposer ma candidature"
            />
          </div>
        </div>
      </section>

      <section id="faq" className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-4">Questions fréquentes</h2>
          <p className="mb-8 text-muted max-w-2xl">
            Les questions qui reviennent le plus souvent, côté candidats, entreprises et
            apporteurs d&apos;affaires.
          </p>
          <div className="flex flex-col gap-8 max-w-2xl">
            <div>
              <h3 className="text-xl mb-2">
                <span className="font-mono text-sm text-accent mr-2">Q01</span>
                Que se passe-t-il si mon niveau est insuffisant pour la production ?
              </h3>
              <p className="text-sm text-muted">
                Vous n&apos;êtes pas refusé sans suite : vous êtes orienté vers l&apos;académie
                pour renforcer votre niveau de langue. Une fois le niveau requis atteint,
                vous redevenez éligible à un placement en production.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-2">
                <span className="font-mono text-sm text-accent mr-2">Q02</span>
                Quels outils dois-je fournir en tant que client ?
              </h3>
              <p className="text-sm text-muted">
                Uniquement vos outils et logiciels métier (CRM, scripts, procédures
                internes). L&apos;infrastructure — onduleurs, secours énergétique, connexion
                stable — est déjà fournie et opérationnelle, sans rien à financer ni à
                mettre en place de votre côté.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-2">
                <span className="font-mono text-sm text-accent mr-2">Q03</span>
                Comment fonctionne la commission apporteur d&apos;affaires ?
              </h3>
              <p className="text-sm text-muted">
                Vous touchez une commission mensuelle récurrente tant que le profil que
                vous avez apporté reste en poste, ou que le contrat client que vous avez
                apporté court.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-2">
                <span className="font-mono text-sm text-accent mr-2">Q04</span>
                Quels examens sont préparés à l&apos;académie ?
              </h3>
              <p className="text-sm text-muted">
                DELF/DALF, TEF Canada, EAF et DFP, ainsi que le programme FOL pour les
                professionnels et leaders qui parlent déjà bien mais veulent plus
                d&apos;impact à l&apos;oral.
              </p>
            </div>
            <div>
              <h3 className="text-xl mb-2">
                <span className="font-mono text-sm text-accent mr-2">Q05</span>
                Combien de temps dure la formation avant un placement en production ?
              </h3>
              <p className="text-sm text-muted">
                Ça dépend du niveau de départ, mais ça peut aller vite : Fara, par
                exemple, a rejoint un poste de support client international après 17
                jours de formation intensive (
                <Link
                  href="/publications/decroche-poste-apres-17-jours"
                  className="relative text-ink after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-ink after:content-[''] hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline"
                >
                  son histoire
                </Link>
                ) — un exemple, pas une durée garantie pour tous les profils.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="parcours" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <h2 className="text-2xl md:text-3xl mb-8">Parcours candidat</h2>
          <div className="flex flex-col divide-y divide-muted/30 mb-8">
            <LedgerRow index="01" title="Dépôt du CV et des coordonnées">
              <p>
                Vous déposez votre CV et vos coordonnées via la page candidature. Cette
                première étape ne prend que quelques minutes.
              </p>
            </LedgerRow>
            <LedgerRow index="02" title="Passage d'un test d'évaluation en ligne">
              <p>
                Vous passez ensuite un test d&apos;évaluation en ligne qui mesure votre
                niveau réel, pour orienter la suite du parcours vers l&apos;option la plus
                adaptée.
              </p>
            </LedgerRow>
            <LedgerRow index="03" title="Orientation selon le niveau">
              <p>
                Si le niveau est suffisant, vous accédez directement aux postes en
                production. En dessous du niveau requis, vous êtes orienté vers un
                renforcement à l&apos;académie plutôt que laissé sans suite — l&apos;idée
                reste la même que partout ailleurs sur ce site : aucun candidat
                n&apos;est perdu.
              </p>
            </LedgerRow>
          </div>
          <Button href="/offres/carrieres" variant="accent">
            Déposer ma candidature
          </Button>
        </div>
      </section>
    </main>
  )
}
