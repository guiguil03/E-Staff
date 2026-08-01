import Link from 'next/link'
import { type CSSProperties, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { Reveal } from '@/components/Reveal'
import { HeroRibbon } from '@/components/HeroRibbon'
import { HeroFX } from '@/components/HeroFX'
import { FoldCard, type Tone } from '@/components/CardBits'
import {
  IconBrainGear,
  IconBriefcase,
  IconCertificate,
  IconChevron,
  IconClipboardCheck,
  IconDove,
  IconGearDuo,
  IconGraduationCap,
  IconHandshake,
  IconMic,
  IconPersonStar,
} from '@/components/Icons'
import {
  ActKicker,
  ActWatermark,
  GRAIN_URI,
  HeroPreviewCard,
  SplitWords,
  StatChip,
  StatusBadge,
  TrustStrip,
} from '@/components/PageBits'

// Option 1's first lot, referenced by the hero's second floating proof card.
// Kept in sync by hand with the full list on /entreprises — a light home
// only ever needs this one glance-proof fact, not the whole catalogue.
const FIRST_LOT = {
  name: 'Lot de 10 « Setters »',
  date: '15 août 2026',
}

// Quiet trust strip right after the hero — honest capability tags relevant
// to both audiences at once, since the homepage no longer commits to one
// side until the diptych below. Not invented client logos.
const TRUST_ITEMS = [
  'Sélection sur test réel',
  'Infrastructure sécurisée 24/7',
  'Formation continue',
  'Reporting hebdomadaire',
  'Zéro turnover garanti',
  'Niveau C1 certifié',
] as const

// "Du côté des Talents" / "Du côté des Entreprises" — the short card-format
// items from 01-reference.png. Real, existing site sections, not invented
// facts: each title mirrors an actual nav/CTA label already used elsewhere
// (Header's "Se préparer aux examens", the FOL programme, /offres/carrieres,
// the Vitrine des Talents, /entreprises) — see CAHIER-DES-CHARGES-eSTAF.md.
const TALENT_CARDS: { title: string; icon: ReactNode }[] = [
  { title: 'Se préparer aux examens internationaux', icon: <IconCertificate /> },
  { title: 'Se former aux FOL — Français : Oratoire des Leaders', icon: <IconMic /> },
  { title: 'Postuler à un métier', icon: <IconBriefcase /> },
]
const ENTREPRISE_CARDS: { title: string; icon: ReactNode }[] = [
  { title: 'Découvrir nos meilleurs talents', icon: <IconPersonStar /> },
  { title: 'Découvrir nos offres B2B', icon: <IconHandshake /> },
]

// Roadmap panel tones — brand tokens only, per 02-reference.png's three
// saturated color panels (navy → green → gold instead of white cards).
const ROADMAP_TONE: Record<Tone, { bg: string; text: string; sub: string; badge: string }> = {
  primary: { bg: 'bg-primary', text: 'text-background', sub: 'text-background/75', badge: 'bg-background/10 text-background' },
  success: { bg: 'bg-success', text: 'text-background', sub: 'text-background/80', badge: 'bg-background/15 text-background' },
  accent: { bg: 'bg-accent', text: 'text-ink', sub: 'text-ink/75', badge: 'bg-ink/10 text-ink' },
}

export default function HomePage() {
  return (
    <main>
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

        <div className="relative mx-auto max-w-6xl px-4 pb-32 pt-14 md:pt-16 lg:pr-72 xl:pr-80">
          {/* Floating preview cards (edX-style glance proof), lg and up only.
              The lg:pr-72 / xl:pr-80 padding above reserves this gutter so
              they never collide with the headline column. Hidden below lg
              rather than stacked, per spec — at narrower widths there's no
              safe empty space to float them in without covering text. */}
          <div className="pointer-events-none absolute right-4 top-28 z-20 hidden w-64 flex-col gap-5 lg:flex xl:right-8 xl:top-32 xl:w-72">
            <div className="pointer-events-auto">
              <HeroPreviewCard
                kicker="Prochaine cohorte"
                bar="accent"
                title="DFP Affaires"
                meta="Rentrée : 10 septembre 2026"
                badge={<StatusBadge available>Inscriptions ouvertes</StatusBadge>}
              />
            </div>
            <div className="pointer-events-auto">
              <HeroPreviewCard
                kicker="Lot disponible"
                bar="success"
                title={FIRST_LOT.name}
                meta={`Fin de formation : ${FIRST_LOT.date}`}
                badge={<StatusBadge>En attente de déploiement</StatusBadge>}
              />
            </div>
          </div>

          {/* Message 1 — the pitch */}
          <div className="flex min-h-[max(480px,calc(100svh-10rem))] flex-col justify-center">
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
                  Le talent a une voix.
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                <span
                  className="hero-line-inner block text-3xl leading-[1.1] sm:text-4xl md:text-6xl md:leading-[1.05]"
                  style={{ '--d': '300ms' } as CSSProperties}
                >
                  L&apos;entreprise a des exigences.
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.12em] -mb-[0.12em]">
                <span
                  className="hero-line-inner block text-5xl leading-[1.05] sm:text-6xl md:text-8xl md:leading-none"
                  style={{ '--d': '450ms' } as CSSProperties}
                >
                  e-Staf <em className="text-shimmer italic text-accent">aligne</em> les deux.
                </span>
              </span>
            </h1>

            <p className="hero-rise mt-6 max-w-xl text-background/70" style={{ '--d': '650ms' } as CSSProperties}>
              Entre des talents prêts à performer et des entreprises prêtes à grandir, nous
              formons, nous encadrons, nous sécurisons.
            </p>

            <div className="hero-rise mt-8" style={{ '--d': '800ms' } as CSSProperties}>
              <Button href="/offres/carrieres" variant="accent">
                Créer un compte
              </Button>
            </div>

            <div className="mt-10 max-w-3xl md:mt-14">
              <HeroRibbon />
            </div>
          </div>

        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
          <p className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-background/50">
            Faites défiler — deux portes vous attendent
          </p>
          <span className="scroll-cue-line block h-10 w-px bg-accent/80" aria-hidden="true" />
        </div>
      </section>

      {/* ============================================================ */}
      {/* Trust strip — quiet capability tags at the hero-to-content seam */}
      {/* ============================================================ */}
      <TrustStrip items={TRUST_ITEMS} />

      {/* ============================================================ */}
      {/* Notre Parcours d'Équivalences & d'Intégration — 3-step roadmap */}
      {/* (02-reference.png): replaces the old "stock chart" curve as    */}
      {/* the homepage's literal glance-proof device. HeroRibbon stays   */}
      {/* small and decorative inside the hero itself.                  */}
      {/* ============================================================ */}
      <section id="parcours" className="relative overflow-hidden bg-background">
        <ActWatermark level="01" side="right" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <Reveal>
            <ActKicker>La preuve en un coup d&apos;œil</ActKicker>
            <h2 className="mb-3 text-3xl md:text-5xl">
              <SplitWords text="Notre Parcours d'Équivalences & d'Intégration" />
            </h2>
            <p className="mb-10 max-w-2xl text-muted md:mb-14">
              Un filtre exigeant pour les entreprises, un tremplin garanti pour les
              candidats.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-3">
            {/* Step 01 — primary (navy) */}
            <Reveal from="up">
              <div className={`flex h-full flex-col rounded-2xl p-6 shadow-md md:p-7 ${ROADMAP_TONE.primary.bg}`}>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className={`font-display text-lg leading-snug md:text-xl ${ROADMAP_TONE.primary.text}`}>
                    <span className="font-mono text-sm tracking-widest">01.</span> Évaluation
                    initiale &amp; diagnostic
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ROADMAP_TONE.primary.badge}`}
                  >
                    <IconClipboardCheck className="h-6 w-6" />
                  </span>
                </div>
                <p className={`mb-4 text-sm leading-relaxed ${ROADMAP_TONE.primary.sub}`}>
                  Niveau d&apos;entrée : B1 à B2 (Bases solides mais non prêt pour la prod)
                </p>
                <ul className={`space-y-3 text-sm leading-relaxed ${ROADMAP_TONE.primary.sub}`}>
                  <li>
                    <strong className={ROADMAP_TONE.primary.text}>Action :</strong> Test
                    linguistique et comportemental ciblé par métier.
                  </li>
                  <li>
                    <strong className={ROADMAP_TONE.primary.text}>Résultat :</strong>{' '}
                    Identification précise des lacunes (élocution, fluidité, gestion du
                    stress, posture professionnelle).
                  </li>
                </ul>
              </div>
            </Reveal>

            <span aria-hidden="true" className="hidden items-center justify-center text-muted/60 md:flex md:self-center">
              <IconChevron className="h-6 w-6" />
            </span>

            {/* Step 02 — success (green) */}
            <Reveal from="up" delay={100}>
              <div className={`flex h-full flex-col rounded-2xl p-6 shadow-md md:p-7 ${ROADMAP_TONE.success.bg}`}>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className={`font-display text-lg leading-snug md:text-xl ${ROADMAP_TONE.success.text}`}>
                    <span className="font-mono text-sm tracking-widest">02.</span> Montée en
                    compétence &amp; bootcamp de posture
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ROADMAP_TONE.success.badge}`}
                  >
                    <IconBrainGear className="h-6 w-6" />
                  </span>
                </div>
                <ul className={`space-y-3 text-sm leading-relaxed ${ROADMAP_TONE.success.sub}`}>
                  <li>
                    <strong className={ROADMAP_TONE.success.text}>Action :</strong>{' '}
                    Orientation vers le Programme FOL ou nos modules intensifs
                    d&apos;académie.
                  </li>
                  <li>
                    <strong className={ROADMAP_TONE.success.text}>Focus :</strong>
                    <ul className="mt-2 space-y-2 pl-4">
                      <li className="list-disc marker:text-background/50">
                        <strong className={ROADMAP_TONE.success.text}>
                          Excellence Linguistique :
                        </strong>{' '}
                        Maîtrise des nuances, correction phonétique et syntaxique.
                      </li>
                      <li className="list-disc marker:text-background/50">
                        <strong className={ROADMAP_TONE.success.text}>
                          Posture Professionnelle &amp; Soft Skills :
                        </strong>{' '}
                        Assurance à l&apos;oral, gestion des objections client, rigueur
                        B2B et culture d&apos;entreprise.
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </Reveal>

            <span aria-hidden="true" className="hidden items-center justify-center text-muted/60 md:flex md:self-center">
              <IconChevron className="h-6 w-6" />
            </span>

            {/* Step 03 — accent (gold) */}
            <Reveal from="up" delay={200}>
              <div className={`flex h-full flex-col rounded-2xl p-6 shadow-md md:p-7 ${ROADMAP_TONE.accent.bg}`}>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className={`font-display text-lg leading-snug md:text-xl ${ROADMAP_TONE.accent.text}`}>
                    <span className="font-mono text-sm tracking-widest">03.</span>{' '}
                    Certification C1/C2 &amp; placement en production
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ROADMAP_TONE.accent.badge}`}
                  >
                    <IconGraduationCap className="h-6 w-6" />
                  </span>
                </div>
                <p className={`mb-4 text-sm leading-relaxed ${ROADMAP_TONE.accent.sub}`}>
                  Niveau visé : C1 à C2 Certifié (Validation par examens officiels)
                </p>
                <ul className={`space-y-3 text-sm leading-relaxed ${ROADMAP_TONE.accent.sub}`}>
                  <li>
                    <strong className={ROADMAP_TONE.accent.text}>Déploiement :</strong>{' '}
                    Intégration immédiate dans des lots d&apos;agents dédiés.
                  </li>
                  <li>
                    <strong className={ROADMAP_TONE.accent.text}>Garantie B2B :</strong>{' '}
                    Talents immédiatement opérationnels, zéro temps de rodage perdu pour
                    le client.
                  </li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Notre vision — the site's two tunnels (01-reference.png):     */}
      {/* dark banner, iconed column headers, a dashed connector down   */}
      {/* to a central handshake badge, folded-corner cards per column, */}
      {/* closing statement.                                            */}
      {/* ============================================================ */}
      <section id="vision" className="relative overflow-hidden bg-background">
        <ActWatermark level="02" side="right" />

        {/* Dark navy banner/seal — adapted from the reference's scalloped */}
        {/* dome as a rounded-bottom panel, since a clean semicircle clip- */}
        {/* path would clip the heading's descenders at small widths.      */}
        <div className="relative z-10 flex justify-center px-4 pt-14 md:pt-20">
          <div className="relative w-full max-w-xl overflow-hidden rounded-b-[2.5rem] bg-primary px-8 py-8 text-center shadow-lg shadow-primary/25 md:rounded-b-[4rem] md:px-16 md:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: GRAIN_URI }}
            />
            <Reveal>
              <p className="relative font-display text-2xl font-semibold uppercase tracking-wide text-background md:text-4xl">
                Notre vision
              </p>
              <p className="relative mt-2 font-mono text-[11px] uppercase tracking-widest text-accent md:text-sm">
                Un pont entre deux ambitions
              </p>
            </Reveal>
          </div>
        </div>

        <div className="relative mx-auto max-w-3xl px-4 pb-12 pt-8 text-center md:pb-16 md:pt-10">
          <Reveal>
            <p className="mb-3 text-muted">
              Notre seul et unique objectif, c&apos;est l&apos;impact : permettre à tout un
              chacun de choisir sa trajectoire de vie et de concrétiser ses rêves.
            </p>
            <p className="text-muted">
              C&apos;est pour cela qu&apos;e-Staf est avant tout un espace d&apos;émancipation
              et de révélation du potentiel humain. Au-delà de l&apos;externalisation, nous
              bâtissons un pont solide entre deux ambitions :
            </p>
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-16 md:pb-20">
          {/* Center connector — dashed cross with a handshake badge at the */}
          {/* intersection, echoing the reference's crosshair. Desktop only. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-6 z-0 hidden -translate-x-1/2 md:block"
          >
            <span className="absolute left-1/2 top-0 h-24 -translate-x-1/2 border-l-2 border-dashed border-muted/30" />
            <span className="absolute left-1/2 top-12 w-40 -translate-x-1/2 border-t-2 border-dashed border-muted/30" />
            <span className="absolute left-1/2 top-12 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-md ring-1 ring-accent/40">
              <IconHandshake className="h-6 w-6" />
            </span>
          </div>

          <div className="relative z-10 grid gap-14 md:grid-cols-2 md:gap-16">
            {/* Talents column */}
            <Reveal from="left">
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <IconDove className="h-9 w-9 text-success" />
                <h3 className="mt-3 font-display text-2xl leading-snug text-ink md:text-3xl">
                  Du côté des <span className="text-success">Talents</span>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                  Nous portons des accompagnements sur-mesure pour révéler le meilleur de
                  chacun, en toute autonomie :
                </p>
                <div className="mt-4 w-full max-w-md border-l-4 border-accent bg-white p-4 text-left">
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
                <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                  N&apos;ayez aucune crainte : chez e-Staf, nous valorisons l&apos;humain
                  avant tout. Si vous craignez d&apos;échouer au test, nous sommes là pour
                  vous rattraper, vous former et vous hisser vers l&apos;excellence — votre
                  potentiel mérite qu&apos;on l&apos;accompagne.
                </p>

                <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                  {TALENT_CARDS.map((card) => (
                    <FoldCard key={card.title} tone="success" icon={card.icon} title={card.title} description="" compact />
                  ))}
                </div>

                <div className="mt-8">
                  <Button href="/offres/carrieres" variant="primary">
                    Créer un compte
                  </Button>
                </div>
              </div>
            </Reveal>

            {/* Entreprises column */}
            <Reveal from="right" delay={100}>
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <IconGearDuo className="h-9 w-9 text-primary" />
                <h3 className="mt-3 font-display text-2xl leading-snug text-ink md:text-3xl">
                  Du côté des <span className="text-primary">Entreprises</span>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                  Nous offrons un prolongement naturel à cette exigence humaine. En vous
                  garantissant des profils formés, et managés avec rigueur, des
                  infrastructures sécurisées pour vous permettre de grandir en toute
                  confiance, en sachant que chaque collaborateur qui vous rejoint est un
                  talent pleinement épanoui et prêt à donner le meilleur de lui-même.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                  Confier vos activités n&apos;est pas un jeu. Pour vous offrir une
                  tranquillité totale, nous vous donnons accès, une semaine avant la
                  signature du contrat, à des capsules vidéo exclusives de présentation des
                  profils sélectionnés pour vous. Vous savez exactement qui vous intégrez.
                </p>

                <div className="mt-8 grid w-full max-w-sm grid-cols-1 gap-4 sm:grid-cols-2">
                  {ENTREPRISE_CARDS.map((card) => (
                    <FoldCard key={card.title} tone="primary" icon={card.icon} title={card.title} description="" compact />
                  ))}
                </div>

                <div className="mt-8">
                  <Button href="/entreprises" variant="accent">
                    Nous contacter pour un projet d&apos;externalisation
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="relative mx-auto max-w-2xl px-4 pb-14 text-center md:pb-20">
          <Reveal>
            <p className="font-display text-xl leading-snug text-ink md:text-2xl">
              Ici, chaque parcours compte. Chaque ambition valorisée et chaque talent
              accompagné.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
              Nous sommes là pour grandir ensemble, sans compromis et avec le cœur.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Quelques repères — concrete facts, no invented numbers        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <Reveal>
            <ActKicker>Concret, pas des promesses</ActKicker>
            <h2 className="mb-10 text-3xl md:text-5xl">
              <SplitWords text="Quelques repères" />
            </h2>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 divide-x divide-y divide-muted/30 border-y border-muted/30 md:grid-cols-4 md:divide-y-0">
              {(
                [
                  ['Déploiement', 'Lots de 10 agents'],
                  ['FOL', "Cursus d'élite, 6 mois"],
                  ['Académie', '17 jours de formation intensive'],
                  ['Garantie', 'Zéro turnover, remplacement immédiat'],
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
      {/* Ils en parlent — one light proof point per audience          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <Reveal>
            <ActKicker>Deux voix, un même résultat</ActKicker>
            <h2 className="mb-10 text-3xl md:text-5xl">
              <SplitWords text="Ils en parlent" />
            </h2>
          </Reveal>
          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            <Reveal from="left">
              <QuoteBlock
                quote="On nous a apporté un profil qualifié en dix jours, formé et prêt à prendre des appels."
                person={{ firstname: 'Nathalie' }}
                result="apporteuse d'affaires"
              />
              <Link
                href="/entreprises"
                className="group mt-4 inline-flex items-center text-sm font-medium text-primary"
              >
                <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:content-[''] group-hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline">
                  Voir l&apos;espace entreprises
                </span>
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </Reveal>
            <Reveal from="right" delay={100}>
              <QuoteBlock
                quote="J'ai raté le niveau pour la production, on m'a proposé l'académie au lieu de me dire non."
                person={{ firstname: 'Tovo' }}
                result="apprenant, préparation DELF B1"
              />
              <Link
                href="/offres/carrieres"
                className="group mt-4 inline-flex items-center text-sm font-medium text-primary"
              >
                <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-primary after:content-[''] group-hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline">
                  Voir l&apos;espace talents & candidats
                </span>
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  )
}
