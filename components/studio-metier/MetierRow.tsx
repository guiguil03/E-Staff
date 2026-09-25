"use client";

import type { Metier } from "@/components/studio-metier/data";

interface MetierRowProps {
  metier: Metier;
  selected: boolean;
  onSelect: (slug: string) => void;
  /** Nombre d'offres d'emploi ouvertes pour ce métier (vitrine). */
  nbOffresOuvertes?: number;
}

// "Podium button" — a raised/beveled dark navy row: a lighter top-left edge
// and a subtle inner highlight simulate a 3D button face on the obsidian
// background, per the client reference (05-reference.png).
export default function MetierRow({ metier, selected, onSelect, nbOffresOuvertes = 0 }: MetierRowProps) {
  const Icon = metier.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(metier.slug)}
      aria-pressed={selected}
      className={`group flex w-full items-start gap-4 rounded-lg border bg-[linear-gradient(180deg,#1c2542_0%,#131a2a_100%)] px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_6px_14px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        selected
          ? "border-accent shadow-[0_0_0_1px_rgba(184,151,62,0.65),0_10px_24px_rgba(184,151,62,0.18)]"
          : "border-white/10"
      }`}
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-obsidian text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-bold text-accent sm:text-lg">{metier.title}</span>
          {nbOffresOuvertes > 0 && (
            <span className="rounded-full border border-statusGreen/40 bg-statusGreen/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-statusGreen">
              {nbOffresOuvertes} offre{nbOffresOuvertes > 1 ? "s" : ""} ouverte{nbOffresOuvertes > 1 ? "s" : ""}
            </span>
          )}
        </span>
        <span className="mt-1 block font-sans text-sm leading-relaxed text-white/70">
          {metier.description}
        </span>
      </span>
    </button>
  );
}
