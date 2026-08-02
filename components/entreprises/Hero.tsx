import Reveal from "@/components/Reveal";

// Opening pitch for the B2B deep-dive page — light universe, reached from the
// "Découvrir nos offres B2B" homepage link.
export default function Hero() {
  return (
    <section className="bg-background px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-teal">
            Espace Entreprises (B2B)
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="mt-6 font-display text-3xl font-semibold italic leading-tight text-primary sm:text-4xl md:text-5xl">
            « Des agents qualifiés au service de vos ambitions. »
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-6 max-w-2xl font-sans text-base text-ink sm:text-lg">
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
