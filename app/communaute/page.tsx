import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import MediaWall from "@/components/communaute/MediaWall";
import TestimonialsSection from "@/components/communaute/TestimonialsSection";

export const metadata: Metadata = {
  title: "Découvrir nos talents — e-Staf",
  description:
    "Plongez au cœur de nos performances, découvrez nos leaders et partagez l'énergie de notre communauté e-Staf.",
};

// /communaute — the "Découvrir nos talents" community/gallery page,
// rendered in the dark/elite visual universe (near-black + gold), matching
// /offres/fol and /offres/carrieres per the client's reference mockup.
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
