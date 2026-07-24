import Link from 'next/link'
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { ContactForm } from '@/components/ContactForm'
import { ScrollProgressRail } from '@/components/ScrollProgressRail'
import { Reveal } from '@/components/Reveal'
import { HeroRibbon } from '@/components/HeroRibbon'
import { HeroFX } from '@/components/HeroFX'
import { MarqueeBand } from '@/components/MarqueeBand'
import { SpotlightCard } from '@/components/SpotlightCard'
import {
  DoubleEngineSchema,
  EnvelopeSchema,
  FunnelSchema,
  GateSchema,
  MarkBars,
  MarkLayers,
  MarkLock,
  MarkPulse,
  MarkRefresh,
  MarkShield,
  NetworkSchema,
  RoughRing,
  RoughUnderline,
  SealSchema,
  StaircaseSchema,
} from '@/components/Schemas'

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

// The 4 steps of the method, staged as an alternating timeline in Acte B1.
const SOLUTION_STEPS = [
  {
    title: 'Sélection : test réel, puis examens officiels',
    body: "Avant toute mise en production, chaque candidat passe notre test de sélection, pas une déclaration sur CV. L'accès aux missions est réservé aux talents validant le niveau C1 — et ce niveau est certifié par le passage réel des examens officiels, jamais auto-déclaré. Seuls ces profils sont proposés en production.",
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

// The 6 partner-facing promises of Acte C1.
const PROMESSES = [
  [
    '01',
    'Des locaux équipés & sécurisés',
    "Une infrastructure professionnelle prête à l'emploi sur nos pôles pour garantir une continuité de service irréprochable, sans coupure ni risque technique.",
  ],
  [
    '02',
    'Un encadrement managérial rigoureux',
    "Un pilotage constant sur le terrain pour suivre les indicateurs, optimiser la cadence et s'assurer que chaque objectif de performance est atteint.",
  ],
  [
    '03',
    'Maîtrise des outils & CRM',
    'Intégration et maîtrise parfaite de vos logiciels et outils métiers pour une immersion immédiate dans vos écosystèmes.',
  ],
  [
    '04',
    'Transparence & confidentialité tarifaire',
    'Les grilles tarifaires et conditions financières ne sont pas étalées en vitrine. Elles sont communiquées et détaillées dans le contrat officiel, transmis exclusivement à vous.',
  ],
  [
    '05',
    'Pilotage & reporting hebdomadaire',
    "Point de contact direct d'une heure chaque semaine entre nos managers et vos équipes, appuyé par un reporting graphique et statistique complet : progression sur la prod, atteinte des objectifs, constats, analyses et axes d'amélioration.",
  ],
  [
    '06',
    'Zéro turnover / remplacement garanti',
    'Zéro compromis sur la stabilité. Nous garantissons une continuité absolue et, au pire, nous disposons des ressources et de la réactivité immédiate pour remplacer un profil sans impacter votre production.',
  ],
] as const

// Option 1 — the six "Squad Long Terme" lots of 10.
const LOTS = [
  {
    name: 'Lot de 10 « Setters »',
    mission:
      'Saturez vos agendas, brisez les barrières et qualifiez un maximum de prospects pour remplir votre pipeline commercial.',
    date: '15 août 2026',
  },
  {
    name: 'Lot de 10 « Closers »',
    mission:
      'Maîtrisez la négociation à fort impact, éliminez les dernières objections et transformez vos prospects chauds en signatures.',
    date: '18 août 2026',
  },
  {
    name: 'Lot de 10 « Campagnes Collecte de Dons »',
    mission:
      'Maniez la persuasion avec une rigueur absolue pour convaincre, engager et décrocher des prélèvements automatiques et des dons à fort volume.',
    date: '25 août 2026',
  },
  {
    name: 'Lot de 10 « Campagnes & Mailing »',
    mission: 'Pilotez des campagnes de prospection écrite à haut taux de conversion.',
    date: '1er septembre 2026',
  },
  {
    name: 'Lot de 10 « Opérateurs Téléphoniques & Support »',
    mission:
      "Maîtrisez la voix, encadrez chaque interaction et gérez vos flux de support et d'appels massifs sans fausse note.",
    date: '10 août 2026',
  },
  {
    name: 'Lot de 10 « Opérateurs de Saisie & Back-Office »',
    mission:
      'Alimentez vos CRM, nettoyez vos fichiers et garantissez une rigueur administrative infaillible.',
    date: '20 août 2026',
  },
] as const

// Option 2 — the four one-off missions.
const MISSIONS = [
  {
    name: 'Voix Off',
    body: "Dominez l'attention dès la première seconde sur vos spots publicitaires, modules e-learning ou vidéos de vente.",
    status: 'Disponible — livraison 24/48 h',
    available: true,
  },
  {
    name: 'Montage Vidéo',
    body: 'Du format court (TikTok, Reels, Shorts) au montage institutionnel : un rythme qui capte et qui retient.',
    status: 'Disponible',
    available: true,
  },
  {
    name: 'Assistanat Virtuel',
    body: "Libérez votre temps stratégique en déléguant la gestion d'agendas complexes et le filtrage des urgences à une élite rigoureuse.",
    status: 'En attente — prochain créneau : 10 août 2026',
    available: false,
  },
  {
    name: 'Copywriting & Rédaction',
    body: 'Pages de vente, e-mails et scripts rédigés pour convertir, pas seulement pour être lus.',
    status: 'Disponible',
    available: true,
  },
] as const

const FAQ = [
  {
    q: 'Que se passe-t-il si mon niveau est insuffisant pour la production ?',
    a: "Vous n'êtes pas refusé sans suite : vous êtes orienté vers l'académie pour renforcer votre niveau de langue. Une fois le niveau requis atteint, vous redevenez éligible à un placement en production.",
  },
  {
    q: 'Quels outils dois-je fournir en tant que client ?',
    a: "Vos outils et logiciels métier (CRM, scripts, procédures internes), plus une formation initiale de 5 jours dédiée à vos spécificités pour calibrer nos profils. L'infrastructure — onduleurs, secours énergétique, connexion stable — est déjà fournie et opérationnelle, sans rien à financer ni à mettre en place de votre côté.",
  },
  {
    q: "Comment fonctionne la commission apporteur d'affaires ?",
    a: 'Vous touchez une commission mensuelle récurrente tant que le profil que vous avez apporté reste en poste, ou que le contrat client que vous avez apporté court.',
  },
  {
    q: "Quels examens sont préparés à l'académie ?",
    a: 'DELF/DALF (B1 à C2), TEF Canada / TCF et les Diplômes de Français Professionnel — DFP Affaires, Relations Internationales, Tourisme-Hôtellerie-Restauration, Santé —, ainsi que le programme phare FOL pour les professionnels et leaders qui veulent plus d’impact à l’oral.',
  },
  {
    q: "Faut-il vouloir devenir agent pour s'inscrire aux préparations d'examens ?",
    a: "Non. Les préparations s'adressent à des personnes qui ont leurs propres objectifs : immigration, carrière, diplôme. La montée en compétences des candidats destinés à la production est un parcours distinct — et ces candidats passent réellement les examens officiels pour certifier leur niveau C1.",
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
      className={`watermark-float pointer-events-none absolute top-2 select-none font-mono font-medium leading-none text-[8rem] md:text-[14rem] ${
        side === 'right' ? 'right-0 md:right-4' : 'left-0 md:left-4'
      } ${tone === 'dark' ? 'text-background/5' : 'text-primary/5'}`}
    >
      {level}
    </span>
  )
}

/** Per-word staggered rise for the biggest act headings: each word carries
 * its own transition delay and lifts in once the surrounding Reveal fires
 * (see .stagger-rise in globals.css — static under reduced motion). */
function SplitWords({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="stagger-rise inline-block"
            style={{ '--sd': `${i * 70}ms` } as CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </>
  )
}

/** Mono act kicker: "Acte 01 · Niveau A1 — Le problème". A thin accent rule
 * draws itself beside the label shortly after the reveal (see .kicker-rule). */
function ActKicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-accent">
      <span>{children}</span>
      <span aria-hidden="true" className="kicker-rule h-px w-10 shrink-0 bg-accent/70 md:w-16" />
    </p>
  )
}

/** Chapter break between two light sections: a centered mono divider mark
 * (short accent rules + dots) so every act boundary reads as intentional.
 * Placed at the top of the section that opens the new chapter. */
function ChapterBreak() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-4 pt-14 md:pt-16"
    >
      <span className="h-px w-10 bg-accent/60 md:w-14" />
      <span className="font-mono text-xs tracking-[0.6em] text-muted">···</span>
      <span className="h-px w-10 bg-accent/60 md:w-14" />
    </div>
  )
}

