import Link from 'next/link'
import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
import { ContactForm } from '@/components/ContactForm'
import { Reveal } from '@/components/Reveal'
import { SpotlightCard } from '@/components/SpotlightCard'
import { Carousel } from '@/components/Carousel'
import {
  DoubleEngineSchema,
  EnvelopeSchema,
  FunnelSchema,
  MarkBars,
  MarkLayers,
  MarkLock,
  MarkPulse,
  MarkRefresh,
  MarkShield,
  RoughRing,
  RoughUnderline,
} from '@/components/Schemas'
import {
  ActKicker,
  ActWatermark,
  CardAction,
  ChapterBreak,
  GRAIN_URI,
  HeroPreviewCard,
  SplitWords,
  StatChip,
  StatusBadge,
  TrustStrip,
} from '@/components/PageBits'

export const metadata: Metadata = {
  title: 'Externaliser avec e-Staf — staffing B2B, Madagascar',
  description:
    "Des agents au niveau C1 certifié, une infrastructure sécurisée déjà en place et un encadrement managérial constant. Découvrez les options de collaboration e-Staf pour votre entreprise.",
}

// The 4 steps of the method — how e-Staf de-risks externalisation before the
// first client call, staged as an alternating timeline.
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

// The 6 partner-facing promises.
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
const PROMISE_MARKS = [MarkShield, MarkPulse, MarkLayers, MarkLock, MarkBars, MarkRefresh] as const

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

// Trust strip: partner-relevant proof, distinct from the home page's more
// general set and from the candidate page's set.
const TRUST_ITEMS = [
  'Infrastructure sécurisée 24/7',
  'Encadrement managérial constant',
  'Reporting hebdomadaire',
  'Zéro turnover garanti',
  'CRM & outils intégrés',
  'Confidentialité contractuelle',
] as const

