import Reveal from "@/components/Reveal";
import type { CompetencyScore } from "./exampleData";

interface ProfileHeaderProps {
  firstName: string;
  role: string;
  diagnosticGlobal: number;
  competencies: CompetencyScore[];
  tauxReussiteGlobal: number;
}

export default function ProfileHeader({
  firstName,
  role,
  diagnosticGlobal,
  competencies,
  tauxReussiteGlobal,
}: ProfileHeaderProps) {
  return (
    <Reveal>
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-accent/50 bg-obsidian font-display text-xl font-semibold text-accent"
            >
              {firstName.charAt(0)}
            </span>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent">
                Espace apprenant
              </p>
              <h1 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">
                Bonjour, {firstName}
              </h1>
              <p className="font-sans text-xs text-white/50">{role}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-white/50">
              Taux de réussite global
            </p>
            <p className="font-display text-2xl font-bold text-accent">
              {tauxReussiteGlobal}%
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="flex items-baseline justify-between">
            <p className="font-sans text-sm font-semibold text-white">
              Diagnostic de départ
            </p>
            <p className="font-mono text-sm text-white/60">
              Global {diagnosticGlobal}/100
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {competencies.map((c) => (
              <div key={c.key} className="rounded border border-white/10 bg-obsidian p-3">
                <p className="font-mono text-xs text-white/50">{c.label}</p>
                <p className="mt-1 font-display text-lg font-bold text-white">
                  {c.score}
                  <span className="text-xs font-normal text-white/40">/20</span>
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(c.score / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
