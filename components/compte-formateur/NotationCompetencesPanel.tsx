"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import {
  COMPETENCY_DEFS,
  EXPRESSION_ORALE_CRITERIA,
  EXPRESSION_ORALE_MAX,
  EXPRESSION_ECRITE_CRITERIA,
  EXPRESSION_ECRITE_MAX,
  EXPRESSION_ECRITE_ANOMALIES,
  tauxAssimilation,
  type CompetencyKey,
} from "./gradingGrids";
import type { CompetencyEntry, GridCompetencyEntry, UploadCompetencyEntry } from "./planningGradesStore";
import DelfGrid from "./grids/DelfGrid";
import PostureGrid from "./grids/PostureGrid";
import UploadCompetencyForm from "./grids/UploadCompetencyForm";
import DevoirPreview from "./DevoirPreview";

interface NotationApi {
  id: string;
  competence: string;
  fileName: string | null;
  gradedAt: string | null;
  gridData: { selections?: Record<string, number>; anomaly?: string; adjustments?: unknown } | null;
  note: number | null;
  commentaires: string | null;
  scoreOn20: number | null;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function toGridEntry(n: NotationApi | null | undefined): GridCompetencyEntry | undefined {
  if (!n || !n.gridData) return undefined;
  return {
    kind: "grid",
    selections: (n.gridData.selections as Record<string, number | undefined>) ?? {},
    anomaly: n.gridData.anomaly as string | undefined,
    adjustments: n.gridData.adjustments as GridCompetencyEntry["adjustments"],
    comments: n.commentaires ?? "",
    scoreOn20: n.scoreOn20,
  };
}

function toUploadEntry(n: NotationApi | null | undefined): UploadCompetencyEntry | undefined {
  if (!n) return undefined;
  return { kind: "upload", fileName: null, note: n.note, scoreOn20: n.scoreOn20 };
}

// Notation des 5 compétences d'un apprenant pour une séance (grilles DELF,
// posture, dépôt + note pour les compréhensions) — partagé par la page
// « Noter » (Planning) et le panneau latéral de la classe virtuelle, pour
// noter PENDANT le cours sans quitter la visio (demande cliente du
// 2026-09-25). Même table Notation, mêmes routes.
export default function NotationCompetencesPanel({
  groupe,
  seance,
  matricule,
  compact = false,
}: {
  groupe: string;
  seance: number;
  matricule: string;
  /** Panneau latéral étroit (classe virtuelle) : compétences en une colonne. */
  compact?: boolean;
}) {
  const [activeCompetency, setActiveCompetency] = useState<CompetencyKey | null>(null);
  const [notations, setNotations] = useState<Record<string, NotationApi | null> | "loading" | "erreur">(
    "loading"
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setActiveCompetency(null);
    setNotations("loading");
    let cancelled = false;
    Promise.all(
      COMPETENCY_DEFS.map((def) =>
        apiGet<NotationApi | null>(`/notations/${groupe}/${seance}/${matricule}/${def.key}`, formateurHeaders())
      )
    )
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, NotationApi | null> = {};
        COMPETENCY_DEFS.forEach((def, i) => (map[def.key] = results[i]));
        setNotations(map);
      })
      .catch(() => !cancelled && setNotations("erreur"));
    return () => {
      cancelled = true;
    };
  }, [matricule, groupe, seance]);

  if (notations === "loading") {
    return <p className="font-sans text-sm text-white/50">Chargement des notes...</p>;
  }

  async function save(competencyKey: CompetencyKey, entry: CompetencyEntry) {
    setSaveError(null);
    const payload =
      entry.kind === "grid"
        ? {
            gridData: { selections: entry.selections, anomaly: entry.anomaly, adjustments: entry.adjustments },
            commentaires: entry.comments,
            scoreOn20: entry.scoreOn20,
          }
        : { note: entry.note, scoreOn20: entry.scoreOn20 };

    try {
      const updated = await apiPut<NotationApi>(
        `/notations/${groupe}/${seance}/${matricule}/${competencyKey}`,
        payload,
        formateurHeaders()
      );
      setNotations((prev) =>
        prev === "loading" || prev === "erreur" ? prev : { ...prev, [competencyKey]: updated }
      );
      setActiveCompetency(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Enregistrement impossible — réessayez.");
    }
  }

  const rows =
    notations === "erreur"
      ? COMPETENCY_DEFS.map((def) => ({ def, entry: null as NotationApi | null }))
      : COMPETENCY_DEFS.map((def) => ({ def, entry: notations[def.key] ?? null }));
  const completedScores = rows
    .map(({ entry }) => entry?.scoreOn20)
    .filter((s): s is number => s !== undefined && s !== null);
  const moyenne =
    completedScores.length === COMPETENCY_DEFS.length
      ? Math.round((completedScores.reduce((s, v) => s + v, 0) / COMPETENCY_DEFS.length) * 100) / 100
      : null;

  const activeDef = COMPETENCY_DEFS.find((d) => d.key === activeCompetency);
  const activeEntry = activeCompetency && notations !== "erreur" ? notations[activeCompetency] : undefined;

  if (!activeDef) {
    return (
      <div>
        {notations === "erreur" && (
          <p className="mb-3 font-sans text-xs text-accent">Impossible de charger les notes existantes.</p>
        )}
        <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
          {rows.map(({ def, entry }) => (
            <button
              key={def.key}
              onClick={() => setActiveCompetency(def.key)}
              className="flex items-center justify-between rounded border border-white/10 bg-obsidian px-4 py-3 text-left transition-colors hover:border-accent/50"
            >
              <span className="font-sans text-sm text-white">
                {def.label}
                {entry?.fileName && (
                  <span className="block font-mono text-[10px] text-white/40">📎 {entry.fileName}</span>
                )}
              </span>
              <span className="font-mono text-xs text-accent">
                {entry?.scoreOn20 !== undefined && entry?.scoreOn20 !== null
                  ? `${entry.scoreOn20}/20`
                  : entry?.fileName
                    ? "rendu à corriger"
                    : "à noter"}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
          <p className="font-sans text-sm font-semibold text-white">Moyenne de la séance</p>
          <p className="font-display text-xl font-bold text-accent">
            {moyenne ?? "—"}
            <span className="text-sm font-normal text-white/40">/20</span>
            {moyenne !== null && (
              <span className="ml-3 font-sans text-sm font-normal text-white/50">
                {tauxAssimilation(moyenne)}% d&apos;assimilation
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">{activeDef.label}</h3>
        <button
          onClick={() => setActiveCompetency(null)}
          className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
        >
          ← Compétences
        </button>
      </div>

      {/* Rendu déposé par l'apprenant pour cette compétence — consultable
          pendant la notation, sans passer par « Évaluer & Corriger ». */}
      {activeEntry?.fileName ? (
        <DevoirPreview notationId={activeEntry.id} fileName={activeEntry.fileName} />
      ) : (
        (activeDef.key === "expression_orale" ||
          activeDef.key === "expression_ecrite" ||
          activeDef.key === "posture_eloquence") && (
          <p className="mt-3 font-sans text-xs text-white/40">
            Aucun document déposé par l&apos;apprenant pour cette compétence.
          </p>
        )
      )}
      {saveError && <p className="mt-3 font-sans text-sm text-accent">{saveError}</p>}

      <div className="mt-4">
        {activeDef.key === "expression_orale" && (
          <DelfGrid
            criteria={EXPRESSION_ORALE_CRITERIA}
            maxRaw={EXPRESSION_ORALE_MAX}
            initialEntry={toGridEntry(activeEntry)}
            onSave={(entry) => save(activeDef.key, entry)}
            onCancel={() => setActiveCompetency(null)}
          />
        )}
        {activeDef.key === "expression_ecrite" && (
          <DelfGrid
            criteria={EXPRESSION_ECRITE_CRITERIA}
            maxRaw={EXPRESSION_ECRITE_MAX}
            anomalies={EXPRESSION_ECRITE_ANOMALIES}
            initialEntry={toGridEntry(activeEntry)}
            onSave={(entry) => save(activeDef.key, entry)}
            onCancel={() => setActiveCompetency(null)}
          />
        )}
        {activeDef.key === "posture_eloquence" && (
          <PostureGrid
            initialEntry={toGridEntry(activeEntry)}
            onSave={(entry) => save(activeDef.key, entry)}
            onCancel={() => setActiveCompetency(null)}
          />
        )}
        {(activeDef.key === "comprehension_orale" || activeDef.key === "comprehension_ecrite") && (
          <UploadCompetencyForm
            initialEntry={toUploadEntry(activeEntry)}
            onSave={(entry) => save(activeDef.key, entry)}
            onCancel={() => setActiveCompetency(null)}
          />
        )}
      </div>
    </div>
  );
}
