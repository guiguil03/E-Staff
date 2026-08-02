import type { ReactNode } from "react";

interface PromiseCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

// A single card in the "Promesses d'e-Staf" panel — gold-circled icon on the
// navy full-bleed band, white title, muted white body.
export default function PromiseCard({ icon, title, description }: PromiseCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded border border-white/10 bg-white/5 p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent text-accent">
        <div className="h-6 w-6">{icon}</div>
      </div>
      <div>
        <h3 className="font-display text-base font-bold leading-snug text-white">
          {title}
        </h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
}
