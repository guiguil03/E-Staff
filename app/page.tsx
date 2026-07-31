import Link from 'next/link'
import { type CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { Reveal } from '@/components/Reveal'
import { HeroRibbon } from '@/components/HeroRibbon'
import { HeroFX } from '@/components/HeroFX'
import { NetworkSchema, StaircaseSchema } from '@/components/Schemas'
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
      {/* Notre vision — the site's two tunnels                        */}
      {/* ============================================================ */}
      <section id="vision" className="relative overflow-hidden bg-background">
        <ActWatermark level="01" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-16 md:pb-16 md:pt-24">
          <Reveal>
            <ActKicker>Un pont entre deux ambitions</ActKicker>
            <h2 className="mb-4 text-3xl md:text-5xl">
              <SplitWords text="Notre vision" />
            </h2>
            <p className="mb-3 max-w-2xl text-muted">
              Notre seul et unique objectif, c&apos;est l&apos;impact : permettre à tout un
              chacun de choisir sa trajectoire de vie et de concrétiser ses rêves.
            </p>
            <p className="max-w-2xl text-muted">
              C&apos;est pour cela qu&apos;e-Staf est avant tout un espace d&apos;émancipation
              et de révélation du potentiel humain. Au-delà de l&apos;externalisation, nous
              bâtissons un pont solide entre deux ambitions :
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
                  Nous offrons un prolongement naturel à cette exigence humaine. En vous
                  garantissant des profils formés, et managés avec rigueur, des
                  infrastructures sécurisées pour vous permettre de grandir en toute
                  confiance, en sachant que chaque collaborateur qui vous rejoint est un
                  talent pleinement épanoui et prêt à donner le meilleur de lui-même.
                </p>
                <p className="mb-8 text-sm leading-relaxed text-background/80 md:text-base">
                  Confier vos activités n&apos;est pas un jeu. Pour vous offrir une
                  tranquillité totale, nous vous donnons accès, une semaine avant la signature
                  du contrat, à des capsules vidéo exclusives de présentation des profils
                  sélectionnés pour vous. Vous savez exactement qui vous intégrez.
                </p>
                <div className="mt-auto pt-2">
                  <Button href="/entreprises" variant="accent">
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
                  Nous portons des accompagnements sur-mesure pour révéler le meilleur de
                  chacun, en toute autonomie :
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
                <p className="mb-4 text-sm leading-relaxed text-muted md:text-base">
                  N&apos;ayez aucune crainte : chez e-Staf, nous valorisons l&apos;humain avant
                  tout. Si vous craignez d&apos;échouer au test, nous sommes là pour vous
                  rattraper, vous former et vous hisser vers l&apos;excellence — votre
                  potentiel mérite qu&apos;on l&apos;accompagne.
                </p>
                <p className="mb-8 text-sm leading-relaxed text-muted md:text-base">
                  Passez le test, faites votre inscription, et nous, on se chargera de vous
                  fournir votre courbe de progression en temps réel.
                </p>
                <div className="mt-auto pt-2">
                  <Button href="/offres/carrieres" variant="primary">
                    Créer un compte
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-2xl px-4 py-14 text-center md:py-20">
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
