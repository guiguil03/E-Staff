"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import CompetencyRadar from "./CompetencyRadar";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { apprenantIdFromMatricule } from "./exampleData";

interface GroupDetailPanelProps {
  groupKey: string;
  onSelectApprenant: (id: string) => void;
  onClose: () => void;
}

const COMPETENCY_LABELS: Record<string, string> = {
  comprehension_orale: "Compréhension orale",
  expression_orale: "Expression orale",
  comprehension_ecrite: "Compréhension écrite",
  expression_ecrite: "Expression écrite",
  posture_eloquence: "Posture & Éloquence",
};

interface GroupeDetailApi {
  cle: string;
  moyenne: number | null;
  avgCompetencies: { key: string; score: number }[];
  avgAbsence: number | null;
  apprenants: {
    matricule: string;
    prenom: string;
    nom: string;
    moyenneGlobale: number | null;
    tauxAbsence: number | null;
    alerteDecrochage: boolean;
  }[];
}

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

// Branché sur les vraies notations (table Notation) depuis 2026-08-24 — voir
// backend/src/cockpit/cockpit.service.ts pour les conventions de calcul
// (moyenne globale, radar par compétence, taux d'absence).
export default function GroupDetailPanel({
  groupKey,
  onSelectApprenant,
  onClose,
}: GroupDetailPanelProps) {
  const [detail, setDetail] = useState<GroupeDetailApi | "loading" | "erreur">("loading");

  useEffect(() => {
    setDetail("loading");
    apiGet<GroupeDetailApi>(`/cockpit/groupes/${groupKey}/detail`, formateurHeaders())
      .then(setDetail)
      .catch(() => setDetail("erreur"));
  }, [groupKey]);

  if (detail === "loading" || detail === "erreur") {
    return (
      <Reveal>
        <div className="rounded border border-accent/30 bg-obsidianCard p-6">
          <p className="font-sans text-sm text-white/50">
            {detail === "loading" ? "Chargement..." : "Impossible de charger ce groupe pour le moment."}
          </p>
        </div>
      </Reveal>
    );
  }

  const avgCompetencies = detail.avgCompetencies.map((c) => ({
    key: c.key,
    label: COMPETENCY_LABELS[c.key] ?? c.key,
    score: c.score,
  }));

  return (
    <Reveal>
      <div className="rounded border border-accent/30 bg-obsidianCard p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            Groupe {detail.cle} — {detail.moyenne ?? "—"}/100
          </h3>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-white/50 hover:text-accent"
          >
            Fermer ✕
          </button>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_240px]">
          <div>
            <p className="font-sans text-sm font-semibold text-white">
              Apprenants ({detail.apprenants.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {detail.apprenants.map((a) => (
                <li key={a.matricule}>
                  <button
                    onClick={() => onSelectApprenant(apprenantIdFromMatricule(a.matricule))}
                    className="flex w-full items-center justify-between rounded border border-white/10 bg-obsidian px-3 py-2 text-left transition-colors hover:border-accent/50"
                  >
                    <span className="font-sans text-sm text-white">
                      {a.prenom} {a.nom}
                      {a.alerteDecrochage && (
                        <span className="ml-2 font-mono text-[10px] uppercase text-teal">
                          alerte
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-white/50">
                      {a.moyenneGlobale ?? "—"}/100
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p className="mt-4 font-sans text-sm font-semibold text-white">Assiduité</p>
            <p className="mt-1 font-sans text-sm text-white/70">
              Taux d&apos;absence moyen : {detail.avgAbsence ?? "—"}%
            </p>
          </div>

          <div>
            <p className="text-center font-sans text-sm font-semibold text-white">
              Radar de compétences collectif
            </p>
            <CompetencyRadar competencies={avgCompetencies} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}
