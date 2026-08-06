"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useRequireRole } from "@/lib/useRequireRole";
import { apiGet, ApiError } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { APPRENANTS, GROUPES } from "./exampleData";
import { COMPETENCY_DEFS } from "./gradingGrids";
import { getCompetencyEntry, usePlanningGradesVersion } from "./planningGradesStore";

interface PresenceApi {
  apprenantId: string | null;
  prenom: string | null;
  nom: string | null;
  role: string;
  displayName: string | null;
  joinedAt: string;
  leftAt: string | null;
  dureeSecondes: number | null;
}

interface SeanceHistoriqueApi {
  numero: number;
  startAt: string;
  dureeMinutes: number;
  objectifs: string | null;
  rappelJ1Envoye: boolean;
  rappel15minEnvoye: boolean;
  presences: PresenceApi[];
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

function formatDuree(seconds: number | null): string {
  if (seconds === null) return "—";
  const min = Math.round(seconds / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

// Moyenne de séance côté grille de notation — reste dans
// planningGradesStore (state frontend local, non persisté en base), donc
// disponible seulement pour les séances notées durant la session de
// navigation en cours. Affiché en best-effort avec "—" honnête sinon,
// plutôt que de prétendre à une vraie persistance qui n'existe pas.
function moyenneSeanceLocale(groupeKey: string, numero: number): number | null {
  const apprenants = APPRENANTS.filter((a) => a.groupe === groupeKey);
  if (apprenants.length === 0) return null;
  const moyennes = apprenants.map((a) => {
    const scores = COMPETENCY_DEFS.map((c) => getCompetencyEntry(numero, a.id, c.key)?.scoreOn20);
    if (scores.some((s) => s === undefined || s === null)) return null;
    const values = scores as number[];
    return values.reduce((s, v) => s + v, 0) / values.length;
  });
  const completes = moyennes.filter((m): m is number => m !== null);
  if (completes.length === 0) return null;
  return Math.round((completes.reduce((s, m) => s + m, 0) / completes.length) * 100) / 100;
}

export default function HistoriqueDashboard() {
  const checked = useRequireRole("formateur");
  usePlanningGradesVersion();
  const [groupeKey, setGroupeKey] = useState(GROUPES[0].key);
  const [historique, setHistorique] = useState<SeanceHistoriqueApi[] | "loading" | "erreur">(
    "loading"
  );

  useEffect(() => {
    if (!checked) return;
    setHistorique("loading");
    apiGet<SeanceHistoriqueApi[]>(`/groupes/${groupeKey}/historique`, formateurHeaders())
      .then(setHistorique)
      .catch((err) => setHistorique(err instanceof ApiError ? [] : "erreur"));
  }, [checked, groupeKey]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/compte/formateur"
          className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
        >
          ← Retour au cockpit
        </Link>

        <Reveal>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Historique des séances
          </h1>
        </Reveal>

        <Reveal delay={40}>
          <div className="mt-6 flex items-end gap-4 rounded border border-white/10 bg-obsidianCard p-4">
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
          </div>
        </Reveal>

        <div className="mt-6 space-y-4">
          {historique === "loading" && (
            <p className="font-sans text-sm text-white/50">Chargement...</p>
          )}
          {historique === "erreur" && (
            <p className="font-sans text-sm text-white/50">
              Impossible de charger l&apos;historique pour le moment.
            </p>
          )}
          {Array.isArray(historique) && historique.length === 0 && (
            <p className="rounded border border-white/10 bg-obsidianCard p-6 font-sans text-sm text-white/50">
              Aucune séance passée pour ce groupe.
            </p>
          )}
          {Array.isArray(historique) &&
            historique.map((s) => {
              const moyenne = moyenneSeanceLocale(groupeKey, s.numero);
              return (
                <Reveal key={s.numero}>
                  <div className="rounded border border-white/10 bg-obsidianCard p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-base font-semibold text-white">
                        Séance n°{s.numero}
                      </p>
                      <p className="font-mono text-xs text-white/50">
                        {new Date(s.startAt).toLocaleString("fr-FR", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    {s.objectifs && (
                      <p className="mt-2 font-sans text-sm text-white/70">{s.objectifs}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest">
                      <span className={s.rappelJ1Envoye ? "text-success" : "text-white/30"}>
                        Rappel J-1 {s.rappelJ1Envoye ? "envoyé" : "non envoyé"}
                      </span>
                      <span className={s.rappel15minEnvoye ? "text-success" : "text-white/30"}>
                        Rappel 15min {s.rappel15minEnvoye ? "envoyé" : "non envoyé"}
                      </span>
                      <span className="text-accent">
                        Moyenne : {moyenne ?? "—"}
                        {moyenne !== null && "/20"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="font-sans text-xs font-semibold text-white/80">Présence</p>
                      {s.presences.length === 0 ? (
                        <p className="mt-1 font-sans text-xs text-white/40">
                          Aucune donnée de présence enregistrée.
                        </p>
                      ) : (
                        <table className="mt-2 w-full font-sans text-xs">
                          <tbody>
                            {s.presences.map((p, i) => (
                              <tr key={i} className="border-t border-white/5">
                                <td className="py-1.5 text-white/80">
                                  {p.prenom ? `${p.prenom} ${p.nom}` : (p.displayName ?? "Inconnu")}
                                  {p.role === "formateur" && (
                                    <span className="ml-1 text-white/40">(formateur)</span>
                                  )}
                                </td>
                                <td className="py-1.5 text-right text-white/50">
                                  {formatDuree(p.dureeSecondes)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
        </div>
      </div>
    </div>
  );
}
