import Reveal from "@/components/Reveal";
import PillarCard from "@/components/fol/PillarCard";
import {
  WandIcon,
  CrownIcon,
  ScaleIcon,
  BoltIcon,
  PersonSuitIcon,
} from "@/components/fol/PillarIcons";

const PILLARS = [
  {
    icon: <WandIcon className="h-full w-full" />,
    title: "Présenter avec charisme",
    description:
      "Captiver instantanément l'audience et habiter l'espace avec impact.",
  },
  {
    icon: <CrownIcon className="h-full w-full" />,
    title: "Diriger avec autorité",
    description:
      "Asseoir son leadership par le ton, le rythme et la présence non-verbale.",
  },
  {
    icon: <ScaleIcon className="h-full w-full" />,
    title: "Négocier avec élégance",
    description:
      "Désamorcer les tensions et convaincre par la justesse de l'intonation.",
  },
  {
    icon: <BoltIcon className="h-full w-full" />,
    title: "Répondre avec brio",
    description:
      "Maîtriser la répartie immédiate face aux questions complexes.",
  },
  {
    icon: <PersonSuitIcon className="h-full w-full" />,
    title: "Incarner la posture PDG",
    description:
      "Adopter les codes de communication de la direction générale.",
  },
];

// The 5-pillar strategic panel — matches 04-reference.png: gold caps title
// left-aligned, discreet "02 / STRUCTURE" label right-aligned, thin gold
// rule, then 5 equal-width cards in a single row (stacked on mobile).
export default function PillarsPanel() {
  return (
    <section className="bg-obsidian px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="flex flex-col gap-4 border-b border-accent/50 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-accent sm:text-4xl">
              Les Piliers Stratégiques
            </h2>
            <p className="font-mono text-xs tracking-[0.2em] text-white/40">
              02 / STRUCTURE
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {PILLARS.map((pillar) => (
              <PillarCard key={pillar.title} {...pillar} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
