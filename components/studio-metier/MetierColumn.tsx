import Reveal from "@/components/Reveal";
import MetierRow from "@/components/studio-metier/MetierRow";
import type { Metier } from "@/components/studio-metier/data";

interface MetierColumnProps {
  title: string;
  intro: string;
  metiers: Metier[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  delayBase?: number;
  /** Offres ouvertes par slug de métier. */
  offresOuvertesParMetier?: Record<string, number>;
}

export default function MetierColumn({
  title,
  intro,
  metiers,
  selectedSlug,
  onSelect,
  delayBase = 0,
  offresOuvertesParMetier = {},
}: MetierColumnProps) {
  return (
    <div>
      <Reveal delay={delayBase}>
        <h3 className="text-center font-display text-lg font-bold uppercase tracking-wide text-accent sm:text-xl">
          {title}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-center font-sans text-sm leading-relaxed text-white/70">
          {intro}
        </p>
      </Reveal>

      <div className="mt-6 space-y-4">
        {metiers.map((metier, index) => (
          <Reveal key={metier.slug} delay={delayBase + 80 + index * 40}>
            <MetierRow
              metier={metier}
              selected={selectedSlug === metier.slug}
              onSelect={onSelect}
              nbOffresOuvertes={offresOuvertesParMetier[metier.slug] ?? 0}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
