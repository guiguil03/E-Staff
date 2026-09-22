"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, apiPut } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { apprenantMatricule } from "./exampleData";
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

interface NoterApprenantDashboardProps {
  apprenantId: string;
  seance: number;
  groupe: string;
}

interface NotationApi {
  competence: string;
  gridData: { selections?: Record<string, number>; anomaly?: string; adjustments?: unknown } | null;
  note: number | null;
  commentaires: string | null;
  scoreOn20: number | null;
}

interface ApprenantListApi {
  matricule: string;
  prenom: string;
  nom: string;
  groupeCle: string;
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

// Page dédiée "Noter la séance" — étape "choix de la compétence puis
// grille" du parcours décrit par la cliente : Bouton Noter (sur le tableau
// récap de Planning) → cette page → 5 compétences → grille (ou dépôt +
// note pour les 2 compétences de compréhension). Persisté en base
// (table Notation) depuis le 2026-08-07 — avant ça vivait uniquement dans
// le state local du navigateur du formateur, jamais vu par l'apprenant.
export default function NoterApprenantDashboard({
  apprenantId,
  seance,
  groupe,
}: NoterApprenantDashboardProps) {
  const checked = useRequireRole("formateur");
  const [activeCompetency, setActiveCompetency] = useState<CompetencyKey | null>(null);
  const [notations, setNotations] = useState<Record<string, NotationApi | null> | "loading" | "erreur">(
    "loading"
  );
  // Branché sur /cockpit/apprenants depuis le 2026-09-22 — le prénom/nom
  // affichés venaient avant d'exampleData.ts (30 faux apprenants), la vraie
  // notation étant déjà persistée sous le bon matricule depuis longtemps.
  const [apprenant, setApprenant] = useState<ApprenantListApi | null | "loading">("loading");

  const matricule = apprenantMatricule(apprenantId);
  const backHref = `/compte/formateur/planning?groupe=${groupe}&seance=${seance}`;

  useEffect(() => {
    if (!checked) return;
    apiGet<ApprenantListApi[]>("/cockpit/apprenants", formateurHeaders())
      .then((list) => setApprenant(list.find((a) => a.matricule === matricule) ?? null))
      .catch(() => setApprenant(null));
  }, [checked, matricule]);

  useEffect(() => {
    if (!checked || !matricule) return;
    Promise.all(
      COMPETENCY_DEFS.map((def) =>
        apiGet<NotationApi | null>(`/notations/${groupe}/${seance}/${matricule}/${def.key}`, formateurHeaders())
      )
    )
      .then((results) => {
        const map: Record<string, NotationApi | null> = {};
        COMPETENCY_DEFS.forEach((def, i) => (map[def.key] = results[i]));
        setNotations(map);
      })
      .catch(() => setNotations("erreur"));
  }, [checked, matricule, groupe, seance]);

  if (!checked || notations === "loading" || apprenant === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (!apprenant) {
    return (
      <div className="min-h-screen bg-obsidian px-4 py-10 text-center">
        <p className="font-sans text-sm text-white/50">Apprenant introuvable.</p>
        <Link
          href={backHref}
          className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au planning
        </Link>
      </div>
    );
  }

  async function save(competencyKey: CompetencyKey, entry: CompetencyEntry) {
    const payload =
      entry.kind === "grid"
        ? {
            gridData: { selections: entry.selections, anomaly: entry.anomaly, adjustments: entry.adjustments },
            commentaires: entry.comments,
            scoreOn20: entry.scoreOn20,
          }
        : { note: entry.note, scoreOn20: entry.scoreOn20 };

    const updated = await apiPut<NotationApi>(
      `/notations/${groupe}/${seance}/${matricule}/${competencyKey}`,
      payload,
      formateurHeaders()
    );
    setNotations((prev) => (prev === "loading" || prev === "erreur" ? prev : { ...prev, [competencyKey]: updated }));
    setActiveCompetency(null);
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

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href={backHref}
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au planning
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            {apprenant.prenom} {apprenant.nom}
          </h1>
          <p className="mt-1 font-sans text-sm text-white/60">
            Groupe {apprenant.groupeCle} — Séance n°{seance}
          </p>
        </Reveal>

        {!activeDef ? (
          <Reveal delay={40}>
            <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
              <h3 className="font-display text-base font-semibold text-white">Compétences</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {rows.map(({ def, entry }) => (
                  <button
                    key={def.key}
                    onClick={() => setActiveCompetency(def.key)}
                    className="flex items-center justify-between rounded border border-white/10 bg-obsidian px-4 py-3 text-left transition-colors hover:border-accent/50"
                  >
                    <span className="font-sans text-sm text-white">{def.label}</span>
                    <span className="font-mono text-xs text-accent">
                      {entry?.scoreOn20 !== undefined && entry?.scoreOn20 !== null
                        ? `${entry.scoreOn20}/20`
                        : "à noter"}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
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
          </Reveal>
        ) : (
          <Reveal delay={40}>
            <div className="mt-6 rounded border border-accent/30 bg-obsidianCard p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-white">{activeDef.label}</h3>
                <button
                  onClick={() => setActiveCompetency(null)}
                  className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
                >
                  ← Compétences
                </button>
              </div>

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
                {(activeDef.key === "comprehension_orale" ||
                  activeDef.key === "comprehension_ecrite") && (
                  <UploadCompetencyForm
                    initialEntry={toUploadEntry(activeEntry)}
                    onSave={(entry) => save(activeDef.key, entry)}
                    onCancel={() => setActiveCompetency(null)}
                  />
                )}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