/** Course-catalogue row: oversized Fraunces programme name on the left,
 * description + CTA in the second editorial column. Whole row is a link. */
function CatalogueRow({
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
      className="group grid gap-3 py-8 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-12 md:py-10"
    >
      <div>
        <p className="mb-3 font-mono text-xs tracking-widest text-accent">{index}</p>
        <h3 className="font-display text-2xl leading-[1.08] tracking-tight text-ink motion-safe:transition-colors motion-safe:duration-200 group-hover:text-primary md:text-4xl">
          {title}
        </h3>
      </div>
      <div className="md:pt-8">
        <p className="mb-3 text-sm text-muted">{description}</p>
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

/** Ordered marks for the six promises, same order as PROMESSES. */
const PROMISE_MARKS = [MarkShield, MarkPulse, MarkLayers, MarkLock, MarkBars, MarkRefresh] as const

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

/** Mono availability/status badge — the typographic replacement for the
 * client's emoji markers. `available` renders in success green, otherwise a
 * muted primary "waiting" treatment. */
function StatusBadge({
  available = false,
  children,
}: {
  available?: boolean
  children: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${
        available
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-primary/20 bg-primary/5 text-primary/80'
      }`}
    >
      {available && (
        <span aria-hidden="true" className="relative mr-1.5 inline-flex h-1.5 w-1.5 shrink-0">
          <span className="badge-ping absolute inset-0 rounded-full bg-success opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        </span>
      )}
      {children}
    </span>
  )
}

/** Compact in-card action link with the site's arrow affordance. */
function CardAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary"
    >
      {children}
      <span
        aria-hidden="true"
        className="motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
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
          className="hero-par pointer-events-none absolute -top-24 right-[10%]"
          style={{ '--pf': '-0.05' } as CSSProperties}
        >
          <div className="blob-drift-1 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div
          aria-hidden="true"
          className="hero-par pointer-events-none absolute bottom-[15%] -left-20"
          style={{ '--pf': '0.04' } as CSSProperties}
        >
          <div className="blob-drift-2 h-80 w-80 rounded-full bg-success/15 blur-3xl" />
        </div>
        <div
          aria-hidden="true"
          className="hero-par pointer-events-none absolute top-[40%] right-[-5%]"
          style={{ '--pf': '-0.03' } as CSSProperties}
        >
          <div className="blob-drift-3 h-56 w-56 rounded-full bg-background/10 blur-3xl" />
        </div>

        {/* Cursor spotlight overlay + custom-property writer (desktop only) */}
        <HeroFX />

        <div className="relative mx-auto flex min-h-[max(560px,calc(100svh-4rem))] max-w-6xl flex-col justify-center px-4 pb-32 pt-14 md:pt-16">
          <p
            className="hero-rise font-mono text-xs uppercase tracking-widest text-background/60"
            style={{ '--d': '0ms' } as CSSProperties}
          >
            e-Staf — Académie de langues & externalisation d&apos;élite — Madagascar
          </p>

          <h1 className="mt-6 font-display tracking-tight text-background">
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span
                className="hero-line-inner block text-3xl leading-[1.1] sm:text-4xl md:text-6xl md:leading-[1.05]"
                style={{ '--d': '150ms' } as CSSProperties}
              >
                Des talents freinés par la langue,
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span
                className="hero-line-inner block text-3xl leading-[1.1] sm:text-4xl md:text-6xl md:leading-[1.05]"
                style={{ '--d': '300ms' } as CSSProperties}
              >
                des partenaires freinés par le doute.
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
              <span
                className="hero-line-inner block text-5xl leading-[1.05] sm:text-6xl md:text-8xl md:leading-none"
                style={{ '--d': '450ms' } as CSSProperties}
              >
                e-Staf est le <em className="text-shimmer italic text-accent">pont</em>.
              </span>
            </span>
          </h1>

          <p
            className="hero-rise mt-6 max-w-xl text-background/70"
            style={{ '--d': '650ms' } as CSSProperties}
          >
            D&apos;un côté, des professionnels dont la seule barrière est la maîtrise de la
            langue. De l&apos;autre, des entreprises freinées par les risques de
            l&apos;externalisation. Lever ces deux freins à la fois, c&apos;est la solution
            qui fait notre identité.
          </p>

          <div
            className="hero-rise mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8"
            style={{ '--d': '800ms' } as CSSProperties}
          >
            <Button href="/offres/carrieres" variant="accent">
              Passer le test & rejoindre e-Staf
            </Button>
            <Link href="#apporteurs-clients" className="group font-medium text-background">
              <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-background after:content-[''] group-hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline">
                Nous contacter pour un projet d&apos;externalisation
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
        items={['DELF / DALF', 'TEF Canada / TCF', 'DFP', 'Programme FOL']}
        variant="accent"
      />

      {/* ============================================================ */}
      {/* ACTE 01 · A1 — Les deux espaces                              */}
      {/* ============================================================ */}
      <section id="espaces" className="relative overflow-hidden bg-background">
        <ActWatermark level="A1" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-20 md:pb-16 md:pt-28">
          <Reveal>
            <ActKicker>Acte 01 · Niveau A1 — Deux portes d&apos;entrée</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">
              <SplitWords text="Deux espaces, une même identité" />
            </h2>
            <p className="max-w-2xl text-muted">
              Que vous soyez un talent freiné par vos compétences linguistiques ou une
              entreprise freinée par les risques de l&apos;externalisation, votre porte
              d&apos;entrée est ici.
            </p>
          </Reveal>
        </div>

        {/* Full-bleed split-screen diptych: two doors meeting at a sharp seam. */}
        <div className="relative grid md:grid-cols-2">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 z-10 hidden w-px bg-accent/70 md:block"
          />

          {/* Door 1 — Entreprises (dark) */}
          <Reveal from="left" className="h-full">
            <div className="flex h-full flex-col bg-primary px-4 py-12 md:px-10 md:py-16">
              <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
                <div className="mb-8 flex items-start justify-between gap-6">
                  <p className="pt-1 font-mono text-xs uppercase tracking-widest text-accent">
                    Espace entreprises — B2B
                  </p>
                  <NetworkSchema className="w-24 shrink-0 text-background md:w-32" />
                </div>
                <h3 className="mb-4 font-display text-2xl leading-snug text-background md:text-3xl">
                  « Des agents qualifiés au service de vos ambitions. »
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-background/80 md:text-base">
                  Fini les craintes liées aux infrastructures, au turnover et aux manques de
                  qualification. Adieu les casse-têtes du recrutement et les coupures
                  imprévues. Chez e-Staf, nous vous offrons une solution clé en main : un
                  vivier de talents formés pour une maîtrise linguistique irréprochable, des
                  locaux équipés et un encadrement managérial rigoureux. Un seul objectif :
                  simplifier et sécuriser vos opérations d&apos;externalisation.
                </p>
                <div className="mt-auto pt-2">
                  <Button href="#apporteurs-clients" variant="accent">
                    Nous contacter pour un projet d&apos;externalisation
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Door 2 — Talents (light) */}
          <Reveal from="right" delay={100} className="h-full">
            <div className="flex h-full flex-col bg-white px-4 py-12 md:px-10 md:py-16">
              <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
                <div className="mb-8 flex items-start justify-between gap-6">
                  <p className="pt-1 font-mono text-xs uppercase tracking-widest text-success">
                    Espace talents & candidats
                  </p>
                  <StaircaseSchema className="w-24 shrink-0 text-primary md:w-32" />
                </div>
                <h3 className="mb-4 font-display text-2xl leading-snug text-ink md:text-3xl">
                  « Votre carrière de rêve en quelques clics. »
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted md:text-base">
                  Vous êtes un(e) professionnel(le) conscient(e) que la seule barrière entre
                  vous et votre carrière rêvée, c&apos;est la maîtrise de la langue ? Marre
                  de suivre des cours théoriques de gauche à droite ? Vous savez pertinemment
                  ce qu&apos;il vous faut : une réelle montée en compétences pour aligner vos
                  diplômes et votre expertise aux besoins exigeants du marché du travail
                  actuel.
                </p>
                <div className="mb-4 border-l-4 border-accent bg-background p-4">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    Condition d&apos;accès
                  </p>
                  <p className="font-mono text-xs leading-relaxed text-ink">
                    L&apos;accès à nos missions et à nos grands comptes est réservé aux
                    talents validant le niveau C1 après notre test de sélection. Ce niveau
                    est certifié par la réussite réelle des examens officiels — jamais
                    auto-déclaré.
                  </p>
                </div>
                <p className="mb-8 text-sm leading-relaxed text-muted md:text-base">
                  Passez le test, faites votre inscription, et nous, on se chargera de vous
                  fournir votre courbe de progression en temps réel.
                </p>
                <div className="mt-auto pt-2">
                  <Button href="/offres/carrieres" variant="primary">
                    Passer le test & rejoindre e-Staf
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ACTE 02 · B1 — La méthode (alternating center timeline)      */}
      {/* ============================================================ */}
      {/* overflow-x-clip (not hidden): the funnel schéma bleeds upward across
          the seam into the diptych while horizontal overflow stays clipped. */}
      <section id="solution" className="relative overflow-x-clip bg-background">
        <ActWatermark level="B1" side="left" />
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 md:pb-28 md:pt-14">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-12">
            <Reveal>
              <h2 className="mb-3 text-3xl md:text-5xl">
                La{' '}
                <span className="relative inline-block italic">
                  méthode
                  <RoughUnderline className="absolute -bottom-2 left-0 h-3 w-full text-accent md:-bottom-3" />
                </span>
              </h2>
              <p className="mb-5 font-mono text-xs text-muted">
                Acte 02 · Niveau B1 — La montée
              </p>
              <p className="max-w-2xl text-muted">
                Profils sous-qualifiés, turnover massif, coupures en pleine mission : vous
                connaissez les craintes. Voici, étape par étape, comment nous les neutralisons
                avant le premier appel client.
              </p>
            </Reveal>
            {/* The section's schéma: the selection funnel — candidates in, C1
                out. On desktop it deliberately breaks the section boundary,
                straddling the seam with the diptych above. */}
            <Reveal from="right" delay={150} className="relative z-10 md:-mt-40">
              <FunnelSchema className="mx-auto w-44 text-primary md:w-56" />
            </Reveal>
          </div>
          <div className="relative mt-10">
            {/* Central spine of the timeline — the section's signature. It draws
                itself downward once the timeline enters the viewport. */}
            <Reveal className="absolute bottom-6 left-4 top-4 -ml-[1.5px] w-[3px] md:left-1/2">
              <span
                aria-hidden="true"
                className="spine-draw block h-full w-full rounded-full bg-primary/25"
              />
            </Reveal>
            {SOLUTION_STEPS.map((step, i) => {
              const fromLeft = i % 2 === 0
              return (
                <div key={step.title} className="relative py-6 md:py-8">
                  <span
                    aria-hidden="true"
                    className="absolute left-4 top-8 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-primary bg-background font-mono text-[11px] font-medium text-primary md:left-1/2 md:top-10"
                  >
                    0{i + 1}
                  </span>
                  <Reveal from={fromLeft ? 'left' : 'right'}>
                    <div
                      className={`pl-12 md:pl-0 ${
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
          clipPath:
            'polygon(0 clamp(40px, 5vw, 72px), 100% 0, 100% 100%, 0 calc(100% - clamp(40px, 5vw, 72px)))',
        }}
      >
        <ActWatermark level="B2" tone="dark" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 py-28 md:py-36">
          {/* Act label runs vertically along the section's right edge on large
              screens — a different opening device than the mono kicker line. */}
          <p className="absolute right-0 top-28 hidden font-mono text-xs uppercase tracking-widest text-accent [writing-mode:vertical-rl] lg:block">
            Acte 03 · Niveau B2 — Le mécanisme
          </p>
          <Reveal>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent lg:hidden">
              Acte 03 · Niveau B2 — Le mécanisme
            </p>
            <h2 className="mb-4 text-3xl text-background md:text-5xl">
              <SplitWords text="Le double moteur" />
            </h2>
            <p className="mb-10 max-w-2xl text-sm text-background/70 md:text-base">
              Deux publics distincts, deux promesses distinctes : les élèves de
              l&apos;académie ne sont pas de futurs agents — ils poursuivent leurs propres
              objectifs. Le vivier destiné à la production suit un parcours séparé,
              sanctionné par les examens officiels.
            </p>
          </Reveal>

          {/* The representative schéma: two rotors, the C1-gated flow between
              them, and the return loop drawn in success green — the mechanism
              made literally visible. */}
          <Reveal>
            <div className="mb-12 md:mb-16">
              <DoubleEngineSchema className="mx-auto w-full max-w-[40rem] text-background" />
            </div>
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
                      Préparation aux examens officiels : DELF/DALF, TEF Canada / TCF, DFP
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Programme phare FOL pour professionnels et leaders</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>
                      Des apprenants qui visent leurs propres objectifs : immigration,
                      carrière, diplôme
                    </span>
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
                    <span>Des unités déployées par lots de dix chez des clients internationaux</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>
                      Niveau C1 certifié par la réussite réelle des examens officiels, jamais
                      auto-déclaré
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>
                      Infrastructure sécurisée fournie (onduleurs, secours, connexion stable)
                      et encadrement managérial constant
                    </span>
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
      {/* ACTE 04 · C1 — Les promesses & standards                     */}
      {/* ============================================================ */}
      <section id="promesses" className="relative overflow-hidden bg-white">
        <ActWatermark level="C1" side="left" />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-16 md:pb-32 md:pt-20">
          <Reveal>
            <ActKicker>Acte 04 · Niveau C1 — La preuve</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">
              <SplitWords text="Les promesses d'e-Staf & standards de performance" />
            </h2>
            <p className="mb-10 max-w-2xl text-muted">
              Ce que nous mettons en place pour sécuriser vos projets et exiger
              l&apos;excellence au quotidien.
            </p>
          </Reveal>

          {/* Promise composition: deliberately uneven — one dominant wide block
              per row (tinted, larger type) beside narrower quiet ones, each
              with its tiny schéma-mark in the shared 1.6px stroke language. */}
          <div className="mb-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PROMESSES.map(([index, title, body], i) => {
              const Mark = PROMISE_MARKS[i]
              const wide = i === 0 || i === 3 || i === 4
              const nudge = i === 1 ? 'lg:mt-8' : i === 5 ? 'lg:mt-10' : ''
              return (
                <Reveal
                  key={index}
                  delay={(i % 3) * 80}
                  className={`h-full ${wide ? 'lg:col-span-2' : ''}`}
                >
                  <div
                    className={`flex h-full flex-col ${
                      wide
                        ? 'border-t-2 border-primary/25 bg-background p-6 md:p-7'
                        : `border-t-2 border-muted/40 pt-5 ${nudge}`
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <Mark className={wide ? 'h-9 w-9 text-primary' : 'h-7 w-7 text-primary'} />
                      <span className="font-mono text-xs text-accent">{index}</span>
                    </div>
                    <h3 className={`mb-2 ${wide ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                      {title}
                    </h3>
                    <p className={`text-muted ${wide ? 'max-w-xl text-sm md:text-base' : 'text-sm'}`}>
                      {body}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <div className="mb-14 grid gap-10 md:grid-cols-[7fr_5fr] md:gap-14">
            {/* Accent-tinted sub-band: what e-Staf asks in return. */}
            <Reveal>
              <div className="h-full border-l-4 border-accent bg-accent/10 p-6 md:p-8">
                <h3 className="mb-2 text-xl md:text-2xl">Ce que e-Staf attend de vous</h3>
                <p className="mb-6 text-sm text-muted">
                  Deux engagements de votre côté, rien de plus :
                </p>
                <div className="grid gap-6">
                  <div className="border border-muted/30 bg-white p-6">
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
                      Engagement 01
                    </p>
                    <h4 className="mb-2 text-lg">Vos outils & CRM</h4>
                    <p className="text-sm text-muted">
                      Vous mettez à notre disposition vos logiciels métiers et votre CRM pour
                      que nos équipes s&apos;immergent directement dans votre écosystème.
                    </p>
                  </div>
                  <div className="border border-muted/30 bg-white p-6">
                    <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
                      Engagement 02
                    </p>
                    <h4 className="mb-2 text-lg">Une formation métier (5 jours)</h4>
                    <p className="text-sm text-muted">
                      Vos équipes dispensent une formation initiale de 5 jours dédiée à vos
                      spécificités, vos produits et vos process pour calibrer nos profils
                      avant le premier appel.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Fara's verified-journey certificate (moved out of the hero).
                Sits slightly off-grid: rotated, pulled up out of its row and
                overhanging the container alignment on the right. */}
            <Reveal from="right" className="md:relative md:z-10 md:-mr-6 md:-mt-10">
              <div className="relative rotate-0 rounded bg-primary p-6 md:-rotate-2 md:p-8">
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
              {(
                [
                  ['Sélection', 'Test + examens officiels'],
                  ['Formation', 'Continue en poste'],
                  ['Infrastructure', 'Sécurisée 24/7'],
                  ['Pilotage', 'Reporting hebdomadaire'],
                ] as const
              ).map(([label, value], i) => (
                <div key={label} className="p-4 md:p-6">
                  <div
                    className="stagger-rise"
                    style={{ '--sd': `${i * 90}ms` } as CSSProperties}
                  >
                    <StatChip label={label} value={value} />
                  </div>
                </div>
              ))}
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

      {/* Marquee band 2 — the standards, dark with outlined type */}
      <MarqueeBand
        items={[
          "Aucun candidat n'est perdu",
          'Niveau C1 certifié par examens officiels',
          'Reporting hebdomadaire',
          'Zéro turnover',
          'Infrastructure sécurisée',
        ]}
        variant="dark"
        duration={44}
        direction="right"
        tilt
      />

      {/* ============================================================ */}
      {/* Options de collaboration — lots de 10 & missions ponctuelles */}
      {/* ============================================================ */}
      <section id="collaboration" className="relative overflow-hidden bg-background">
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            {/* Opening device: a bordered mono chip echoing the deployment
                board's chrome, not the act-kicker line. */}
            <p className="mb-4">
              <span className="inline-block border border-primary/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary/80">
                Partenaires — Déploiement
              </span>
            </p>
            <h2 className="mb-4 text-3xl md:text-5xl">Vos options de collaboration</h2>
            <p className="mb-12 max-w-2xl text-muted">
              Le recrutement classique est un gouffre financier. L&apos;externalisation
              d&apos;élite est votre seul levier de croissance réel. Chez e-Staf, nous ne
              vous vendons pas des promesses sur un CV. Nous déployons des unités
              d&apos;élite formées, affûtées sur la voix et sur l&apos;écrit, prêtes à
              changer la donne.
            </p>
          </Reveal>

          <Reveal>
            <div className="mb-8">
              <p className="mb-2 font-mono text-sm text-accent">Option 01</p>
              <h3 className="mb-3 text-2xl md:text-3xl">
                La Squad Long Terme — lots de{' '}
                <span className="relative inline-block">
                  10
                  <RoughRing className="absolute -left-3 -top-1.5 h-[calc(100%+0.9rem)] w-[calc(100%+1.5rem)] text-accent" />
                </span>
              </h3>
              <p className="max-w-2xl text-sm text-muted md:text-base">
                Sécurisez votre structure. Intégrez instantanément 10 profils calibrés pour
                encaisser la charge, tenir la cadence et transformer chaque fichier froid en
                source de revenus durable.
              </p>
            </div>
          </Reveal>
          {/* Deployment board: a mono table-chrome frame around the six units. */}
          <div className="mb-16 border border-primary/25 bg-white/60">
            <div
              aria-hidden="true"
              className="flex items-center justify-between gap-4 border-b border-primary/25 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-primary/70 md:px-6"
            >
              <span>Unité × 06</span>
              <span className="hidden sm:inline">Mission</span>
              <span>Déploiement</span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-6 lg:grid-cols-3">
              {LOTS.map((lot, i) => (
                <Reveal key={lot.name} delay={(i % 3) * 80} className="h-full">
                  <SpotlightCard className="flex h-full flex-col border border-muted/30 bg-white p-5">
                    <span
                      aria-hidden="true"
                      className="mb-2 font-mono text-[10px] tracking-widest text-primary/50"
                    >
                      U-0{i + 1}
                    </span>
                    <h4 className="mb-2 font-display text-lg leading-snug">{lot.name}</h4>
                    <p className="mb-4 text-sm text-muted">{lot.mission}</p>
                    <div className="mt-auto">
                      <StatusBadge>
                        {`En attente de déploiement — fin de formation : ${lot.date}`}
                      </StatusBadge>
                      <div className="mt-3 flex flex-col items-start gap-1.5">
                        <CardAction href="#apporteurs-clients">
                          Collaborer (dispo immédiate)
                        </CardAction>
                        <CardAction href="#apporteurs-clients">
                          {`Réserver pour le ${lot.date}`}
                        </CardAction>
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal>
            <div className="mb-8">
              <p className="mb-2 font-mono text-sm text-accent">Option 02</p>
              <h3 className="mb-3 text-2xl md:text-3xl">Missions & prestations ponctuelles</h3>
              <p className="max-w-2xl text-sm text-muted md:text-base">
                Un besoin précis, une exécution rapide, un résultat mesurable. Confiez vos
                projets à haute exigence à des experts affûtés, sans équipe complète à
                l&apos;année.
              </p>
            </div>
          </Reveal>
          {/* Band-list: full-width mission rows with status pinned right — a
              deliberately different data-display metaphor from the board above. */}
          <div className="divide-y divide-muted/30 border-y border-muted/30">
            {MISSIONS.map((mission, i) => (
              <Reveal key={mission.name} delay={i * 60}>
                <div className="flex flex-col gap-3 py-6 md:grid md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,3fr)] md:items-center md:gap-8">
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className="font-mono text-xs text-primary/40"
                    >
                      M-0{i + 1}
                    </span>
                    <h4 className="font-display text-xl md:text-2xl">{mission.name}</h4>
                  </div>
                  <p className="text-sm text-muted">{mission.body}</p>
                  <div className="flex flex-col items-start gap-2 md:items-end md:text-right">
                    <StatusBadge available={mission.available}>{mission.status}</StatusBadge>
                    <CardAction href="#apporteurs-clients">Lancer une mission</CardAction>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Catalogue des programmes — compact summary                   */}
      {/* ============================================================ */}
      {/* overflow-x-clip: the diploma seal bleeds upward across the section
          boundary like a sticker slapped over the fold. */}
      <section id="catalogue" className="relative overflow-x-clip bg-white">
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-12 md:pb-36 md:pt-16">
          <div className="mb-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-12">
            <Reveal>
              {/* Editorial catalogue opening: italic serif lead-in, oversized title. */}
              <p className="mb-3 font-display text-lg italic text-muted">
                Académie — Formations
              </p>
              <h2 className="mb-5 text-4xl md:text-6xl">Catalogue des programmes</h2>
              <p className="max-w-2xl text-muted">
                Des préparations pour celles et ceux qui poursuivent leurs propres objectifs —
                immigration, carrière, diplôme — et un programme phare pour les leaders. Nos
                futurs agents passent les mêmes examens officiels pour certifier leur niveau.
              </p>
            </Reveal>
            {/* The catalogue's schéma: the diploma seal, rotated and breaking
                the section boundary on desktop. */}
            <Reveal from="right" delay={150} className="relative z-10 md:-mt-36">
              <SealSchema className="mx-auto w-28 -rotate-6 text-primary md:w-32" />
            </Reveal>
          </div>
          <div className="flex flex-col divide-y divide-muted/30 border-t border-muted/30">
            {(
              [
                {
                  href: '/offres/examens',
                  index: '01',
                  title: 'DELF / DALF & TEF Canada / TCF',
                  description:
                    "Diplômes officiels de français (B1 à C2) et entraînement chirurgical aux épreuves chronométrées pour l'immigration (CLB 7, 8, 9+). Préparations ouvertes, sessions en continu.",
                  cta: 'Voir les préparations',
                },
                {
                  href: '/offres/examens#dfp',
                  index: '02',
                  title: 'DFP — Diplômes de Français Professionnel',
                  description:
                    'Affaires, Relations Internationales, Tourisme-Hôtellerie-Restauration, Santé : prouvez que vous dominez le jargon et les codes de votre secteur. Prochaines cohortes dès le 10 septembre 2026.',
                  cta: 'Voir les cohortes DFP',
                },
                {
                  href: '/offres/fol',
                  index: '03',
                  title: 'Programme phare FOL — Français Oratoire des Leaders',
                  description:
                    "Le Cursus d'Élite de 6 mois : négociation, objections, prestance. Un parcours du combattant sélectif — seulement 5 élus sur 15 décrochent leur place.",
                  cta: 'Voir le programme FOL',
                },
                {
                  href: '/offres/carrieres',
                  index: '04',
                  title: 'Candidater chez e-Staf',
                  description:
                    'Passez le test de sélection, certifiez votre niveau C1 par les examens officiels et accédez à nos missions et grands comptes.',
                  cta: 'Passer le test',
                },
              ] as const
            ).map((offre, i) => (
              <Reveal key={offre.href} delay={i * 100}>
                <CatalogueRow {...offre} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Parcours candidat                                            */}
      {/* ============================================================ */}
      <section id="parcours" className="relative overflow-hidden bg-background">
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-10 md:pb-36 md:pt-16">
          <Reveal>
            <ActKicker>Votre ascension commence ici</ActKicker>
            <h2 className="mb-10 text-3xl md:text-5xl">Parcours candidat</h2>
          </Reveal>
          {/* Horizontal step-flow on desktop: three numbered stations linked by
              an arrowed line, with the C1 checkpoint gate drawn on the last
              connector. Stacks vertically on mobile. */}
          <ol className="mb-10 grid gap-12 md:grid-cols-3 md:gap-8">
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
              <li key={index} className="relative">
                {i < 2 && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-12 left-[1.375rem] top-14 w-px bg-primary/20 md:hidden"
                  />
                )}
                <Reveal delay={i * 120}>
                  <div className="mb-4 flex items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white font-mono text-sm text-primary">
                      {index}
                    </span>
                    {i < 2 && (
                      <span
                        aria-hidden="true"
                        className="hidden flex-1 items-center gap-2 md:flex"
                      >
                        <span className="h-px flex-1 bg-primary/25" />
                        {i === 1 && (
                          <GateSchema className="h-11 w-[4.5rem] shrink-0 text-primary" />
                        )}
                        <span className="h-px w-5 bg-primary/25" />
                        <svg
                          viewBox="0 0 8 10"
                          className="h-2.5 w-2 shrink-0 text-primary/50"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M0 0 L8 5 L0 10 Z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="pl-16 md:pl-0">
                    <h3 className="mb-2 text-lg md:text-xl">{title}</h3>
                    <p className="text-sm text-muted">{body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <Reveal>
            <Button href="/offres/carrieres" variant="accent">
              Passer le test & rejoindre e-Staf
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ                                                          */}
      {/* ============================================================ */}
      <section id="faq" className="relative overflow-hidden bg-white">
        <ChapterBreak />
        {/* Oversized italic question mark as the section's only ornament. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-16 select-none font-display text-[9rem] italic leading-none text-primary/5 md:right-16 md:text-[17rem]"
        >
          ?
        </span>
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 md:pb-20 md:pt-10">
          <Reveal>
            <p className="mb-2 font-display text-lg italic text-muted">
              Avant de vous lancer
            </p>
            <h2 className="mb-4 text-3xl md:text-5xl">Questions fréquentes</h2>
            <p className="mb-8 max-w-2xl text-muted">
              Les questions qui reviennent le plus souvent, côté candidats, entreprises et
              apporteurs d&apos;affaires.
            </p>
          </Reveal>
          <div className="flex max-w-2xl flex-col gap-8">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={(i % 2) * 100}>
                <div className="group">
                  <h3 className="mb-2 text-xl">
                    <span className="mr-2 font-mono text-sm text-accent">Q0{i + 1}</span>
                    <span className="faq-underline">{item.q}</span>
                  </h3>
                  <p className="text-sm text-muted">{item.a}</p>
                </div>
              </Reveal>
            ))}
            <Reveal>
              <div className="group">
                <h3 className="mb-2 text-xl">
                  <span className="mr-2 font-mono text-sm text-accent">Q06</span>
                  <span className="faq-underline">
                    Combien de temps dure la formation avant un placement en production ?
                  </span>
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

      {/* ============================================================ */}
      {/* Proposer un partenariat — apporteurs, entreprises, contact   */}
      {/* ============================================================ */}
      <section id="apporteurs-clients" className="relative overflow-hidden bg-background">
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 md:pb-28 md:pt-14">
          <Reveal>
            {/* Inverted mono chip — the page's last opening device. */}
            <p className="mb-4">
              <span className="inline-block bg-primary px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-background">
                Proposer un partenariat
              </span>
            </p>
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
                      <span>
                        Des agents au niveau C1 certifié par les examens officiels, pas
                        déclaré sur CV.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Une infrastructure fournie et déjà opérationnelle.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>
                        Un encadrement managérial constant et un point hebdomadaire
                        d&apos;une heure avec reporting complet.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Aucune gestion RH à assurer de votre côté.</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-sm text-muted">
                    De votre côté : vos outils et logiciels métier (CRM, scripts,
                    procédures internes) et une formation métier initiale de 5 jours.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal from="right" delay={100}>
              {/* Framed contact panel: chrome header with the envelope schéma. */}
              <div className="border border-primary/25 bg-white">
                <div className="flex items-center justify-between gap-4 border-b border-primary/25 px-6 py-4">
                  <div>
                    <h3 className="text-xl">Nous contacter</h3>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted">
                      Formulaire de contact
                    </p>
                  </div>
                  <EnvelopeSchema className="h-11 w-[3.75rem] shrink-0 text-primary" />
                </div>
                <div className="p-6">
                  <ContactForm defaultSubject="Devenir apporteur d'affaires" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  )
}
