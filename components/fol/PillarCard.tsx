import type { ReactNode } from "react";

interface PillarCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

// A single card in the "Piliers Stratégiques" panel — gold-circled icon,
// gold caps title, muted white body. Matches 04-reference.png.
export default function PillarCard({ icon, title, description }: PillarCardProps) {
  return (
    <div className="flex flex-col items-center rounded border border-white/5 bg-obsidianCard p-6 text-center sm:p-7">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-accent text-accent">
        <div className="h-6 w-6">{icon}</div>
      </div>
      <h3 className="mt-5 font-display text-base font-bold uppercase leading-snug text-accent">
        {title}
      </h3>
      <p className="mt-3 font-sans text-sm leading-relaxed text-white/60">
        {description}
      </p>
    </div>
  );
}
