import Reveal from "@/components/Reveal";
import type { CompetencyScore } from "./exampleData";

interface CompetencyBarsProps {
  title: string;
  subtitle?: string;
  competencies: CompetencyScore[];
  /** Affiche le pourcentage (score/20) à côté de la note — cumul par compétence. */
  showPercentage?: boolean;
}

// Barres de progression pour les 5 compétences (Compréhension Orale,
// Expression Orale, Compréhension Écrite, Expression Écrite, Posture &
// Éloquence) — cahier des charges Compte Apprenant.
export default function CompetencyBars({ title, subtitle, competencies, showPercentage }: CompetencyBarsProps) {
  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-1 font-sans text-xs text-white/50">{subtitle}</p>}
        <div className="mt-5 space-y-4">
          {competencies.map((c) => (
            <div key={c.key}>
              <div className="flex items-baseline justify-between">
                <p className="font-sans text-sm text-white/80">{c.label}</p>
                <p className="font-mono text-xs text-white/50">
                  {c.score}/20
                  {showPercentage && (
                    <span className="ml-2 text-accent">{Math.round((c.score / 20) * 100)}%</span>
                  )}
                </p>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal to-accent transition-all duration-500"
                  style={{ width: `${(c.score / 20) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
