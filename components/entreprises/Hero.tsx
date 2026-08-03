import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";

// Opening pitch for the B2B deep-dive page — dark/elite universe, matching
// the convention established on /offres/fol. The two Contact & Partenariats
// CTAs live directly in the hero (not a separate section below it) so they
// read as the hero's own call-to-action rather than an interruption between
// the pitch and the rest of the page (client's instruction, 2026-08-04).
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

        <Reveal delay={300}>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button variant="dark" href="/entreprises/proposer-un-projet">
              Proposer un projet d&apos;externalisation
            </Button>
            <Button variant="ghostDark" href="/entreprises/devenir-connecteur">
              Devenir Connecteur e-Staf
            </Button>
          </div>
          <p className="mx-auto mt-4 max-w-xl font-sans text-sm text-white/50">
            Un lot à réserver, une mission ponctuelle ou simplement une
            question&nbsp;: laissez-nous vos coordonnées, un membre de
            l&apos;équipe e-Staf revient vers vous rapidement.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
