import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { QuoteBlock } from '@/components/ui/QuoteBlock'
import { LanguageRibbon } from '@/components/LanguageRibbon'
import { ContactForm } from '@/components/ContactForm'
import { Reveal } from '@/components/Reveal'
import { MarqueeBand } from '@/components/MarqueeBand'
import { GateSchema, SealSchema, EnvelopeSchema } from '@/components/Schemas'
import {
  ActKicker,
  ActWatermark,
  CatalogueRow,
  ChapterBreak,
  GRAIN_URI,
  HeroPreviewCard,
  SplitWords,
  StatusBadge,
  TrustStrip,
} from '@/components/PageBits'

export const metadata: Metadata = {
  title: 'Candidater chez e-Staf — Talents & carrières, Madagascar',
  description:
    "Passez le test de sélection, certifiez votre niveau C1 par les examens officiels et accédez aux missions et grands comptes d'e-Staf. Aucun candidat motivé n'est laissé sans option.",
}

// Trust strip: candidate-relevant proof, distinct from the home page's more
// general set and from the partner page's set.
const TRUST_ITEMS = [
  'Sélection sur test réel',
  'Niveau C1 certifié par examens officiels',
  'Formation continue en poste',
  '17 jours de formation intensive',
  "Aucun candidat n'est perdu",
  '5 métiers recherchés',
] as const

const PARCOURS = [
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

const CATALOGUE = [
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
] as const

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
] as const

