"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  POSTURE_LEVELS,
  POSTURE_CRITERIA,
  POSTURE_DEFAULT_ADJUSTMENTS,
  computePostureScoreOn20,
  type PostureAdjustments,
} from "../gradingGrids";
import type { GridCompetencyEntry } from "../planningGradesStore";

interface PostureGridProps {
  initialEntry?: GridCompetencyEntry;
  onSave: (entry: GridCompetencyEntry) => void;
  onCancel: () => void;
  /** Visibilité seule (Compte Apprenant) : aucune interaction, pas de bouton Enregistrer. */
  readOnly?: boolean;
}

const BONUS_OPTIONS: PostureAdjustments["bonus"][] = [0, 0.5, 1];

// Grille "Éloquence & Posture" fournie par la cliente : 12 sous-critères à
// 3 échelons (0,5/1/1,75 pt, max brut 21) + malus temps/support (-1 chacun)
// + bonus coup de cœur (+0,5 ou +1), note finale plafonnée à 20.
export default function PostureGrid({ initialEntry, onSave, onCancel, readOnly = false }: PostureGridProps) {
  const [selections, setSelections] = useState<Record<string, number | undefined>>(
    initialEntry?.selections ?? {}
  );
  const [adjustments, setAdjustments] = useState<PostureAdjustments>(
    initialEntry?.adjustments ?? POSTURE_DEFAULT_ADJUSTMENTS
  );
  const [comments, setComments] = useState(initialEntry?.comments ?? "");

  function selectLevel(criterionKey: string, value: number) {
    setSelections((prev) => ({ ...prev, [criterionKey]: value }));
  }

  const score = computePostureScoreOn20(selections, adjustments);
  const sections = Array.from(new Set(POSTURE_CRITERIA.map((c) => c.section)));

  return (
    <div>
      {sections.map((section) => {
        const groups = Array.from(
          new Set(POSTURE_CRITERIA.filter((c) => c.section === section).map((c) => c.group))
        );
        return (
          <div key={section} className="mt-5 first:mt-0">
            <p className="font-display text-sm font-semibold text-white">{section}</p>
            {groups.map((group) => (
              <div key={group} className="mt-3">
                <p className="font-mono text-xs uppercase tracking-widest text-white/40">{group}</p>
                <div className="mt-2 space-y-3">
                  {POSTURE_CRITERIA.filter((c) => c.section === section && c.group === group).map(
                    (c) => {
                      const selected = selections[c.key];
                      return (
                        <div key={c.key}>
                          <p className="font-sans text-sm text-white/90">{c.label}</p>
                          <div className="mt-1.5 grid grid-cols-3 gap-2">
                            {POSTURE_LEVELS.map((level) => (
                              <label
                                key={level.key}
                                className={`rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                                  readOnly ? "cursor-default" : "cursor-pointer"
                                } ${
                                  selected === level.value
                                    ? "border-accent bg-accent/10 text-accent"
                                    : "border-white/15 text-white/70 hover:border-white/30"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={c.key}
                                  className="sr-only"
                                  checked={selected === level.value}
                                  disabled={readOnly}
                                  onChange={() => selectLevel(c.key, level.value)}
                                />
                                {level.label}
                                <span className="block font-mono text-[10px] text-white/40">
                                  {level.value} pt
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="mt-6 rounded border border-dashed border-white/15 p-4">
        <p className="font-sans text-sm font-semibold text-white">Ajustements</p>
        <div className="mt-2 space-y-2 font-sans text-xs text-white/70">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={adjustments.malusTemps}
              disabled={readOnly}
              onChange={(e) =>
                setAdjustments((prev) => ({ ...prev, malusTemps: e.target.checked }))
              }
            />
            Malus Temps (−1 pt) : non-respect du temps imparti
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={adjustments.malusSupport}
              disabled={readOnly}
              onChange={(e) =>
                setAdjustments((prev) => ({ ...prev, malusSupport: e.target.checked }))
              }
            />
            Malus Support (−1 pt) : lecture trop appuyée des notes / de l&apos;écran
          </label>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <span>Bonus / Coup de cœur :</span>
            {BONUS_OPTIONS.map((v) => (
              <label key={v} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="bonus"
                  checked={adjustments.bonus === v}
                  disabled={readOnly}
                  onChange={() => setAdjustments((prev) => ({ ...prev, bonus: v }))}
                />
                {v === 0 ? "Aucun" : `+${v}`}
              </label>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-white/50">
        Note calculée : {score ?? "—"} / 20
      </p>

      {(comments || !readOnly) && (
        <>
          <label className="mt-4 block font-sans text-xs text-white/70" htmlFor="posture-comments">
            Commentaires / Axes d&apos;amélioration
          </label>
          <textarea
            id="posture-comments"
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
              score !== null &&
              onSave({ kind: "grid", selections, adjustments, comments, scoreOn20: score })
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
