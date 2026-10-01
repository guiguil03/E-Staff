import Reveal from "@/components/Reveal";
import MediaWall from "./MediaWall";
import TestimonialsSection from "./TestimonialsSection";

// Page Communauté (« Découvrir nos talents ») — mise en pause le
// 2026-09-26 (demande cliente) : /communaute redirige vers « Ma carrière »
// (/offres/carrieres) le temps d'avoir plus de volume. Pour la rétablir,
// rendre ce composant dans app/communaute/page.tsx et remettre le lien du
// menu (components/Header.tsx).
export default function CommunautePage() {
  return (
    <div className="bg-obsidian">
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Vitrine des Talents &amp; Communauté
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Découvrir nos talents
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-white/60 sm:text-lg">
              Plongez au cœur de nos performances, découvrez nos leaders et partagez
              l&apos;énergie de notre communauté.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-accent/15 px-4 pb-20 pt-4 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-10">
          <MediaWall />
          <div className="lg:border-l lg:border-accent/15 lg:pl-10">
            <TestimonialsSection />
          </div>
        </div>
      </section>
    </div>
  );
}
