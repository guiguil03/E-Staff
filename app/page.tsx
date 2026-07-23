import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { ContactForm } from '@/components/ContactForm'
import { ScrollProgressRail } from '@/components/ScrollProgressRail'
import { Reveal } from '@/components/Reveal'
import { HeroRibbon } from '@/components/HeroRibbon'
import { MarqueeBand } from '@/components/MarqueeBand'

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

// The 4 steps of the solution, staged as an alternating timeline in Acte B1.
const SOLUTION_STEPS = [
  {
    title: 'Sélection sur test de niveau réel',
    body: "Avant toute embauche, chaque candidat passe un test de niveau réel, pas une déclaration sur CV. On mesure la capacité à tenir une conversation orale de bout en bout, dans des conditions proches d'un appel client. Seuls les profils qui atteignent le niveau requis sont proposés en production.",
  },
  {
    title: 'Formation continue pendant la mission',
    body: "La formation ne s'arrête pas à l'embauche. Chaque agent en poste continue de progresser pendant sa mission, avec un suivi régulier de son niveau de langue et de sa performance sur les appels. L'objectif est de réduire le turnover en gardant les agents motivés et en progression, plutôt que de les laisser stagner.",
  },
  {
    title: 'Infrastructure sécurisée déjà en place',
    body: "Onduleurs, secours énergétique et connexion stable sont installés avant l'arrivée du premier agent, pas ajoutés après une première coupure. Le client n'a rien à financer ni à mettre en place de son côté sur ce point : l'infrastructure est déjà opérationnelle et supervisée en continu.",
  },
  {
    title: 'Le client branche juste ses outils métier',
    body: "Une fois les agents sélectionnés et l'infrastructure en place, le client connecte simplement son CRM et ses logiciels métier existants. Aucune migration technique n'est demandée côté client : on s'adapte aux outils déjà en place plutôt que d'imposer les nôtres.",
  },
] as const

// The 3 objections of Acte A1, staged as large staggered statements.
const PROBLEMS = [
  {
    title: 'Profils sous-qualifiés',
    body: "Beaucoup de candidats visés n'ont pas le niveau de langue réel pour tenir un appel de 20 minutes, même avec un CV qui dit le contraire. Le décalage n'apparaît souvent qu'au premier appel client, une fois le coût de recrutement déjà engagé.",
  },
  {
    title: 'Turnover massif',
    body: "Une partie des agents recrutés ailleurs part après un mois, souvent avant d'être rentable pour le client qui les a formés. Chaque départ oblige à retrouver, réembaucher et reformer un remplaçant, ce qui coûte du temps et de l'argent au client plutôt qu'à l'agence.",
  },
  {
    title: 'Infrastructure instable',
    body: "Coupures d'électricité et de connexion en pleine mission client : le premier frein cité contre l'outsourcing vers Madagascar. Un appel coupé en plein milieu, côté agent, retombe directement sur l'image du client final.",
  },
] as const

const FAQ = [
  {
    q: 'Que se passe-t-il si mon niveau est insuffisant pour la production ?',
    a: "Vous n'êtes pas refusé sans suite : vous êtes orienté vers l'académie pour renforcer votre niveau de langue. Une fois le niveau requis atteint, vous redevenez éligible à un placement en production.",
  },
  {
    q: 'Quels outils dois-je fournir en tant que client ?',
    a: "Uniquement vos outils et logiciels métier (CRM, scripts, procédures internes). L'infrastructure — onduleurs, secours énergétique, connexion stable — est déjà fournie et opérationnelle, sans rien à financer ni à mettre en place de votre côté.",
  },
  {
    q: "Comment fonctionne la commission apporteur d'affaires ?",
    a: 'Vous touchez une commission mensuelle récurrente tant que le profil que vous avez apporté reste en poste, ou que le contrat client que vous avez apporté court.',
  },
  {
    q: "Quels examens sont préparés à l'académie ?",
    a: "DELF/DALF, TEF Canada, EAF et DFP, ainsi que le programme FOL pour les professionnels et leaders qui parlent déjà bien mais veulent plus d'impact à l'oral.",
  },
] as const