const TESTIMONIALS = [
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

const FAQ = [
  {
    q: 'Quels outils dois-je fournir en tant que client ?',
    a: "Vos outils et logiciels métier (CRM, scripts, procédures internes), plus une formation initiale de 5 jours dédiée à vos spécificités pour calibrer nos profils. L'infrastructure — onduleurs, secours énergétique, connexion stable — est déjà fournie et opérationnelle, sans rien à financer ni à mettre en place de votre côté.",
  },
  {
    q: "Comment fonctionne la commission apporteur d'affaires ?",
    a: 'Vous touchez une commission mensuelle récurrente tant que le profil que vous avez apporté reste en poste, ou que le contrat client que vous avez apporté court.',
  },
] as const

/** One "Squad Long Terme" unit card — reused in the mobile stack and the
 * desktop carousel. */
function LotCard({ lot, index }: { lot: (typeof LOTS)[number]; index: number }) {
  return (
    <SpotlightCard className="flex h-full flex-col border border-muted/30 bg-white p-5">
      <span aria-hidden="true" className="mb-2 font-mono text-[10px] tracking-widest text-primary/50">
        U-0{index + 1}
      </span>
      <h4 className="mb-2 font-display text-lg leading-snug">{lot.name}</h4>
      <p className="mb-4 text-sm text-muted">{lot.mission}</p>
      <div className="mt-auto">
        <StatusBadge>{`En attente de déploiement — fin de formation : ${lot.date}`}</StatusBadge>
        <div className="mt-3 flex flex-col items-start gap-1.5">
          <CardAction href="#contact">Collaborer (dispo immédiate)</CardAction>
          <CardAction href="#contact">{`Réserver pour le ${lot.date}`}</CardAction>
        </div>
      </div>
    </SpotlightCard>
  )
}

export default function EntreprisesPage() {
  return (
    <main>
      {/* ============================================================ */}
      {/* OPENER — dark editorial banner, floating partner proof cards */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-primary">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: GRAIN_URI }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 lg:pr-72 md:py-28 xl:pr-80">
          <div className="pointer-events-none absolute right-4 top-8 z-20 hidden w-64 flex-col gap-5 lg:flex xl:right-8 xl:w-72">
            <div className="pointer-events-auto">
              <HeroPreviewCard
                kicker="Garantie"
                bar="success"
                title="Zéro turnover"
                meta="Remplacement immédiat si besoin"
                badge={<StatusBadge available>Garanti par contrat</StatusBadge>}
              />
            </div>
            <div className="pointer-events-auto">
              <HeroPreviewCard
                kicker="Unité disponible"
                bar="accent"
                title={LOTS[4].name}
                meta={`Fin de formation : ${LOTS[4].date}`}
                badge={<StatusBadge>En attente de déploiement</StatusBadge>}
              />
            </div>
          </div>

          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-background/60">
            e-Staf — Espace entreprises — B2B
          </p>
          <h1 className="mb-6 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-background md:text-6xl">
            <SplitWords text="Une externalisation sans risque." />
          </h1>
          <p className="mb-4 max-w-xl font-display text-xl italic leading-snug text-accent md:text-2xl">
            « Des agents qualifiés au service de vos ambitions. »
          </p>
          <p className="mb-8 max-w-xl text-sm leading-relaxed text-background/80 md:text-base">
            Fini les craintes liées aux infrastructures, au turnover et aux manques de
            qualification. Adieu les casse-têtes du recrutement et les coupures imprévues.
            Chez e-Staf, nous vous offrons une solution clé en main : un vivier de talents
            formés, des locaux équipés et un encadrement managérial rigoureux.
          </p>
          <Button href="#contact" variant="accent">
            Nous contacter pour un projet d&apos;externalisation
          </Button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Trust strip — partner-relevant proof at the opener-to-body seam */}
      {/* ============================================================ */}
      <TrustStrip items={TRUST_ITEMS} />

      {/* ============================================================ */}
      {/* La méthode — alternating center timeline                     */}
      {/* ============================================================ */}
      <section id="solution" className="relative overflow-x-clip bg-background">
        <ActWatermark level="01" side="left" />
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 md:pb-28 md:pt-14">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-12">
            <Reveal>
              <ActKicker>Comment nous neutralisons vos craintes</ActKicker>
              <h2 className="mb-5 text-3xl md:text-5xl">
                La{' '}
                <span className="relative inline-block italic">
                  méthode
                  <RoughUnderline className="absolute -bottom-2 left-0 h-3 w-full text-accent md:-bottom-3" />
                </span>
              </h2>
              <p className="max-w-2xl text-muted">
                Profils sous-qualifiés, turnover massif, coupures en pleine mission : vous
                connaissez les craintes. Voici, étape par étape, comment nous les neutralisons
                avant le premier appel client.
              </p>
            </Reveal>
            <Reveal from="right" delay={150} className="relative z-10 md:-mt-16">
              <FunnelSchema className="mx-auto w-44 text-primary md:w-56" />
            </Reveal>
          </div>
          <div className="relative mt-10">
            <Reveal className="absolute bottom-6 left-4 top-4 -ml-[1.5px] w-[3px] md:left-1/2">
              <span aria-hidden="true" className="spine-draw block h-full w-full rounded-full bg-primary/25" />
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
                        fromLeft ? 'md:pr-[calc(50%+2.5rem)] md:text-right' : 'md:pl-[calc(50%+2.5rem)]'
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
      {/* Le double moteur (dark, diagonal seams)                      */}
      {/* ============================================================ */}
      <section
        id="double-moteur"
        className="relative overflow-hidden bg-primary"
        style={{
          clipPath:
            'polygon(0 clamp(40px, 5vw, 72px), 100% 0, 100% 100%, 0 calc(100% - clamp(40px, 5vw, 72px)))',
        }}
      >
        <ActWatermark level="02" tone="dark" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 py-28 md:py-36">
          <p className="absolute right-0 top-28 hidden font-mono text-xs uppercase tracking-widest text-accent [writing-mode:vertical-rl] lg:block">
            Le mécanisme
          </p>
          <Reveal>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent lg:hidden">
              Le mécanisme
            </p>
            <h2 className="mb-4 text-3xl text-background md:text-5xl">
              <SplitWords text="Le double moteur" />
            </h2>
            <p className="mb-10 max-w-2xl text-sm text-background/70 md:text-base">
              Deux publics distincts, deux promesses distinctes : les élèves de
              l&apos;académie ne sont pas de futurs agents — ils poursuivent leurs propres
              objectifs. Le vivier destiné à votre production suit un parcours séparé,
              sanctionné par les examens officiels.
            </p>
          </Reveal>
          <Reveal>
            <div className="mb-12 md:mb-16">
              <DoubleEngineSchema className="mx-auto w-full max-w-[40rem] text-background" />
            </div>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-2">
            <Reveal from="left">
              <div>
                <h3 className="mb-4 font-display text-2xl text-background md:text-3xl">Académie</h3>
                <ul className="flex flex-col gap-3 text-sm text-background/80">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Préparation aux examens officiels : DELF/DALF, TEF Canada / TCF, DFP</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>Programme phare FOL pour professionnels et leaders</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-accent">→</span>
                    <span>
                      Des apprenants qui visent leurs propres objectifs : immigration, carrière,
                      diplôme
                    </span>
                  </li>
                </ul>
              </div>
            </Reveal>
            <Reveal from="right">
              <div>
                <h3 className="mb-4 font-display text-2xl text-background md:text-3xl">Production B2B</h3>
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
                      Infrastructure sécurisée fournie (onduleurs, secours, connexion stable) et
                      encadrement managérial constant
                    </span>
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Les promesses & standards de performance                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-white">
        <ActWatermark level="03" side="left" />
        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-16 md:pb-32 md:pt-20">
          <Reveal>
            <ActKicker>La preuve</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">
              <SplitWords text="Les promesses d'e-Staf & standards de performance" />
            </h2>
            <p className="mb-10 max-w-2xl text-muted">
              Ce que nous mettons en place pour sécuriser vos projets et exiger l&apos;excellence
              au quotidien.
            </p>
          </Reveal>

          <div className="mb-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PROMESSES.map(([index, title, body], i) => {
              const Mark = PROMISE_MARKS[i]
              const wide = i === 0 || i === 3 || i === 4
              const nudge = i === 1 ? 'lg:mt-8' : i === 5 ? 'lg:mt-10' : ''
              return (
                <Reveal key={index} delay={(i % 3) * 80} className={`h-full ${wide ? 'lg:col-span-2' : ''}`}>
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
                    <h3 className={`mb-2 ${wide ? 'text-xl md:text-2xl' : 'text-lg'}`}>{title}</h3>
                    <p className={`text-muted ${wide ? 'max-w-xl text-sm md:text-base' : 'text-sm'}`}>{body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>

          <Reveal>
            <div className="mb-14 h-full max-w-3xl border-l-4 border-accent bg-accent/10 p-6 md:p-8">
              <h3 className="mb-2 text-xl md:text-2xl">Ce que e-Staf attend de vous</h3>
              <p className="mb-6 text-sm text-muted">Deux engagements de votre côté, rien de plus :</p>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border border-muted/30 bg-white p-6">
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">Engagement 01</p>
                  <h4 className="mb-2 text-lg">Vos outils & CRM</h4>
                  <p className="text-sm text-muted">
                    Vous mettez à notre disposition vos logiciels métiers et votre CRM pour que
                    nos équipes s&apos;immergent directement dans votre écosystème.
                  </p>
                </div>
                <div className="border border-muted/30 bg-white p-6">
                  <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">Engagement 02</p>
                  <h4 className="mb-2 text-lg">Une formation métier (5 jours)</h4>
                  <p className="text-sm text-muted">
                    Vos équipes dispensent une formation initiale de 5 jours dédiée à vos
                    spécificités, vos produits et vos process pour calibrer nos profils avant le
                    premier appel.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-2 divide-x divide-y divide-muted/30 border-y border-muted/30 md:grid-cols-4 md:divide-y-0">
              {(
                [
                  ['Sélection', 'Test + examens officiels'],
                  ['Formation', 'Continue en poste'],
                  ['Infrastructure', 'Sécurisée 24/7'],
                  ['Pilotage', 'Reporting hebdomadaire'],
                ] as const
              ).map(([label, value], i) => (
                <div key={label} className="p-4 md:p-6">
                  <div className="stagger-rise" style={{ '--sd': `${i * 90}ms` } as CSSProperties}>
                    <StatChip label={label} value={value} />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Options de collaboration — lots de 10 & missions ponctuelles */}
      {/* ============================================================ */}
      <section id="collaboration" className="relative overflow-hidden bg-background">
        <ActWatermark level="04" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <Reveal>
            <p className="mb-4">
              <span className="inline-block border border-primary/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-primary/80">
                Partenaires — Déploiement
              </span>
            </p>
            <h2 className="mb-4 text-3xl md:text-5xl">Vos options de collaboration</h2>
            <p className="mb-12 max-w-2xl text-muted">
              Le recrutement classique est un gouffre financier. L&apos;externalisation
              d&apos;élite est votre seul levier de croissance réel. Chez e-Staf, nous ne vous
              vendons pas des promesses sur un CV. Nous déployons des unités d&apos;élite
              formées, affûtées sur la voix et sur l&apos;écrit, prêtes à changer la donne.
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
          <div className="mb-16 border border-primary/25 bg-white/60">
            <div
              aria-hidden="true"
              className="flex items-center justify-between gap-4 border-b border-primary/25 px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-primary/70 md:px-6"
            >
              <span>Unité × 06</span>
              <span className="hidden sm:inline">Mission</span>
              <span>Déploiement</span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 md:hidden">
              {LOTS.map((lot, i) => (
                <Reveal key={lot.name} delay={(i % 2) * 80} className="h-full">
                  <LotCard lot={lot} index={i} />
                </Reveal>
              ))}
            </div>
            <Reveal className="hidden p-4 md:block md:p-6">
              <Carousel ariaLabel="Unités disponibles — lots de 10">
                {LOTS.map((lot, i) => (
                  <div key={lot.name} className="carousel-item w-[70%] shrink-0 sm:w-[46%] lg:w-[31%]">
                    <LotCard lot={lot} index={i} />
                  </div>
                ))}
              </Carousel>
            </Reveal>
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
          {/* Desktop/tablet: the same carousel pattern as the lots above, for
              consistency across the two comparable-item lists on this page. */}
          <div className="hidden md:block">
            <Carousel ariaLabel="Missions et prestations ponctuelles">
              {MISSIONS.map((mission, i) => (
                <div key={mission.name} className="carousel-item w-[46%] shrink-0 lg:w-[31%]">
                  <SpotlightCard className="flex h-full flex-col border border-muted/30 bg-white p-5">
                    <span aria-hidden="true" className="mb-2 font-mono text-[10px] tracking-widest text-primary/40">
                      M-0{i + 1}
                    </span>
                    <h4 className="mb-2 font-display text-lg leading-snug">{mission.name}</h4>
                    <p className="mb-4 text-sm text-muted">{mission.body}</p>
                    <div className="mt-auto">
                      <StatusBadge available={mission.available}>{mission.status}</StatusBadge>
                      <div className="mt-3">
                        <CardAction href="#contact">Lancer une mission</CardAction>
                      </div>
                    </div>
                  </SpotlightCard>
                </div>
              ))}
            </Carousel>
          </div>
          {/* Mobile: a simple band-list — a horizontal carousel of full-width
              rows reads worse than a stack once only one column fits. */}
          <div className="divide-y divide-muted/30 border-y border-muted/30 md:hidden">
            {MISSIONS.map((mission, i) => (
              <Reveal key={mission.name} delay={i * 60}>
                <div className="flex flex-col gap-3 py-6">
                  <div className="flex items-baseline gap-3">
                    <span aria-hidden="true" className="font-mono text-xs text-primary/40">
                      M-0{i + 1}
                    </span>
                    <h4 className="font-display text-xl">{mission.name}</h4>
                  </div>
                  <p className="text-sm text-muted">{mission.body}</p>
                  <div className="flex flex-col items-start gap-2">
                    <StatusBadge available={mission.available}>{mission.status}</StatusBadge>
                    <CardAction href="#contact">Lancer une mission</CardAction>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Avis partenaires                                              */}
      {/* ============================================================ */}
      <section id="confiance" className="relative overflow-hidden bg-white">
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 md:pb-20 md:pt-14">
          <Reveal>
            <p className="mb-2 font-display text-lg italic text-muted">Ce qu&apos;ils en disent</p>
            <h2 className="mb-4 text-3xl md:text-5xl">Avis partenaires</h2>
            <p className="mb-10 text-sm text-muted">
              Envie de voir nos talents en action avant de vous engager ?{' '}
              <Link href="/communaute" className="text-primary underline">
                Découvrir nos meilleurs talents
              </Link>{' '}
              sur la vitrine communauté e-Staf.
            </p>
          </Reveal>
          <div className="flex flex-col">
            {TESTIMONIALS.map((t, i) => {
              const fromLeft = i % 2 === 0
              return (
                <Reveal key={t.firstname} from={fromLeft ? 'left' : 'right'}>
                  <figure className={`max-w-2xl py-8 md:py-10 ${fromLeft ? '' : 'md:ml-auto md:text-right'}`}>
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

      {/* ============================================================ */}
      {/* FAQ                                                          */}
      {/* ============================================================ */}
      <section id="faq" className="relative overflow-hidden bg-background">
        <ChapterBreak />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-16 select-none font-display text-[9rem] italic leading-none text-primary/5 md:right-16 md:text-[17rem]"
        >
          ?
        </span>
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 md:pb-20 md:pt-10">
          <Reveal>
            <p className="mb-2 font-display text-lg italic text-muted">Avant de nous rejoindre</p>
            <h2 className="mb-8 text-3xl md:text-5xl">Questions fréquentes</h2>
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
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Contact — apporteurs d'affaires & entreprises                */}
      {/* ============================================================ */}
      <section id="contact" className="relative overflow-hidden bg-white">
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 md:pb-28 md:pt-14">
          <Reveal>
            <p className="mb-4">
              <span className="inline-block bg-primary px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-background">
                Proposer un partenariat
              </span>
            </p>
            <h2 className="mb-8 text-3xl md:text-5xl">Apporteurs d&apos;affaires et entreprises</h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-2">
            <Reveal from="left">
              <div className="flex flex-col gap-8">
                <div>
                  <h3 className="mb-2 text-xl">Devenir apporteur d&apos;affaires</h3>
                  <p className="mb-3 text-sm text-muted">Concrètement, voici comment ça fonctionne :</p>
                  <ul className="flex flex-col gap-2 text-sm text-muted">
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Tu mets en relation un client potentiel avec nous, ou tu apportes un CV qualifié.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>On qualifie le client ou le candidat, puis on procède au placement.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>
                        Tu touches une commission mensuelle récurrente tant que le profil reste en
                        poste ou que le contrat client court.
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
                      <span>Des agents au niveau C1 certifié par les examens officiels, pas déclaré sur CV.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Une infrastructure fournie et déjà opérationnelle.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>
                        Un encadrement managérial constant et un point hebdomadaire d&apos;une heure
                        avec reporting complet.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="shrink-0 text-success">→</span>
                      <span>Aucune gestion RH à assurer de votre côté.</span>
                    </li>
                  </ul>
                  <p className="mt-3 text-sm text-muted">
                    De votre côté : vos outils et logiciels métier (CRM, scripts, procédures
                    internes) et une formation métier initiale de 5 jours.
                  </p>
                </div>
              </div>
            </Reveal>
            <Reveal from="right" delay={100}>
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
