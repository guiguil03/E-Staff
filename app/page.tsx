import Link from 'next/link'
import { type CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
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
                Passer le test & rejoindre e-Staf
              </Button>
            </div>

            <div className="mt-10 max-w-3xl md:mt-14">
              <HeroRibbon />
            </div>
          </div>

          {/* Message 2 — reassurance for talents */}
          <Reveal>
            <div className="mt-16 max-w-2xl border-t border-background/15 pt-10 md:mt-24">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">Aux talents</p>
              <p className="font-display text-xl leading-snug text-background md:text-2xl">
                N&apos;ayez aucune crainte. Chez e-Staf, nous valorisons l&apos;humain avant
                tout. Si vous craignez d&apos;échouer au test, nous sommes là pour vous
                rattraper, vous former et vous hisser vers l&apos;excellence. Votre potentiel
                mérite qu&apos;on l&apos;accompagne.
              </p>
              <Link
                href="/offres/carrieres"
                className="group mt-5 inline-flex items-center font-medium text-background"
              >
                <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-background after:content-[''] group-hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 motion-reduce:underline">
                  Passer le test & rejoindre e-Staf
                </span>
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </div>
          </Reveal>

          {/* Message 3 — reassurance for enterprises */}
          <Reveal>
            <div className="mt-14 max-w-2xl border-t border-background/15 pt-10">
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-accent">Aux entreprises</p>
              <p className="font-display text-xl leading-snug text-background md:text-2xl">
                Confier vos activités n&apos;est pas un jeu. Pour vous offrir une tranquillité
                totale, nous vous donnons accès, une semaine avant la signature du contrat, à
                des capsules vidéo exclusives de présentation des profils sélectionnés pour
                vous. Vous savez exactement qui vous intégrez.
              </p>
              <div className="mt-5">
                <Button href="/entreprises" variant="accent">
                  Nous contacter pour un projet d&apos;externalisation
                </Button>
              </div>
            </div>
          </Reveal>
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
      {/* Deux espaces — the site's two tunnels                        */}
      {/* ============================================================ */}
      <section id="espaces" className="relative overflow-hidden bg-background">
        <ActWatermark level="01" side="right" />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-16 md:pb-16 md:pt-24">
          <Reveal>
            <ActKicker>Deux portes d&apos;entrée</ActKicker>
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
    </main>
  )
}
