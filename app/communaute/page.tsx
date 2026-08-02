import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import MediaWall from "@/components/communaute/MediaWall";
import TestimonialsSection from "@/components/communaute/TestimonialsSection";

export const metadata: Metadata = {
  title: "La Vitrine des Talents & Communauté — e-Staf",
  description:
    "Plongez au cœur de nos performances, découvrez nos leaders et partagez l'énergie de notre communauté e-Staf.",
};

export default function CommunautePage() {
  return (
    <>
      <section className="bg-background px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              Vitrine des Talents &amp; Communauté
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-primary sm:text-4xl">
              La Vitrine des Talents &amp; Communauté e-Staf
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl font-sans text-base text-muted sm:text-lg">
              Plongez au cœur de nos performances, découvrez nos leaders et partagez
              l&apos;énergie de notre communauté.
            </p>
          </Reveal>
        </div>
      </section>

      <MediaWall />
      <TestimonialsSection />
    </>
  );
}