/** Grainy noise overlay for the dark hero (inline feTurbulence data-URI). */
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Huge watermark level letters positioned behind each act's content. */
function ActWatermark({
  level,
  tone = 'light',
  side = 'right',
}: {
  level: string
  tone?: 'light' | 'dark'
  side?: 'left' | 'right'
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-2 select-none font-mono font-medium leading-none text-[8rem] md:text-[14rem] ${
        side === 'right' ? 'right-0 md:right-4' : 'left-0 md:left-4'
      } ${tone === 'dark' ? 'text-background/5' : 'text-primary/5'}`}
    >
      {level}
    </span>
  )
}

/** Mono act kicker: "Acte 01 · Niveau A1 — Le problème". */
function ActKicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
      {children}
    </p>
  )
}

/** A ledger row: an oversized, muted mono index number beside a heading + body.
 * Kept from the previous pass for plain, non-clickable informational content.
 * Stack rows inside a `divide-y divide-muted/30` container. */
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
 * wrapped in a Link with a trailing arrow affordance and a hover tint/left-accent. */
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

/** A small honest-claim chip: mono uppercase label + punchy display value. */
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

      {/* ============================================================ */}
      {/* HERO — full-viewport, dark, cinematic entrance               */}
      {/* ============================================================ */}
      <section id="hero" className="relative overflow-hidden bg-primary">
        {/* Grain + drifting blobs, all decorative */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: GRAIN_URI }}
        />
        <div
          aria-hidden="true"
          className="blob-drift-1 pointer-events-none absolute -top-24 right-[10%] h-72 w-72 rounded-full bg-accent/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="blob-drift-2 pointer-events-none absolute bottom-[15%] -left-20 h-80 w-80 rounded-full bg-success/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="blob-drift-3 pointer-events-none absolute top-[40%] right-[-5%] h-56 w-56 rounded-full bg-background/10 blur-3xl"
        />

        <div className="relative mx-auto flex min-h-[max(560px,calc(100svh-4rem))] max-w-6xl flex-col justify-center px-4 pb-32 pt-14 md:pt-16">
          <p
            className="hero-rise font-mono text-xs uppercase tracking-widest text-background/60"
            style={{ '--d': '0ms' } as CSSProperties}
          >
            Académie de langues et agence de staffing B2B — Madagascar
          </p>

          <h1 className="mt-6 font-display tracking-tight text-background">
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span
                className="hero-line-inner block text-3xl leading-[1.1] sm:text-4xl md:text-6xl md:leading-[1.05]"
                style={{ '--d': '150ms' } as CSSProperties}
              >
                Des agents de centre d&apos;appel
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span
                className="hero-line-inner block text-5xl leading-[1.05] sm:text-6xl md:text-8xl md:leading-none"
                style={{ '--d': '300ms' } as CSSProperties}
              >
                formés en <em className="italic text-accent">langues</em>,
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span
                className="hero-line-inner block text-3xl leading-[1.1] sm:text-4xl md:text-6xl md:leading-[1.05]"
                style={{ '--d': '450ms' } as CSSProperties}
              >
                prêts avant leur premier appel client.
              </span>
            </span>
          </h1>

          <p
            className="hero-rise mt-6 max-w-xl text-background/70"
            style={{ '--d': '650ms' } as CSSProperties}
          >
            On forme des candidats en langues à l&apos;académie et on place les agents
            qualifiés chez des clients internationaux, avec une infrastructure sécurisée
            déjà en place.
          </p>

          <div
            className="hero-rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
            style={{ '--d': '800ms' } as CSSProperties}
          >
            <Button href="/offres/carrieres" variant="accent">
              Déposer ma candidature
            </Button>
            <Link href="#apporteurs-clients" className="group font-medium text-background">
              <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-background after:content-[''] group-hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline">
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

          <div className="mt-10 max-w-3xl md:mt-14">
            <HeroRibbon />
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
          <p className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-background/50">
            Faites défiler — le parcours commence à A1
          </p>
          <span className="scroll-cue-line block h-10 w-px bg-accent/80" aria-hidden="true" />
        </div>
      </section>

      {/* Marquee band 1 — the exams the académie prepares */}
      <MarqueeBand
        items={['DELF / DALF', 'TEF Canada', 'EAF', 'DFP', 'Programme FOL']}
        variant="accent"
      />

      {/* ============================================================ */}
      {/* ACTE 01 · A1 — Le problème                                   */}
      {/* ============================================================ */}
      <section id="probleme" className="relative overflow-hidden bg-white">
        <ActWatermark level="A1" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Acte 01 · Niveau A1 — Le point de départ</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">Le problème</h2>
            <p className="mb-6 max-w-2xl text-muted">
              Ce sont, dans cet ordre, les trois raisons qui font hésiter une entreprise à
              confier son service client à un centre d&apos;appel basé en Afrique.
            </p>
          </Reveal>
          <div className="mt-6 flex flex-col">
            {PROBLEMS.map((problem, i) => (
              <Reveal key={problem.title} delay={i * 100}>
                <div className="grid items-start gap-3 border-t border-muted/30 py-10 md:grid-cols-[5fr_7fr] md:gap-10 md:py-14">
                  <div className="flex items-baseline gap-4 md:block">
                    <span
                      aria-hidden="true"
                      className="font-mono text-sm text-accent md:mb-3 md:block"
                    >
                      0{i + 1}
                    </span>
                    <h3 className="text-2xl leading-tight md:text-4xl">{problem.title}</h3>
                  </div>
                  <p className="text-muted md:text-lg md:leading-relaxed">{problem.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ACTE 02 · B1 — La solution (alternating center timeline)     */}
      {/* ============================================================ */}
      <section id="solution" className="relative overflow-hidden bg-background">
        <ActWatermark level="B1" side="left" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Acte 02 · Niveau B1 — La montée</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">La solution</h2>
          </Reveal>
          <div className="relative mt-10">
            {/* Central spine of the timeline */}
            <span
              aria-hidden="true"
              className="absolute bottom-4 left-4 top-4 w-px bg-primary/20 md:left-1/2 md:-translate-x-1/2"
            />
            {SOLUTION_STEPS.map((step, i) => {
              const fromLeft = i % 2 === 0
              return (
                <div key={step.title} className="relative py-6 md:py-8">
                  <span
                    aria-hidden="true"
                    className="absolute left-4 top-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-accent md:left-1/2 md:top-12"
                  />
                  <Reveal from={fromLeft ? 'left' : 'right'}>
                    <div
                      className={`pl-10 md:pl-0 ${
                        fromLeft
                          ? 'md:pr-[calc(50%+2.5rem)] md:text-right'
                          : 'md:pl-[calc(50%+2.5rem)]'
                      }`}
                    >
                      <p className="mb-2 font-mono text-sm text-accent">Étape 0{i + 1}</p>
                      <h3 className="mb-2 text-xl md:text-2xl">{step.title}</h3>
                      <p className="text-sm text-muted md:text-base">{step.body}</p>
                    </div>
                  </Reveal>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ACTE 03 · B2 — Le double moteur (dark, diagonal seams)       */}
      {/* ============================================================ */}
      <section
        id="double-moteur"
        className="relative overflow-hidden bg-primary"
        style={{
          clipPath: 'polygon(0 56px, 100% 0, 100% 100%, 0 calc(100% - 56px))',
        }}
      >
        <ActWatermark level="B2" tone="dark" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 py-28 md:py-36">
          <Reveal>
            <ActKicker>Acte 03 · Niveau B2 — Le mécanisme</ActKicker>
            <h2 className="mb-10 text-3xl text-background md:text-5xl">Le double moteur</h2>
          </Reveal>
          <div className="mb-14 grid gap-10 md:grid-cols-2">
            <Reveal from="left">
              <div>
                <h3 className="mb-4 font-display text-2xl text-background md:text-3xl">
                  Académie
                </h3>
                <ul className="flex flex-col gap-3 text-sm text-background/80">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>
                      Préparation aux examens internationaux (DELF/DALF, TEF Canada, EAF, DFP)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Programme FOL pour professionnels et leaders</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Les apprenants paient directement leur formation</span>
                  </li>
                </ul>
              </div>
            </Reveal>
            <Reveal from="right">
              <div>
                <h3 className="mb-4 font-display text-2xl text-background md:text-3xl">
                  Production B2B
                </h3>
                <ul className="flex flex-col gap-3 text-sm text-background/80">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Agents placés par lots de dix chez des clients internationaux</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>
                      Infrastructure sécurisée fournie (onduleurs, secours, connexion stable)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Supervision continue une fois en poste</span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
          <Reveal>
            <div className="relative border-l-4 border-success py-1 pl-6 md:pl-8">
              {/* One-time accent glow when the band reveals */}
              <span
                aria-hidden="true"
                className="glow-once pointer-events-none absolute -inset-4 rounded bg-accent/20 opacity-0 blur-xl"
              />
              <div className="relative">
                <p className="mb-2 font-mono text-xs uppercase tracking-wide text-background/70">
                  Aucun candidat n&apos;est perdu
                </p>
                <p className="max-w-2xl font-display text-base text-background/90 md:text-lg">
                  Un candidat qui n&apos;atteint pas encore le niveau requis pour un placement
                  en production n&apos;est pas refusé sans suite : il est orienté vers une
                  formation à l&apos;académie pour élever son niveau. Une fois le niveau requis
                  atteint, il redevient éligible à un placement en production, dans la mesure
                  où cette orientation reste pertinente pour son profil.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ACTE 04 · C1 — La preuve                                     */}
      {/* ============================================================ */}
      <section id="confiance" className="relative overflow-hidden bg-white">
        <ActWatermark level="C1" side="left" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Acte 04 · Niveau C1 — La preuve</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">Preuve de sérieux</h2>
            <p className="mb-10 max-w-2xl text-muted">
              Chaque poste en production est supervisé et mesuré au quotidien avec une
              méthode fixe, appliquée sur des critères écrits à l&apos;avance plutôt
              qu&apos;un suivi ponctuel :
            </p>
          </Reveal>

          <div className="mb-14 grid gap-10 md:grid-cols-[7fr_5fr] md:gap-14">
            <div className="flex flex-col divide-y divide-muted/30">
              {(
                [
                  ['01', 'Constat', 'Mesure quotidienne des indicateurs de performance de chaque agent en poste.'],
                  ['02', 'Analyse', 'Identification des causes précises derrière chaque écart constaté.'],
                  ['03', 'Amélioration', "Ajustement ciblé de la formation ou du process pour corriger l'écart."],
                ] as const
              ).map(([index, title, body], i) => (
                <Reveal key={index} delay={i * 100}>
                  <LedgerRow index={index} title={title}>
                    <p>{body}</p>
                  </LedgerRow>
                </Reveal>
              ))}
            </div>

            {/* Fara's verified-journey certificate (moved out of the hero) */}
            <Reveal from="right">
              <div className="relative rotate-0 rounded bg-primary p-6 md:-rotate-1 md:p-8">
                <div
                  className="absolute right-4 top-4 flex h-12 w-12 rotate-6 items-center justify-center rounded-full border-2 border-success bg-background/10 md:right-5 md:top-5 md:h-14 md:w-14"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 text-success md:h-7 md:w-7"
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
                  <p className="mt-1 font-display text-xl text-background">Fara</p>
                </div>
                <div className="mt-8">
                  <p className="mb-1 font-mono text-xs uppercase tracking-wide text-background/60">
                    Niveau atteint
                  </p>
                  <p className="mb-4 font-display text-3xl text-accent md:text-4xl">B2</p>
                  <LanguageRibbon variant="static" reachedLevel="B2" />
                </div>
                <div className="my-6 border-t border-dashed border-background/30" />
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
                    <p className="text-sm text-background/90">
                      En poste — support client international
                    </p>
                  </div>
                  <p className="font-mono text-xs text-background/50">
                    17 jours de formation intensive avant le premier poste
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <QuoteBlock
                  quote="Je ne pensais pas tenir une conversation de 20 minutes sans bloquer."
                  person={{ firstname: 'Fara' }}
                  result="poste de support client international"
                />
              </div>
            </Reveal>
          </div>

          <Reveal>
            <div className="mb-14 grid grid-cols-2 divide-x divide-y divide-muted/30 border-y border-muted/30 md:grid-cols-4 md:divide-y-0">
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
          </Reveal>

          <h3 className="mb-2 text-xl">Avis</h3>
          <div className="flex flex-col">
            {TESTIMONIALS.map((t, i) => {
              const fromLeft = i % 2 === 0
              return (
                <Reveal key={t.firstname} from={fromLeft ? 'left' : 'right'}>
                  <figure
                    className={`max-w-2xl py-8 md:py-10 ${
                      fromLeft ? '' : 'md:ml-auto md:text-right'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="block select-none font-display text-6xl leading-none text-accent/30 md:text-8xl"
                    >
                      &ldquo;
                    </span>
                    <blockquote className="-mt-4 font-display text-xl leading-snug md:-mt-6 md:text-3xl">
                      {t.quote}
                    </blockquote>
                    <figcaption className="mt-3 font-mono text-sm text-muted">
                      <span className="font-medium text-ink">{t.firstname}</span> — {t.result}
                    </figcaption>
                  </figure>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Marquee band 2 — the method, dark with outlined type */}
      <MarqueeBand
        items={[
          "Aucun candidat n'est perdu",
          'Sélection sur test réel',
          'Formation continue',
          'Supervision quotidienne',
          'Infrastructure sécurisée',
        ]}
        variant="dark"
        duration={44}
      />

      {/* ============================================================ */}
      {/* Suite de l'acte C1 — apporteurs, offres, FAQ, parcours       */}
      {/* ============================================================ */}
      <section id="apporteurs-clients" className="relative overflow-hidden bg-background">
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Travailler avec nous</ActKicker>
            <h2 className="mb-8 text-3xl md:text-5xl">
              Apporteurs d&apos;affaires et entreprises
            </h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-2">
            <Reveal from="left">
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="mb-2 text-xl">Devenir apporteur d&apos;affaires</h3>
                  <p className="mb-3 text-sm text-muted">
                    Concrètement, voici comment ça fonctionne :
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-muted">
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>
                        Tu mets en relation un client potentiel avec nous, ou tu apportes un
                        CV qualifié.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>
                        On qualifie le client ou le candidat, puis on procède au placement.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>
                        Tu touches une commission mensuelle récurrente tant que le profil
                        reste en poste ou que le contrat client court.
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xl">Vous êtes une entreprise</h3>
                  <p className="mb-3 text-sm text-muted">Ce que vous obtenez :</p>
                  <ul className="flex flex-col gap-2 text-sm text-muted">
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Des agents sélectionnés sur leur niveau réel, pas déclaré.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Une infrastructure fournie et déjà opérationnelle.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Une supervision quotidienne des agents en poste.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Aucune gestion RH à assurer de votre côté.</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-sm text-muted">
                    Le seul élément que vous fournissez : vos outils et logiciels métier
                    (CRM, scripts, procédures internes).
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal from="right" delay={100}>
              <div>
                <h3 className="mb-2 text-xl">Nous contacter</h3>
                <p className="mb-4 font-mono text-xs uppercase tracking-wide text-muted">
                  Formulaire de contact
                </p>
                <div className="border border-muted/30 bg-white p-6">
                  <ContactForm defaultSubject="Devenir apporteur d'affaires" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="offres" className="relative overflow-hidden bg-white">
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Trois points d&apos;entrée</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">Offres phares</h2>
            <p className="mb-8 max-w-2xl text-muted">
              Trois points d&apos;entrée selon où vous en êtes : préparer un examen précis,
              gagner en aisance à l&apos;oral pour votre poste, ou trouver un emploi en
              production.
            </p>
          </Reveal>
          <div className="flex flex-col divide-y divide-muted/30">
            {(
              [
                {
                  href: '/offres/examens',
                  index: '01',
                  title: 'Préparation aux examens internationaux',
                  description:
                    'DELF/DALF, TEF Canada, EAF, DFP — préparation ciblée par niveau, du A2 au C1, en groupes restreints avec tests blancs chronométrés.',
                  cta: 'Voir la préparation aux examens',
                },
                {
                  href: '/offres/fol',
                  index: '02',
                  title: 'Programme FOL',
                  description:
                    "Français oratoire pour professionnels et leaders qui parlent déjà bien mais ont besoin de plus d'impact à l'oral, en réunion ou face à un public.",
                  cta: 'Voir le programme FOL',
                },
                {
                  href: '/offres/carrieres',
                  index: '03',
                  title: 'Vous cherchez du travail ?',
                  description:
                    'Déposez votre CV et vos coordonnées, puis passez une évaluation en ligne : on vous recontacte avec la suite adaptée à votre niveau.',
                  cta: 'Déposer ma candidature',
                },
              ] as const
            ).map((offre, i) => (
              <Reveal key={offre.href} delay={i * 100}>
                <OffreRow {...offre} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="relative overflow-hidden bg-background">
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Avant de vous lancer</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">Questions fréquentes</h2>
            <p className="mb-8 max-w-2xl text-muted">
              Les questions qui reviennent le plus souvent, côté candidats, entreprises et
              apporteurs d&apos;affaires.
            </p>
          </Reveal>
          <div className="flex max-w-2xl flex-col gap-8">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={(i % 2) * 100}>
                <div>
                  <h3 className="mb-2 text-xl">
                    <span className="mr-2 font-mono text-sm text-accent">Q0{i + 1}</span>
                    {item.q}
                  </h3>
                  <p className="text-sm text-muted">{item.a}</p>
                </div>
              </Reveal>
            ))}
            <Reveal>
              <div>
                <h3 className="mb-2 text-xl">
                  <span className="mr-2 font-mono text-sm text-accent">Q05</span>
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
            </Reveal>
          </div>
        </div>
      </section>

      <section id="parcours" className="relative overflow-hidden bg-white">
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <ActKicker>Votre ascension commence ici</ActKicker>
            <h2 className="mb-8 text-3xl md:text-5xl">Parcours candidat</h2>
          </Reveal>
          <div className="mb-8 flex flex-col divide-y divide-muted/30">
            {(
              [
                [
                  '01',
                  'Dépôt du CV, des coordonnées et d’une vidéo',
                  'Vous déposez votre CV, vos coordonnées et un lien vidéo de présentation (Loom, YouTube non répertorié ou Google Drive). Cette première étape ne prend que quelques minutes.',
                ],
                [
                  '02',
                  'Évaluation : vidéo + test de grammaire en ligne',
                  'Un formateur visionne votre vidéo et l’évalue sur une grille de critères précise. En parallèle, vous passez un test de grammaire en ligne. Les deux ensemble mesurent votre niveau réel.',
                ],
                [
                  '03',
                  'Orientation selon le niveau',
                  'Entre B1 et B2, vous êtes orienté vers les offres de formation pour élever votre niveau — aucun candidat motivé n’est laissé sans option. À partir de C1, vous accédez aux cinq types de métiers recherchés par nos clients, puis à la formation intensive de 17 jours avant la prise de poste.',
                ],
              ] as const
            ).map(([index, title, body], i) => (
              <Reveal key={index} delay={i * 100}>
                <LedgerRow index={index} title={title}>
                  <p>{body}</p>
                </LedgerRow>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <Button href="/offres/carrieres" variant="accent">
              Déposer ma candidature
            </Button>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
