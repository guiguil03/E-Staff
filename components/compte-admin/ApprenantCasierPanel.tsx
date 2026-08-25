"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { apiGet } from "@/lib/api";
import { COMPETENCY_DEFS } from "@/components/compte-formateur/gradingGrids";
import { adminHeaders } from "./adminHeaders";

interface Notation {
  id: string;
  competence: string;
  fileName: string | null;
  soumisAt: string | null;
  note: number | null;
  commentaires: string | null;
  scoreOn20: number | null;
  gradedAt: string | null;
}

interface SeanceNotations {
  numero: number;
  startAt: string | null;
  notations: Notation[];
}

interface Presence {
  seanceNumero: number;
  joinedAt: string;
  leftAt: string | null;
  dureeSecondes: number | null;
}

interface MissionHistorique {
  clientNom: string;
  role: string;
  dateDebut: string;
  dateFin: string | null;
  superviseurNom: string | null;
  qualityScore: number | null;
}

interface ApprenantCasier {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  groupeLabel: string;
  typeCours: string | null;
  formateurNom: string | null;
  abonnementExpireAt: string | null;
  admission: { totalScore: number | null; tier: string | null; gradedAt: string | null } | null;
  historiqueNotations: SeanceNotations[];
  historiquePresences: Presence[];
  historiqueMissions: MissionHistorique[];
}

const COMPETENCY_LABELS = Object.fromEntries(COMPETENCY_DEFS.map((c) => [c.key, c.label]));

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
}

// Casier apprenant côté RH — historique réel (notations + présences, déjà
// tracées via le Cockpit Formateur) plutôt qu'un journal fabriqué. Réutilise
// NotationService.listApprenantNotations (voir RhService.getApprenantCasier)
// au lieu de dupliquer la logique.
export default function ApprenantCasierPanel({ matricule }: { matricule: string }) {
  const [casier, setCasier] = useState<ApprenantCasier | "loading" | "erreur">("loading");

  useEffect(() => {
    apiGet<ApprenantCasier>(`/rh/apprenants/${matricule}/casier`, adminHeaders())
      .then(setCasier)
      .catch(() => setCasier("erreur"));
  }, [matricule]);

  if (casier === "loading") return <p className="font-sans text-sm text-white/50">Chargement...</p>;
  if (casier === "erreur")
    return <p className="font-sans text-sm text-white/50">Erreur de chargement.</p>;

  const presencesParSeance = new Map(casier.historiquePresences.map((p) => [p.seanceNumero, p]));

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <p className="font-display text-lg font-semibold text-white">
            {casier.prenom} {casier.nom}
          </p>
          <p className="font-mono text-xs text-white/40">
            {casier.matricule} · {casier.email}
          </p>
          <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 text-sm text-white/80 sm:grid-cols-3">
            <p>
              Groupe : <span className="text-white">{casier.groupeLabel}</span>
              {casier.typeCours && <span className="text-white/50"> ({casier.typeCours})</span>}
            </p>
            <p>Formateur : <span className="text-white">{casier.formateurNom ?? "—"}</span></p>
            <p>
              Abonnement :{" "}
              <span className="text-white">
                {casier.abonnementExpireAt
                  ? `expire le ${fmtDate(casier.abonnementExpireAt)}`
                  : "non défini"}
              </span>
            </p>
          </div>
          {casier.admission && (
            <p className="mt-2 font-mono text-xs text-accent">
              Admission : {casier.admission.totalScore ?? "—"}/100 — {casier.admission.tier} (
              {fmtDate(casier.admission.gradedAt)})
            </p>
          )}
        </div>
      </Reveal>

      {casier.historiqueMissions.length > 0 && (
        <Reveal delay={20}>
          <div className="rounded border border-white/10 bg-obsidianCard p-6">
            <h3 className="font-display text-base font-semibold text-white">
              Historique des missions (Production)
            </h3>
            <div className="mt-4 space-y-2">
              {casier.historiqueMissions.map((m, i) => (
                <div key={i} className="rounded border border-white/10 bg-obsidian p-3">
                  <p className="font-sans text-sm text-white">
                    {m.clientNom}
                    {m.dateFin === null && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-success">
                        Active
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/50">
                    {m.role} · {m.superviseurNom ?? "Sans superviseur"}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-white/40">
                    {fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}
                    {m.qualityScore !== null && ` · QS ${m.qualityScore}/5`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={40}>
        <div className="rounded border border-white/10 bg-obsidianCard p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Historique des notations
          </h3>
          <div className="mt-4 space-y-3">
            {casier.historiqueNotations.map((s) => {
              const graded = s.notations.filter((n) => n.scoreOn20 !== null);
              const presence = presencesParSeance.get(s.numero);
              if (graded.length === 0 && !presence) return null;
              return (
                <div key={s.numero} className="rounded border border-white/10 bg-obsidian p-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">
                    Séance {s.numero}
                    {s.startAt && ` — ${fmtDate(s.startAt)}`}
                    {presence && (
                      <span className="ml-2 text-success">
                        Présent
                        {presence.dureeSecondes
                          ? ` (${Math.round(presence.dureeSecondes / 60)} min)`
                          : ""}
                      </span>
                    )}
                  </p>
                  {graded.length > 0 ? (
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {graded.map((n) => (
                        <p key={n.id} className="font-sans text-xs text-white/70">
                          {COMPETENCY_LABELS[n.competence] ?? n.competence} :{" "}
                          <span className="text-white">{n.scoreOn20}/20</span>
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-xs text-white/40">Pas encore noté.</p>
                  )}
                </div>
              );
            })}
            {casier.historiqueNotations.every(
              (s) => s.notations.every((n) => n.scoreOn20 === null) && !presencesParSeance.get(s.numero)
            ) && <p className="font-sans text-sm text-white/50">Aucune séance notée pour l&apos;instant.</p>}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
