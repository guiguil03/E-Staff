import Reveal from "@/components/Reveal";

// "Le Cursus d'Élite (6 Mois)" — short framing paragraph between the
// pillars panel and the 3-step selection process.
export default function ProcessSection() {
  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40">
            03 / CURSUS
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-accent sm:text-3xl">
            Le Cursus d&apos;Élite (6 Mois)
          </h2>
          <p className="mt-5 font-sans text-base leading-relaxed text-white/60 sm:text-lg">
            Maîtrisez l&apos;art de négocier, brisez toutes les objections, imposez
            votre cadre et développez une prestance inébranlable.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
