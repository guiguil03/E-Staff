import type { Metadata } from 'next'
import { PerformanceWall } from '@/components/PerformanceWall'
import { TestimonialSection } from '@/components/TestimonialSection'
import { Reveal } from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'La Vitrine des Talents & Communauté e-Staf',
  description:
    "Plongez au cœur de nos performances, découvrez nos leaders et partagez l'énergie de notre communauté e-Staf.",
}

export default function CommunautePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <Reveal>
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
          Communauté e-Staf
        </p>
        <h1 className="mb-4 text-3xl md:text-5xl">
          La Vitrine des Talents &amp; Communauté e-Staf
        </h1>
        <p className="mb-12 max-w-2xl text-muted">
          Plongez au cœur de nos performances, découvrez nos leaders et partagez
          l&apos;énergie de notre communauté.
        </p>
      </Reveal>

      {/* ============================================================ */}
      {/* Le Mur des Performances & Médias                              */}
      {/* ============================================================ */}
      <section id="mur" className="mb-16 border-t border-muted/30 pt-10">
        <Reveal>
          <h2 className="mb-2 text-2xl md:text-3xl">Le Mur des Performances &amp; Médias</h2>
          <p className="mb-6 text-sm text-muted">
            Photos et vidéos de l&apos;équipe, moments forts des campagnes, portraits des
            leaders et des professeurs.
          </p>
        </Reveal>
        <PerformanceWall />
      </section>

      {/* ============================================================ */}
      {/* L'Espace Avis & Témoignages                                   */}
      {/* ============================================================ */}
      <section id="avis" className="border-t border-muted/30 pt-10">
        <Reveal>
          <h2 className="mb-2 text-2xl md:text-3xl">L&apos;Espace Avis &amp; Témoignages</h2>
          <p className="mb-6 max-w-xl text-sm text-muted">
            Votre voix compte. Exprimez-vous en toute transparence sur votre expérience
            e-Staf.
          </p>
        </Reveal>
        <div className="max-w-xl rounded-2xl border border-muted/15 bg-white p-6 shadow-sm">
          <TestimonialSection />
        </div>
      </section>
    </main>
  )
}
