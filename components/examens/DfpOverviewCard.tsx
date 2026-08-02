"use client";

const TRACKS = [
  "DFP Affaires — Le Standard des Dirigeants & Commerciaux",
  "DFP Relations Internationales — Diplomatie & Géopolitique",
  "DFP Tourisme, Hôtellerie & Restauration — L'Excellence de l'Accueil",
  "DFP Santé — Le Professionnalisme Médical",
];

interface DfpOverviewCardProps {
  targetId: string;
  className?: string;
}

// Summary card for the top 3-card row: DFP genuinely has 4 distinct dated
// cohorts, so rather than cramming them into one card, this gives a teaser
// and scrolls down to the dedicated subsection with the 4 detailed rows.
export default function DfpOverviewCard({ targetId, className = "" }: DfpOverviewCardProps) {
  function scrollToDetail() {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className={`flex flex-col rounded border border-primary/10 bg-white p-6 shadow-sm ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-background font-mono text-sm font-bold tracking-wide text-primary"
        >
          DFP
        </span>
        <div>
          <h3 className="font-display text-xl font-bold text-primary">
            Diplômes de Français Professionnel
          </h3>
          <p className="mt-1 font-sans text-sm italic text-muted">
            Prouvez que vous dominez les codes de votre secteur
          </p>
        </div>
      </div>

      <p className="mt-5 font-sans text-sm text-ink">
        Ne dites plus simplement que vous parlez français : prouvez que vous
        dominez les rouages, le jargon et les codes de votre secteur
        d&apos;activité au niveau international.
      </p>

      <ul className="mt-5 space-y-2 font-sans text-sm text-ink">
        {TRACKS.map((track) => (
          <li key={track} className="flex gap-2">
            <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{track}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={scrollToDetail}
        className="mt-6 inline-flex items-center justify-center gap-2 self-start rounded border border-primary bg-transparent px-6 py-3 font-sans text-sm font-medium tracking-wide text-primary transition-colors duration-150 hover:bg-primary hover:text-white"
      >
        Voir les 4 parcours DFP en détail ↓
      </button>
    </div>
  );
}
