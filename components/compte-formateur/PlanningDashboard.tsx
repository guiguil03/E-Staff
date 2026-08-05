"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  APPRENANTS,
  DERNIERE_SEANCE_PASSEE,
  GROUPES,
  OBJECTIFS_PAR_DEFAUT,
  SEANCE_NUMBERS,
  type Apprenant,
} from "./exampleData";

const COMPETENCY_KEYS = [
  { key: "comprehension_orale", label: "Compr. orale" },
  { key: "expression_orale", label: "Expr. orale" },
  { key: "comprehension_ecrite", label: "Compr. écrite" },
  { key: "expression_ecrite", label: "Expr. écrite" },
  { key: "posture_eloquence", label: "Posture" },
];

type GradeGrid = Record<string, Record<string, number | "">>;

// Pour les séances déjà passées (1 à DERNIERE_SEANCE_PASSEE), on dérive des
// notes plausibles à partir des compétences actuelles de l'apprenant (léger
// delta décroissant, même logique que son historique hebdomadaire) ; les
// séances futures démarrent vides — c'est au formateur de les saisir.
function deriveGrid(apprenants: Apprenant[], seance: number): GradeGrid {
  const grid: GradeGrid = {};
  const delta = seance <= DERNIERE_SEANCE_PASSEE ? [-2, -1, 0, 0][seance - 1] : null;
  for (const a of apprenants) {
    grid[a.id] = {};
    for (const c of COMPETENCY_KEYS) {
      if (delta === null) {
        grid[a.id][c.key] = "";
      } else {
        const current = a.competencies.find((comp) => comp.key === c.key)?.score ?? 12;
        grid[a.id][c.key] = Math.max(0, Math.min(20, current + delta));
      }
    }
  }
  return grid;
}

