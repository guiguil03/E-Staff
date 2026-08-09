"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  DELF_LEVELS,
  computeDelfScoreOn20,
  applyAnomaly,
  anomalyRuleFor,
  type DelfCriterion,
  type AnomalyDef,
} from "../gradingGrids";
import type { GridCompetencyEntry } from "../planningGradesStore";

interface DelfGridProps {
  criteria: DelfCriterion[];
  maxRaw: number;
  anomalies?: AnomalyDef[];
  initialEntry?: GridCompetencyEntry;
  onSave: (entry: GridCompetencyEntry) => void;
  onCancel: () => void;
  /** Visibilité seule (Compte Apprenant) : aucune interaction, pas de bouton Enregistrer. */
  readOnly?: boolean;
}

// Grille DELF B2/B2+ à 4 échelons, réutilisée pour Expression Orale et
// Expression Écrite (mêmes échelons/points, seuls les critères et la
// section "Anomalies" changent) — cf. gradingGrids.ts pour le barème.
export default function DelfGrid({
  criteria,
  maxRaw,
  anomalies,
  initialEntry,
  onSave,
  onCancel,
  readOnly = false,
}: DelfGridProps) {
  const [selections, setSelections] = useState<Record<string, number | undefined>>(
    initialEntry?.selections ?? {}
  );
  const [anomaly, setAnomaly] = useState<string | undefined>(initialEntry?.anomaly);
  const [comments, setComments] = useState(initialEntry?.comments ?? "");

  function selectAnomaly(key: string) {
    const next = anomaly === key ? undefined : key;
    setAnomaly(next);
    setSelections((prev) => applyAnomaly(prev, next));
  }

  function selectLevel(criterionKey: string, value: number) {
    setSelections((prev) => ({ ...prev, [criterionKey]: value }));
  }

  const score = computeDelfScoreOn20(selections, criteria, maxRaw);
  const groups = Array.from(new Set(criteria.map((c) => c.group)));

  return (
    <div>
      {groups.map((group) => (
        <div key={group} className="mt-5 first:mt-0">
          <p className="font-mono text-xs uppercase tracking-widest text-white/40">{group}</p>
          <div className="mt-2 space-y-3">
            {criteria
              .filter((c) => c.group === group)
              .map((c) => {
                const rule = anomalyRuleFor(anomaly, c.key);
                const isForced = rule?.forced !== undefined;
                return (
                  <div key={c.key}>
                    <p className="font-sans text-sm text-white/90">{c.label}</p>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DELF_LEVELS.map((level) => {
                        const disabled =
                          readOnly ||
                          (isForced
                            ? level.value !== rule!.forced
                            : rule?.capAt !== undefined && level.value > rule.capAt);
                        const selected = selections[c.key] === level.value;
                        return (
                          <label
                            key={level.key}
                            className={`rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                              readOnly ? "cursor-default" : "cursor-pointer"
                            } ${
                              disabled && !selected
                                ? "cursor-not-allowed border-white/5 text-white/20"
                                : selected
                                  ? "border-accent bg-accent/10 text-accent"
                                  : "border-white/15 text-white/70 hover:border-white/30"
                            }`}
                          >
                            <input
                              type="radio"
                              name={c.key}
                              className="sr-only"
                              checked={selected}
                              disabled={disabled}
                              onChange={() => selectLevel(c.key, level.value)}
                            />
                            {level.label}
                            <span className="block font-mono text-[10px] text-white/40">
                              {level.value} pt
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      {anomalies && (anomaly || !readOnly) && (
        <div className="mt-6 rounded border border-dashed border-white/15 p-4">
          <p className="font-sans text-sm font-semibold text-white">Anomalies</p>
          <div className="mt-2 space-y-2">
            {anomalies
              .filter((a) => !readOnly || anomaly === a.key)
              .map((a) => (
                <label key={a.key} className="flex items-start gap-2 font-sans text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={anomaly === a.key}
                    onChange={() => selectAnomaly(a.key)}
                    disabled={readOnly}
                    className="mt-0.5"
                  />
                  {a.label}
                </label>
              ))}
          </div>
        </div>
      )}

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
        Note calculée : {score ?? "—"} / 20
      </p>

      {(comments || !readOnly) && (
        <>
          <label className="mt-4 block font-sans text-xs text-white/70" htmlFor="delf-comments">
            Commentaires
          </label>
          <textarea
            id="delf-comments"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            readOnly={readOnly}
            className="mt-1 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
          />
        </>
      )}

      <div className="mt-4 flex items-center gap-3">
        {!readOnly && (
          <Button
            variant="dark"
            onClick={() =>
              score !== null && onSave({ kind: "grid", selections, anomaly, comments, scoreOn20: score })
            }
            disabled={score === null}
          >
            Enregistrer la note
          </Button>
        )}
        <Button variant="ghostDark" onClick={onCancel}>
          {readOnly ? "Fermer" : "Annuler"}
        </Button>
      </div>
    </div>
  );
}
