interface FunnelStepsProps {
  steps: string[];
}

// Entonnoir de sélection horizontal (5 étapes pour le Bootcamp Intensif) —
// pastilles reliées par des flèches, empilées verticalement sur mobile.
// Volontairement plus compact que fol/StepCard.tsx (3 étapes en pleines
// cartes) car 5 étapes en cartes complètes ne tiendraient pas sur une ligne.
export default function FunnelSteps({ steps }: FunnelStepsProps) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-1 items-center gap-2 sm:gap-0">
          <div className="flex-1 rounded border border-accent/40 bg-obsidian px-3 py-2.5 text-center font-mono text-[11px] uppercase tracking-wide text-white/80 sm:text-xs">
            {step}
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="shrink-0 px-1 font-display text-lg text-accent/50 sm:px-2">
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