// Page dédiée "Planning par Groupe & Moyenne de Séance" — pilotage
// pédagogique séance par séance. La saisie des 5 compétences ici est
// distincte de la notation des rendus vidéo/audio (page /corriger) : cette
// grille couvre l'évaluation en direct pendant la séance elle-même.
// Sync : en l'absence de backend, la saisie ici reste locale à cette page
// (pas de compte réel partagé avec l'apprenant) — le point d'accroche pour
// une vraie synchronisation (mise à jour de la progression hebdomadaire de
// chaque apprenant) est signalé dans le commentaire de `saveGrades`.
export default function PlanningDashboard() {
  const checked = useRequireRole("formateur");
  const [groupeKey, setGroupeKey] = useState(GROUPES[0].key);
  const [seance, setSeance] = useState(1);
  const [objectifs, setObjectifs] = useState(OBJECTIFS_PAR_DEFAUT[1] ?? "");
  const [grades, setGrades] = useState<GradeGrid>({});
  const [saved, setSaved] = useState(false);

  const apprenantsGroupe = APPRENANTS.filter((a) => a.groupe === groupeKey);

  useEffect(() => {
    setGrades(deriveGrid(apprenantsGroupe, seance));
    setObjectifs(OBJECTIFS_PAR_DEFAUT[seance] ?? "");
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeKey, seance]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  function setGrade(apprenantId: string, competencyKey: string, value: string) {
    const num = value === "" ? "" : Math.max(0, Math.min(20, Number(value)));
    setGrades((prev) => ({
      ...prev,
      [apprenantId]: { ...prev[apprenantId], [competencyKey]: num },
    }));
    setSaved(false);
  }

  function moyenneApprenant(apprenantId: string): number | null {
    const row = grades[apprenantId];
    if (!row) return null;
    const values = COMPETENCY_KEYS.map((c) => row[c.key]).filter(
      (v): v is number => v !== "" && v !== undefined
    );
    if (values.length < COMPETENCY_KEYS.length) return null;
    return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
  }

  const moyennesApprenants = apprenantsGroupe.map((a) => moyenneApprenant(a.id));
  const moyennesCompletes = moyennesApprenants.filter((m): m is number => m !== null);
  const moyenneGroupe =
    moyennesCompletes.length > 0
      ? Math.round(
          (moyennesCompletes.reduce((s, m) => s + m, 0) / moyennesCompletes.length) * 100
        ) / 100
      : null;

  // Point d'accroche pour la vraie synchronisation [Saisie Formateur] →
  // [Calcul Automatique] → [Mises à jour Apprenant] décrite par la
  // cliente : une fois un backend partagé en place, cet enregistrement
  // écrirait la séance en base et recalculerait la progression hebdomadaire
  // de chaque apprenant concerné.
  function saveGrades() {
    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/compte/formateur"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au cockpit
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Planning par Groupe &amp; Moyenne de Séance
          </h1>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 flex flex-wrap items-end gap-4 rounded border border-white/10 bg-obsidianCard p-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Groupe
              </label>
              <select
                value={groupeKey}
                onChange={(e) => setGroupeKey(e.target.value)}
                className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              >
                {GROUPES.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-white/50">
                Séance
              </label>
              <select
                value={seance}
                onChange={(e) => setSeance(Number(e.target.value))}
                className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
              >
                {SEANCE_NUMBERS.map((n) => (
                  <option key={n} value={n}>
                    Séance n°{n} {n <= DERNIERE_SEANCE_PASSEE ? "(passée)" : "(à venir)"}
                  </option>
                ))}
              </select>
            </div>
            <p className="font-mono text-xs text-white/40">
              {apprenantsGroupe.length} apprenants dans ce groupe
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <label
              htmlFor="objectifs"
              className="block font-sans text-sm font-semibold text-white"
            >
              Objectifs visés
            </label>
            <textarea
              id="objectifs"
              rows={2}
              value={objectifs}
              onChange={(e) => setObjectifs(e.target.value)}
              className="mt-2 w-full rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
            />

            <div className="mt-4 flex items-center justify-between rounded border border-dashed border-white/15 px-4 py-3">
              <p className="font-sans text-sm text-white/60">
                Ressources / supports de cette séance
              </p>
              <Button variant="ghostDark" disabled>
                Joindre un fichier
              </Button>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/30">
              PDF, audio, exercice — bientôt disponible
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Grille des 5 compétences (/20)
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] font-sans text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/40">
                    <th className="py-2 pr-2 font-mono font-normal">Apprenant</th>
                    {COMPETENCY_KEYS.map((c) => (
                      <th key={c.key} className="py-2 pr-2 font-mono font-normal">
                        {c.label}
                      </th>
                    ))}
                    <th className="py-2 font-mono font-normal text-right">Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {apprenantsGroupe.map((a) => (
                    <tr key={a.id} className="border-b border-white/5">
                      <td className="py-2 pr-2 text-white">
                        {a.firstName} {a.lastName}
                      </td>
                      {COMPETENCY_KEYS.map((c) => (
                        <td key={c.key} className="py-2 pr-2">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={grades[a.id]?.[c.key] ?? ""}
                            onChange={(e) => setGrade(a.id, c.key, e.target.value)}
                            className="w-14 rounded border border-white/20 bg-obsidian px-2 py-1 text-center font-sans text-sm text-white outline-none focus:border-accent"
                          />
                        </td>
                      ))}
                      <td className="py-2 text-right font-mono text-sm text-accent">
                        {moyenneApprenant(a.id) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <p className="font-sans text-sm font-semibold text-white">
                Moyenne du Groupe — Séance n°{seance}
              </p>
              <p className="font-display text-xl font-bold text-accent">
                {moyenneGroupe ?? "—"}
                <span className="text-sm font-normal text-white/40">/20</span>
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button variant="dark" onClick={saveGrades}>
                Enregistrer la séance
              </Button>
              {saved && (
                <p className="font-sans text-xs text-white/50">
                  Séance enregistrée pour cette session. Synchronisation avec la progression
                  hebdomadaire de chaque apprenant — bientôt disponible.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
