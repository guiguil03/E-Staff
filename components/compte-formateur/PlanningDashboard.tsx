"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, apiPut } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import {
  APPRENANTS,
  DERNIERE_SEANCE_PASSEE,
  GROUPES,
  OBJECTIFS_PAR_DEFAUT,
  SEANCE_NUMBERS,
  type Apprenant,
} from "./exampleData";
import { COMPETENCY_DEFS, tauxAssimilation, type CompetencyKey } from "./gradingGrids";
import { getCompetencyEntry, usePlanningGradesVersion } from "./planningGradesStore";

interface SeanceApi {
  id: string;
  groupeCle: string;
  numero: number;
  startAt: string | null;
  dureeMinutes: number;
  objectifs: string | null;
  dailyRoomName: string | null;
  dailyRoomUrl: string | null;
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Pour les séances déjà passées (1 à DERNIERE_SEANCE_PASSEE) sans note
// saisie dans planningGradesStore, on affiche une valeur plausible dérivée
// des compétences actuelles de l'apprenant (léger delta décroissant, même
// logique que son historique hebdomadaire) — purement pour l'affichage,
// ça n'écrit rien dans le store. Les séances futures démarrent vides.
function derivedScore(apprenant: Apprenant, competencyKey: CompetencyKey, seance: number): number | null {
  if (seance > DERNIERE_SEANCE_PASSEE) return null;
  const delta = [-2, -1, 0, 0][seance - 1] ?? 0;
  const current = apprenant.competencies.find((c) => c.key === competencyKey)?.score ?? 12;
  return Math.max(0, Math.min(20, current + delta));
}

function displayedScore(apprenant: Apprenant, competencyKey: CompetencyKey, seance: number): number | null {
  const entry = getCompetencyEntry(seance, apprenant.id, competencyKey);
  if (entry && entry.scoreOn20 !== null && entry.scoreOn20 !== undefined) return entry.scoreOn20;
  return derivedScore(apprenant, competencyKey, seance);
}

// Page dédiée "Planning par Groupe & Moyenne de Séance" — pilotage
// pédagogique séance par séance. La saisie détaillée par compétence (grille
// de critères pour Expression Orale/Écrite et Posture & Éloquence, dépôt +
// note pour Compréhension Orale/Écrite) se fait sur la page dédiée
// /compte/formateur/planning/noter/[apprenantId] (bouton "Noter" par
// ligne) — ce tableau reste une vue de lecture qui agrège les scores
// enregistrés dans planningGradesStore.
// Sync : en l'absence de backend, la saisie reste locale à cette session de
// navigation (pas de compte réel partagé avec l'apprenant) — le point
// d'accroche pour une vraie synchronisation (mise à jour de la progression
// hebdomadaire de chaque apprenant) reste à construire une fois un backend
// partagé en place pour ce module.
export default function PlanningDashboard() {
  const checked = useRequireRole("formateur");
  const searchParams = useSearchParams();
  const [groupeKey, setGroupeKey] = useState(searchParams.get("groupe") || GROUPES[0].key);
  const [seance, setSeance] = useState(Number(searchParams.get("seance") ?? "1"));
  const [objectifs, setObjectifs] = useState(OBJECTIFS_PAR_DEFAUT[1] ?? "");
  const [horaireSeance, setHoraireSeance] = useState<SeanceApi | null>(null);
  const [horaireInput, setHoraireInput] = useState("");
  const [horaireStatus, setHoraireStatus] = useState<"idle" | "loading" | "saving" | "error">(
    "idle"
  );
  usePlanningGradesVersion();

  const apprenantsGroupe = APPRENANTS.filter((a) => a.groupe === groupeKey);

  useEffect(() => {
    setObjectifs(OBJECTIFS_PAR_DEFAUT[seance] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupeKey, seance]);

  useEffect(() => {
    let cancelled = false;
    setHoraireStatus("loading");
    apiGet<SeanceApi>(`/seances/${groupeKey}/${seance}`, formateurHeaders())
      .then((data) => {
        if (cancelled) return;
        setHoraireSeance(data);
        setHoraireInput(data.startAt ? toDatetimeLocalValue(data.startAt) : "");
        setHoraireStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setHoraireSeance(null);
        setHoraireStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [groupeKey, seance]);

  async function saveHoraire() {
    if (!horaireInput) return;
    setHoraireStatus("saving");
    try {
      const startAt = new Date(horaireInput).toISOString();
      const data = await apiPut<SeanceApi>(
        `/seances/${groupeKey}/${seance}`,
        { startAt },
        formateurHeaders()
      );
      setHoraireSeance(data);
      setHoraireStatus("idle");
    } catch {
      setHoraireStatus("error");
    }
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  function moyenneApprenant(apprenant: Apprenant): number | null {
    const scores = COMPETENCY_DEFS.map((c) => displayedScore(apprenant, c.key, seance));
    if (scores.some((s) => s === null)) return null;
    const values = scores as number[];
    return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100;
  }

  const moyennesApprenants = apprenantsGroupe.map((a) => moyenneApprenant(a));
  const moyennesCompletes = moyennesApprenants.filter((m): m is number => m !== null);
  const moyenneGroupe =
    moyennesCompletes.length > 0
      ? Math.round(
          (moyennesCompletes.reduce((s, m) => s + m, 0) / moyennesCompletes.length) * 100
        ) / 100
      : null;

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

        <Reveal delay={60}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Horaire &amp; Classe virtuelle
            </h3>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <div>
                <label
                  htmlFor="horaire-seance"
                  className="block font-mono text-xs uppercase tracking-widest text-white/50"
                >
                  Date &amp; heure
                </label>
                <input
                  id="horaire-seance"
                  type="datetime-local"
                  value={horaireInput}
                  onChange={(e) => setHoraireInput(e.target.value)}
                  className="mt-1 rounded border border-white/20 bg-obsidian px-3 py-2 font-sans text-sm text-white outline-none focus:border-accent"
                />
              </div>
              <Button
                variant="ghostDark"
                onClick={saveHoraire}
                disabled={!horaireInput || horaireStatus === "saving"}
              >
                {horaireStatus === "saving" ? "Enregistrement..." : "Planifier"}
              </Button>
              <p className="font-mono text-xs text-white/40">
                {horaireStatus === "loading" && "Chargement..."}
                {horaireStatus === "error" && "Erreur — réessayer."}
                {horaireStatus === "idle" &&
                  horaireSeance?.startAt &&
                  (horaireSeance.dailyRoomName
                    ? "Salle vidéo créée."
                    : "Salle vidéo : bientôt disponible (fournisseur non configuré).")}
              </p>
            </div>
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
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                Bientôt disponible
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-6 rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Grille des 5 compétences (/20)
            </h3>
            <p className="mt-1 font-sans text-xs text-white/50">
              Vue de lecture — la notation détaillée (grille de critères ou dépôt de document) se
              fait via le bouton &laquo; Noter &raquo;.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] font-sans text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/40">
                    <th className="py-2 pr-2 font-mono font-normal">Apprenant</th>
                    {COMPETENCY_DEFS.map((c) => (
                      <th key={c.key} className="py-2 pr-2 font-mono font-normal">
                        {c.label}
                      </th>
                    ))}
                    <th className="py-2 pr-2 font-mono font-normal text-right">Moyenne</th>
                    <th className="py-2 pr-2 font-mono font-normal text-right">Assimilation</th>
                    <th className="py-2 font-mono font-normal text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apprenantsGroupe.map((a) => {
                    const moyenne = moyenneApprenant(a);
                    return (
                      <tr key={a.id} className="border-b border-white/5">
                        <td className="py-2 pr-2 text-white">
                          {a.firstName} {a.lastName}
                        </td>
                        {COMPETENCY_DEFS.map((c) => {
                          const score = displayedScore(a, c.key, seance);
                          return (
                            <td key={c.key} className="py-2 pr-2 text-white/80">
                              {score ?? "—"}
                            </td>
                          );
                        })}
                        <td className="py-2 pr-2 text-right font-mono text-sm text-accent">
                          {moyenne ?? "—"}
                        </td>
                        <td className="py-2 pr-2 text-right font-mono text-sm text-white/70">
                          {moyenne !== null ? `${tauxAssimilation(moyenne)}%` : "—"}
                        </td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/compte/formateur/planning/noter/${a.id}?seance=${seance}&groupe=${groupeKey}`}
                            className="inline-block rounded border border-accent/40 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-accent hover:bg-accent/10"
                          >
                            Noter
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="font-sans text-sm font-semibold text-white">
                Moyenne du Groupe — Séance n°{seance}
              </p>
              <p className="font-display text-xl font-bold text-accent">
                {moyenneGroupe ?? "—"}
                <span className="text-sm font-normal text-white/40">/20</span>
                {moyenneGroupe !== null && (
                  <span className="ml-3 font-sans text-sm font-normal text-white/50">
                    {tauxAssimilation(moyenneGroupe)}% d&apos;assimilation
                  </span>
                )}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
