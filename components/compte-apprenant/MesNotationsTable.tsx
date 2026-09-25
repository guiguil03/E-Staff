"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import {
  COMPETENCY_DEFS,
  EXPRESSION_ORALE_CRITERIA,
  EXPRESSION_ORALE_MAX,
  EXPRESSION_ECRITE_CRITERIA,
  EXPRESSION_ECRITE_MAX,
  EXPRESSION_ECRITE_ANOMALIES,
  tauxAssimilation,
} from "@/components/compte-formateur/gradingGrids";
import type { GridCompetencyEntry } from "@/components/compte-formateur/planningGradesStore";
import DelfGrid from "@/components/compte-formateur/grids/DelfGrid";
import PostureGrid from "@/components/compte-formateur/grids/PostureGrid";
import DevoirUploadForm from "./DevoirUploadForm";
import { COMPETENCY_STYLE } from "./WeeklyCompetencyChart";

interface NotationApi {
  competence: string;
  fileName: string | null;
  soumisAt: string | null;
  gridData: { selections?: Record<string, number>; anomaly?: string; adjustments?: unknown } | null;
  note: number | null;
  commentaires: string | null;
  scoreOn20: number | null;
  gradedAt: string | null;
}

interface SeanceNotations {
  numero: number;
  startAt: string | null;
  notations: NotationApi[];
}

// Compétences à grille : l'apprenant peut y déposer un devoir avant
// notation. comprehension_orale/ecrite restent gérées entièrement par le
// formateur (dépôt de document externe + note directe), pas de dépôt ici.
const GRID_COMPETENCIES = new Set(["expression_orale", "expression_ecrite", "posture_eloquence"]);

function toGridEntry(n: NotationApi | undefined): GridCompetencyEntry | undefined {
  if (!n?.gridData) return undefined;
  return {
    kind: "grid",
    selections: (n.gridData.selections as Record<string, number | undefined>) ?? {},
    anomaly: n.gridData.anomaly as string | undefined,
    adjustments: n.gridData.adjustments as GridCompetencyEntry["adjustments"],
    comments: n.commentaires ?? "",
    scoreOn20: n.scoreOn20,
  };
}

