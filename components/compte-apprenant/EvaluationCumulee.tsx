"use client";

import { useEffect, useState } from "react";
import CompetencyBars from "./CompetencyBars";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { COMPETENCY_DEFS } from "@/components/compte-formateur/gradingGrids";

interface NotationApi {
  competence: string;
  scoreOn20: number | null;
}

interface SeanceNotations {
  numero: number;
  notations: NotationApi[];
}

// Remplace l'ancienne "Évaluation de la dernière séance" (figée sur un seul
// devoir de démo) — moyenne réelle de chaque compétence sur l'ensemble des
// séances déjà notées, avec le taux d'assimilation en %. Complète la jauge
// CECR (cumul global) avec le détail par compétence.
export default function EvaluationCumulee() {
  const [seances, setSeances] = useState<SeanceNotations[] | "loading" | "erreur">("loading");

  useEffect(() => {
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) {
      setSeances("erreur");
      return;
    }
    apiGet<SeanceNotations[]>(`/apprenants/${matricule}/notations`)
      .then(setSeances)
      .catch(() => setSeances("erreur"));
  }, []);

  if (seances === "loading") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }
  if (seances === "erreur") {
    return (
      <div className="rounded border border-white/10 bg-obsidianCard p-6">
        <p className="font-sans text-sm text-white/50">
          Impossible de charger l&apos;évaluation cumulée pour le moment.
        </p>
      </div>
    );
  }

  const competencies = COMPETENCY_DEFS.map((def) => {
    const scores = seances
      .flatMap((s) => s.notations.filter((n) => n.competence === def.key))
      .map((n) => n.scoreOn20)
      .filter((v): v is number => v !== null);
    const score = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    return { key: def.key, label: def.label, score };
  });

  const seancesNotees = seances.filter((s) => s.notations.some((n) => n.scoreOn20 !== null)).length;

  return (
    <CompetencyBars
      title="Évaluation cumulée par compétence"
      subtitle={
        seancesNotees > 0
          ? `Moyenne sur ${seancesNotees} séance${seancesNotees > 1 ? "s" : ""} notée${seancesNotees > 1 ? "s" : ""}`
          : "Aucune séance notée pour le moment"
      }
      competencies={competencies}
      showPercentage
    />
  );
}
