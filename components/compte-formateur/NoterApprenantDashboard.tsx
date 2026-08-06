"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { APPRENANTS } from "./exampleData";
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
import {
  getCompetencyEntry,
  setCompetencyEntry,
  usePlanningGradesVersion,
  type CompetencyEntry,
  type GridCompetencyEntry,
  type UploadCompetencyEntry,
} from "./planningGradesStore";
import DelfGrid from "./grids/DelfGrid";
import PostureGrid from "./grids/PostureGrid";
import UploadCompetencyForm from "./grids/UploadCompetencyForm";

interface NoterApprenantDashboardProps {
  apprenantId: string;
  seance: number;
  groupe: string;
}

// Page dédiée "Noter la séance" — étape "choix de la compétence puis
// grille" du parcours décrit par la cliente : Bouton Noter (sur le tableau
// récap de Planning) → cette page → 5 compétences → grille (ou dépôt +
// note pour les 2 compétences de compréhension). Les notes sont
// enregistrées dans planningGradesStore dès la validation d'une
// compétence, pas besoin d'un bouton "Valider la séance" séparé — le
// tableau récap de Planning les lit en direct au retour.
export default function NoterApprenantDashboard({
  apprenantId,
  seance,
  groupe,
}: NoterApprenantDashboardProps) {
  const checked = useRequireRole("formateur");
  usePlanningGradesVersion();
  const [activeCompetency, setActiveCompetency] = useState<CompetencyKey | null>(null);

  const apprenant = APPRENANTS.find((a) => a.id === apprenantId);
  const backHref = `/compte/formateur/planning?groupe=${groupe}&seance=${seance}`;

  if (!checked) {
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

  function save(competencyKey: CompetencyKey, entry: CompetencyEntry) {
    setCompetencyEntry(seance, apprenantId, competencyKey, entry);
    setActiveCompetency(null);
  }

  const rows = COMPETENCY_DEFS.map((def) => ({
    def,
    entry: getCompetencyEntry(seance, apprenantId, def.key),
  }));
  const completedScores = rows
    .map(({ entry }) => entry?.scoreOn20)
    .filter((s): s is number => s !== undefined && s !== null);
  const moyenne =
    completedScores.length === COMPETENCY_DEFS.length
      ? Math.round((completedScores.reduce((s, v) => s + v, 0) / COMPETENCY_DEFS.length) * 100) / 100
      : null;

  const activeDef = COMPETENCY_DEFS.find((d) => d.key === activeCompetency);
  const activeEntry = activeCompetency
    ? getCompetencyEntry(seance, apprenantId, activeCompetency)
    : undefined;

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
            {apprenant.firstName} {apprenant.lastName}
          </h1>
          <p className="mt-1 font-sans text-sm text-white/60">
            Groupe {apprenant.groupe} — Séance n°{seance}
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
                      {entry?.scoreOn20 !== undefined && entry.scoreOn20 !== null
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
                    initialEntry={activeEntry as GridCompetencyEntry | undefined}
                    onSave={(entry) => save(activeDef.key, entry)}
                    onCancel={() => setActiveCompetency(null)}
                  />
                )}
                {activeDef.key === "expression_ecrite" && (
                  <DelfGrid
                    criteria={EXPRESSION_ECRITE_CRITERIA}
                    maxRaw={EXPRESSION_ECRITE_MAX}
                    anomalies={EXPRESSION_ECRITE_ANOMALIES}
                    initialEntry={activeEntry as GridCompetencyEntry | undefined}
                    onSave={(entry) => save(activeDef.key, entry)}
                    onCancel={() => setActiveCompetency(null)}
                  />
                )}
                {activeDef.key === "posture_eloquence" && (
                  <PostureGrid
                    initialEntry={activeEntry as GridCompetencyEntry | undefined}
                    onSave={(entry) => save(activeDef.key, entry)}
                    onCancel={() => setActiveCompetency(null)}
                  />
                )}
                {(activeDef.key === "comprehension_orale" ||
                  activeDef.key === "comprehension_ecrite") && (
                  <UploadCompetencyForm
                    initialEntry={activeEntry as UploadCompetencyEntry | undefined}
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
