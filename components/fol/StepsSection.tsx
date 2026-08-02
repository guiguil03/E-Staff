import Reveal from "@/components/Reveal";
import StepCard from "@/components/fol/StepCard";
import EntryCTA from "@/components/fol/EntryCTA";

const STEPS = [
  {
    number: "01",
    title: "Le Test d'Entrée",
    description: "Un premier filtre sans concession.",
  },
  {
    number: "02",
    title: "Le Camp de Présélection (6 Semaines)",
    description:
      "15 candidats jetés dans l'arène et poussés dans leurs derniers retranchements (posture, non-verbal, art de convaincre).",
  },
  {
    number: "03",
    title: "Le Verdict (Le Top 5)",
    description:
      "Seulement 5 élus sur 15 décrochent leur place pour le grand cursus de métamorphose.",
  },
];

// "Le Parcours du Combattant" — 3 numbered steps, plus the two CTAs that
// reveal the shared RegistrationForm.
export default function StepsSection() {
  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.2em] text-white/40">
            04 / SÉLECTION
          </p>
          <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-accent sm:text-3xl">
            Le Parcours du Combattant
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-stretch">
            {STEPS.map((step) => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={200}>
          <EntryCTA />
        </Reveal>
      </div>
    </section>
  );
}
