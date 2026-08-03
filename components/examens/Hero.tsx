import Reveal from "@/components/Reveal";

// Opening pitch for /offres/examens — was missing entirely before (the page
// used to dive straight into a paragraph with no title), which read as
// unfinished next to the Hero pattern used on /entreprises and /offres/fol.
export default function Hero() {
  return (
    <section className="bg-obsidian px-4 pb-4 pt-20 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Certifications officielles
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-6 font-display text-3xl font-semibold italic leading-tight text-white sm:text-4xl md:text-5xl">
            « Un diplôme qui ouvre des{" "}
            <span className="text-accent">frontières</span>. »
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base text-white/80 sm:text-lg">
            Chez e-Staf, nous ne vous préparons pas seulement à réussir un
            examen&nbsp;: nous vous armons pour exceller. Choisissez votre
            certification, franchissez le cap et laissez votre talent
            s&apos;exprimer sans limites.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
