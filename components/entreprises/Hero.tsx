import Reveal from "@/components/Reveal";

// Opening pitch for the B2B deep-dive page — dark/elite universe, matching
// the convention established on /offres/fol.
export default function Hero() {
  return (
    <section className="bg-obsidian px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Espace Entreprises (B2B)
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-6 font-display text-3xl font-semibold italic leading-tight text-white sm:text-4xl md:text-5xl">
            « Des agents qualifiés au service de vos{" "}
            <span className="text-accent">ambitions</span>. »
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base text-white/80 sm:text-lg">
            Fini les craintes liées aux infrastructures, au turnover et aux
            manques de qualification. Adieu les casse-tête du recrutement et
            les coupures imprécises. Chez e-Staf, nous vous offrons une
            solution clé en main&nbsp;: un vivier de talents formés pour une
            maîtrise linguistique irréprochable, des locaux équipés et un
            encadrement managérial rigoureux. Un seul objectif&nbsp;:
            simplifier et sécuriser vos opérations d&apos;externalisation.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