const FAQ = [
  {
    q: 'Que se passe-t-il si mon niveau est insuffisant pour la production ?',
    a: "Vous n'êtes pas refusé sans suite : vous êtes orienté vers l'académie pour renforcer votre niveau de langue. Une fois le niveau requis atteint, vous redevenez éligible à un placement en production.",
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

export default function CarrieresPage() {
  return (
    <main>
      {/* ============================================================ */}
      {/* OPENER — dark editorial banner, floating candidate proof cards */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-primary">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: GRAIN_URI }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 lg:pr-72 xl:pr-80">
          <div className="pointer-events-none absolute right-4 top-8 z-20 hidden w-64 flex-col gap-5 lg:flex xl:right-8 xl:w-72">
            <div className="pointer-events-auto">
              <HeroPreviewCard
                kicker="Condition d'accès"
                bar="accent"
                title="Niveau C1 certifié"
                meta="Examens officiels — jamais auto-déclaré"
                badge={<StatusBadge>Test de sélection obligatoire</StatusBadge>}
              />
            </div>
            <div className="pointer-events-auto">
              <HeroPreviewCard
                kicker="Formation accélérée"
                bar="success"
                title="17 jours"
                meta="Formation intensive avant la prise de poste"
                badge={<StatusBadge available>Parcours vérifié — Fara</StatusBadge>}
              />
            </div>
          </div>

          <p className="mb-6 font-mono text-xs uppercase tracking-widest text-background/60">
            e-Staf — Espace talents & candidats
          </p>
          <h1 className="mb-6 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-background md:text-6xl">
            <SplitWords text="Votre carrière de rêve en quelques clics." />
          </h1>
          <p className="mb-8 max-w-xl text-sm leading-relaxed text-background/80 md:text-base">
            On recrute des agents formés pour des clients internationaux. La sélection se
            fait sur le niveau de langue réel, pas sur le diplôme affiché. Si vous êtes déjà
            à l&apos;aise à l&apos;oral, ou prêt à vous former, déposez votre candidature.
          </p>
          <div className="mb-8 max-w-xl border-l-4 border-accent bg-background/10 p-4">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-background/60">
              Condition d&apos;accès
            </p>
            <p className="font-mono text-xs leading-relaxed text-background/90">
              L&apos;accès à nos missions et à nos grands comptes est réservé aux talents
              validant le niveau C1 après notre test de sélection — un niveau certifié par
              la réussite réelle des examens officiels, jamais auto-déclaré. Si vous
              n&apos;y êtes pas encore, l&apos;académie vous fait monter jusque-là.
            </p>
          </div>
          <Button href="#contact" variant="accent">
            Passer le test & rejoindre e-Staf
          </Button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* Trust strip — candidate-relevant proof at the opener-to-body seam */}
      {/* ============================================================ */}
      <TrustStrip items={TRUST_ITEMS} />

      {/* ============================================================ */}
      {/* Parcours candidat                                            */}
      {/* ============================================================ */}
      <section id="parcours" className="relative overflow-hidden bg-background">
        <ActWatermark level="01" side="right" />
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 md:pb-20 md:pt-16">
          <Reveal>
            <ActKicker>Votre ascension commence ici</ActKicker>
            <h2 className="mb-6 text-3xl md:text-5xl">Parcours candidat</h2>
            <div className="mb-10 max-w-md">
              <LanguageRibbon variant="static" />
            </div>
          </Reveal>
          <ol className="mb-10 grid gap-12 md:grid-cols-3 md:gap-8">
            {PARCOURS.map(([index, title, body], i) => (
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
                      <span aria-hidden="true" className="hidden flex-1 items-center gap-2 md:flex">
                        <span className="h-px flex-1 bg-primary/25" />
                        {i === 1 && <GateSchema className="h-11 w-[4.5rem] shrink-0 text-primary" />}
                        <span className="h-px w-5 bg-primary/25" />
                        <svg viewBox="0 0 8 10" className="h-2.5 w-2 shrink-0 text-primary/50" fill="currentColor" aria-hidden="true">
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

          {/* "Aucun candidat n'est perdu" callout */}
          <Reveal>
            <div className="relative border-l-4 border-success py-1 pl-6 md:pl-8">
              <span
                aria-hidden="true"
                className="glow-once pointer-events-none absolute -inset-4 rounded bg-accent/20 opacity-0 blur-xl"
              />
              <div className="relative">
                <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                  Aucun candidat n&apos;est perdu
                </p>
                <p className="max-w-2xl font-display text-base text-ink md:text-lg">
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
      {/* Catalogue des programmes — compact summary                   */}
      {/* ============================================================ */}
      <section id="catalogue" className="relative overflow-x-clip bg-white">
        <ChapterBreak />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-12 md:pb-20 md:pt-16">
          <div className="mb-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-12">
            <Reveal>
              <p className="mb-3 font-display text-lg italic text-muted">Académie — Formations</p>
              <h2 className="mb-5 text-4xl md:text-6xl">Catalogue des programmes</h2>
              <p className="max-w-2xl text-muted">
                Des préparations pour celles et ceux qui poursuivent leurs propres objectifs —
                immigration, carrière, diplôme — et un programme phare pour les leaders. Nos
                futurs agents passent les mêmes examens officiels pour certifier leur niveau.
              </p>
            </Reveal>
            <Reveal from="right" delay={150} className="relative z-10 md:-mt-24">
              <SealSchema className="mx-auto w-28 -rotate-6 text-primary md:w-32" />
            </Reveal>
          </div>
          <div className="flex flex-col divide-y divide-muted/30 border-t border-muted/30">
            {CATALOGUE.map((offre, i) => (
              <Reveal key={offre.href} delay={i * 100}>
                <CatalogueRow {...offre} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee band — the exams the académie prepares */}
      <MarqueeBand items={['DELF / DALF', 'TEF Canada / TCF', 'DFP', 'Programme FOL']} variant="accent" />

      {/* ============================================================ */}
      {/* Parcours vérifiés — Fara + avis candidats                    */}
      {/* ============================================================ */}
      <section id="confiance" className="relative overflow-hidden bg-background">
        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-20">
          <Reveal>
            <p className="mb-2 font-display text-lg italic text-muted">La preuve par l&apos;exemple</p>
            <h2 className="mb-10 text-3xl md:text-5xl">Parcours vérifiés</h2>
          </Reveal>

          {/* Fara's verified-journey certificate. */}
          <div className="mb-14 md:max-w-xl">
            <Reveal from="right">
              <div className="relative rotate-0 rounded bg-primary p-6 md:-rotate-2 md:p-8">
                <div
                  className="absolute right-4 top-4 flex h-12 w-12 rotate-6 items-center justify-center rounded-full border-2 border-success bg-background/10 md:right-5 md:top-5 md:h-14 md:w-14"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-success md:h-7 md:w-7" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="pr-14 md:pr-16">
                  <p className="font-mono text-xs uppercase tracking-wide text-background/60">Parcours vérifié</p>
                  <p className="mt-1 font-display text-xl text-background">Fara</p>
                </div>
                <div className="mt-8">
                  <p className="mb-1 font-mono text-xs uppercase tracking-wide text-background/60">Niveau atteint</p>
                  <p className="mb-4 font-display text-3xl text-accent md:text-4xl">B2</p>
                  <LanguageRibbon variant="static" reachedLevel="B2" />
                </div>
                <div className="my-6 border-t border-dashed border-background/30" />
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-success" aria-hidden="true" />
                    <p className="text-sm text-background/90">En poste — support client international</p>
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
      <section id="faq" className="relative overflow-hidden bg-white">
        <ChapterBreak />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-16 select-none font-display text-[9rem] italic leading-none text-primary/5 md:right-16 md:text-[17rem]"
        >
          ?
        </span>
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-8 md:pb-20 md:pt-10">
          <Reveal>
            <p className="mb-2 font-display text-lg italic text-muted">Avant de vous lancer</p>
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
            <Reveal delay={FAQ.length * 100}>
              <div className="group">
                <h3 className="mb-2 text-xl">
                  <span className="mr-2 font-mono text-sm text-accent">Q0{FAQ.length + 1}</span>
                  <span className="faq-underline">
                    Combien de temps dure la formation avant un placement en production ?
                  </span>
                </h3>
                <p className="text-sm text-muted">
                  Ça dépend du niveau de départ, mais ça peut aller vite : Fara, par exemple,
                  a rejoint un poste de support client international après 17 jours de
                  formation intensive (
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
      {/* Contact — passer le test & candidater                       */}
      {/* ============================================================ */}
      <section id="contact" className="relative overflow-hidden bg-background">
        <ChapterBreak />
        <div className="relative mx-auto max-w-2xl px-4 pb-20 pt-10 md:pb-28 md:pt-14">
          <Reveal>
            <p className="mb-4">
              <span className="inline-block bg-primary px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-background">
                Candidater
              </span>
            </p>
            <h2 className="mb-4 text-3xl md:text-5xl">Passer le test & rejoindre e-Staf</h2>
            <p className="mb-8 text-sm text-muted">
              Le test de sélection en ligne ouvre bientôt directement sur ce site. En attendant,
              contactez-nous pour passer le test et faire votre inscription.
            </p>
          </Reveal>
          <Reveal>
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
                <ContactForm defaultSubject="Passer le test & rejoindre e-Staf" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