// Tableau "mes séances & notation" — même parcours que Planning côté
// formateur (séance × compétence), mais les lignes sont les 12 séances de
// l'apprenant lui-même. Clic sur une compétence notée → visibilité de la
// grille de correction (lecture seule) ; clic sur une compétence à grille
// pas encore notée → dépôt de devoir. Persisté en base (table Notation,
// 2026-08-07) — remplace l'ancien contenu figé "Évaluation de la dernière
// séance" par un vrai historique séance par séance.
export default function MesNotationsTable({ className }: { className?: string } = {}) {
  const [matricule, setMatricule] = useState<string | null>(null);
  const [seances, setSeances] = useState<SeanceNotations[] | "loading" | "erreur">("loading");
  const [selected, setSelected] = useState<{ numero: number; competence: string } | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Le panneau de dépôt/lecture s'ouvre sous le tableau, souvent hors de
  // l'écran : on le fait défiler jusqu'à lui, sinon le clic sur « à
  // déposer » semblait ne rien faire (signalement du 2026-09-25).
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  function refresh(m: string) {
    setSeances("loading");
    apiGet<SeanceNotations[]>(`/apprenants/${m}/notations`)
      .then(setSeances)
      .catch(() => setSeances("erreur"));
  }

  useEffect(() => {
    const m = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    setMatricule(m);
    if (m) refresh(m);
  }, []);

  const selectedSeance = Array.isArray(seances)
    ? seances.find((s) => s.numero === selected?.numero)
    : undefined;
  const selectedNotation = selectedSeance?.notations.find((n) => n.competence === selected?.competence);
  const selectedDef = selected ? COMPETENCY_DEFS.find((d) => d.key === selected.competence) : undefined;

  return (
    <Reveal className={className}>
      <div className="h-full rounded border border-white/10 bg-obsidianCard p-6">
        <h3 className="font-display text-base font-semibold text-white">
          Mes séances &amp; notation
        </h3>
        <p className="mt-1 font-sans text-xs text-white/50">
          Cliquez sur une compétence pour voir comment elle a été évaluée, ou déposer votre devoir.
        </p>

        {seances === "loading" && (
          <p className="mt-4 font-sans text-sm text-white/50">Chargement...</p>
        )}
        {seances === "erreur" && (
          <p className="mt-4 font-sans text-sm text-white/50">
            Impossible de charger vos séances pour le moment.
          </p>
        )}

        {Array.isArray(seances) && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] font-sans text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-white/40">
                  <th className="py-2 pr-2 font-mono font-normal">Séance</th>
                  {COMPETENCY_DEFS.map((c) => (
                    <th key={c.key} className="py-2 pr-2 font-mono font-normal">
                      {c.label}
                    </th>
                  ))}
                  <th className="py-2 pr-2 font-mono font-normal text-right">Moyenne</th>
                  <th className="py-2 font-mono font-normal text-right">Assimilation</th>
                </tr>
              </thead>
              <tbody>
                {seances.map((s) => {
                  const scores = COMPETENCY_DEFS.map(
                    (c) => s.notations.find((n) => n.competence === c.key)?.scoreOn20 ?? null
                  );
                  const complete = scores.every((v) => v !== null);
                  const moyenne = complete
                    ? Math.round(((scores as number[]).reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
                    : null;
                  return (
                    <tr key={s.numero} className="border-b border-white/5">
                      <td className="py-2 pr-2 text-white">
                        n°{s.numero}
                        <span className="block font-mono text-[10px] text-white/40">
                          {s.startAt ? new Date(s.startAt).toLocaleDateString("fr-FR") : "non planifiée"}
                        </span>
                      </td>
                      {COMPETENCY_DEFS.map((c) => {
                        const n = s.notations.find((x) => x.competence === c.key);
                        const style = COMPETENCY_STYLE[c.key as keyof typeof COMPETENCY_STYLE];
                        // Séance sans date = pas encore planifiée par le
                        // formateur : rien à déposer ni à consulter (le
                        // backend refuse aussi le dépôt, voir
                        // NotationService.uploadDevoir).
                        const planifiee = s.startAt !== null;
                        const label =
                          n?.scoreOn20 !== undefined && n?.scoreOn20 !== null
                            ? `${n.scoreOn20}/20`
                            : n?.fileName
                              ? "déposé"
                              : GRID_COMPETENCIES.has(c.key) && planifiee
                                ? "à déposer"
                                : "—";
                        const isSelected = selected?.numero === s.numero && selected?.competence === c.key;
                        return (
                          <td key={c.key} className="py-2 pr-2">
                            <button
                              onClick={() => setSelected({ numero: s.numero, competence: c.key })}
                              disabled={!planifiee}
                              title={planifiee ? undefined : "Séance pas encore planifiée par votre formateur"}
                              className={`rounded border px-2 py-1 font-mono text-xs transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 ${
                                isSelected ? "bg-white/10" : ""
                              }`}
                              style={{ borderColor: `${style.color}40`, color: style.color }}
                            >
                              {label}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-2 pr-2 text-right font-mono text-sm text-accent">
                        {moyenne ?? "—"}
                      </td>
                      <td className="py-2 text-right font-mono text-sm text-white/70">
                        {moyenne !== null ? `${tauxAssimilation(moyenne)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {selected && selectedDef && (
        <div ref={detailRef} className="mt-4 rounded border border-accent/30 bg-obsidian p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">
              {selectedDef.label} — Séance n°{selected.numero}
            </h3>
            <button
              onClick={() => setSelected(null)}
              className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
            >
              ✕
            </button>
          </div>

          <div className="mt-4">
            {selectedNotation?.scoreOn20 !== undefined && selectedNotation?.scoreOn20 !== null ? (
              selected.competence === "expression_orale" ? (
                <DelfGrid
                  criteria={EXPRESSION_ORALE_CRITERIA}
                  maxRaw={EXPRESSION_ORALE_MAX}
                  initialEntry={toGridEntry(selectedNotation)}
                  onSave={() => {}}
                  onCancel={() => setSelected(null)}
                  readOnly
                />
              ) : selected.competence === "expression_ecrite" ? (
                <DelfGrid
                  criteria={EXPRESSION_ECRITE_CRITERIA}
                  maxRaw={EXPRESSION_ECRITE_MAX}
                  anomalies={EXPRESSION_ECRITE_ANOMALIES}
                  initialEntry={toGridEntry(selectedNotation)}
                  onSave={() => {}}
                  onCancel={() => setSelected(null)}
                  readOnly
                />
              ) : selected.competence === "posture_eloquence" ? (
                <PostureGrid
                  initialEntry={toGridEntry(selectedNotation)}
                  onSave={() => {}}
                  onCancel={() => setSelected(null)}
                  readOnly
                />
              ) : (
                <div className="font-sans text-sm text-white/70">
                  <p>
                    Note : <span className="text-accent">{selectedNotation.scoreOn20}/20</span>
                  </p>
                  {selectedNotation.commentaires && (
                    <p className="mt-2 text-white/60">{selectedNotation.commentaires}</p>
                  )}
                </div>
              )
            ) : GRID_COMPETENCIES.has(selected.competence) && matricule ? (
              <DevoirUploadForm
                matricule={matricule}
                numero={selected.numero}
                competence={selected.competence}
                existingFileName={selectedNotation?.fileName}
                onUploaded={() => matricule && refresh(matricule)}
              />
            ) : (
              <p className="font-sans text-sm text-white/50">
                En attente de dépôt de document et de notation par le formateur.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </Reveal>
  );
}
