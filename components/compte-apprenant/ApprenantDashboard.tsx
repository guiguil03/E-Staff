"use client";

import { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import EvaluationCumulee from "./EvaluationCumulee";
import WeeklyCompetencyChart from "./WeeklyCompetencyChart";
import CecrGauge from "./CecrGauge";
import { computeJaugePosition, PALIER_LABELS, type PalierKey } from "./cecrPaliers";
import OperationalTracking from "./OperationalTracking";
import QuickActions from "./QuickActions";
import MonDossier from "./MonDossier";
import MesNotationsTable from "./MesNotationsTable";
import ParametresPanel from "./ParametresPanel";
import AnnoncesCard from "./AnnoncesCard";
import { useRequireRole } from "@/lib/useRequireRole";
import ViewAsBanner from "@/components/ViewAsBanner";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { COMPETENCY_DEFS } from "@/components/compte-formateur/gradingGrids";

interface ApprenantDashboardData {
  prenom: string;
  typeCours: string | null;
  dateInscription: string;
  abonnementExpireAt: string | null;
  seancesTotal: number;
  seancesEffectuees: number;
  prochaineSeance: { numero: number; titre: string; startAt: string } | null;
  diagnosticInitial: {
    tier: string | null;
    totalScore: number | null;
    blocs: { key: string; label: string; score: number }[];
  } | null;
  tauxReussiteGlobal: number | null;
  tauxEvolutionMensuel: number;
  alerteCompetence: { key: string; score: number } | null;
  commentaireFormateur: { text: string; author: string } | null;
  assiduite: {
    semaine: string;
    tauxAbsence: number;
    retards: number;
    statut: "ok" | "attention";
  }[];
}

// Tier validé au test d'admission (voir TIER_LABELS, evaluation.service.ts)
// -> niveau CECR de départ affiché sur la jauge (voir cecrPaliers.ts). Pas
// d'entrée pour "refuse" : un candidat refusé n'a jamais de compte apprenant.
const TIER_TO_NIVEAU_INITIAL: Record<string, PalierKey> = {
  formation_b1: "pre-b1",
  niveau_b2: "b2",
  niveau_c1: "c1",
  placement_direct: "c2",
};

const COMPETENCY_LABELS = Object.fromEntries(COMPETENCY_DEFS.map((c) => [c.key, c.label]));

// "AAAA-Wss" (voir NotationService.isoWeekLabel) -> libellé lisible, même
// convention que EncaissementsFormationPanel.fmtSemaine.
function formatSemaine(isoWeek: string): string {
  const [year, week] = isoWeek.split("-W");
  return `S${week} · ${year}`;
}

// Garde d'accès + assemblage du tableau de bord, alimenté par le vrai
// backend (voir NotationService.getApprenantDashboard) : chaque section
// reflète les données réelles de l'apprenant connecté, ou un état vide
// honnête plutôt qu'un chiffre inventé si rien n'existe encore (pas de
// notation, pas de séance passée...).
export default function ApprenantDashboard() {
  const checked = useRequireRole("apprenant");
  const [data, setData] = useState<ApprenantDashboardData | "loading" | "erreur">("loading");

  useEffect(() => {
    if (!checked) return;
    const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);
    if (!matricule) {
      setData("erreur");
      return;
    }
    apiGet<ApprenantDashboardData>(`/apprenants/${matricule}/dashboard`)
      .then(setData)
      .catch(() => setData("erreur"));
  }, [checked]);

  if (!checked || data === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  if (data === "erreur") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">
          Impossible de charger votre tableau de bord pour le moment.
        </p>
      </div>
    );
  }

  const niveauInitial: PalierKey = data.diagnosticInitial?.tier
    ? (TIER_TO_NIVEAU_INITIAL[data.diagnosticInitial.tier] ?? "pre-b1")
    : "pre-b1";
  const matricule = sessionStorage.getItem(ACCOUNT_MATRICULE_KEY);

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <ViewAsBanner />
      <div className="mx-auto max-w-6xl space-y-6">
        <ProfileHeader
          firstName={data.prenom}
          role={data.typeCours ? `Apprenant — ${data.typeCours}` : "Apprenant"}
          diagnostic={
            data.diagnosticInitial
              ? {
                  global: data.diagnosticInitial.totalScore ?? 0,
                  competencies: data.diagnosticInitial.blocs,
                }
              : null
          }
          tauxReussiteGlobal={data.tauxReussiteGlobal}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-6">
            <EvaluationCumulee />
            <WeeklyCompetencyChart />
            <OperationalTracking
              assiduite={data.assiduite.map((a) => ({ ...a, semaine: formatSemaine(a.semaine) }))}
              alerteCompetence={
                data.alerteCompetence
                  ? (COMPETENCY_LABELS[data.alerteCompetence.key] ?? data.alerteCompetence.key)
                  : null
              }
              commentaire={data.commentaireFormateur}
            />
            <MesNotationsTable className="flex-1" />
          </div>

          <div className="flex flex-col gap-6">
            {matricule && <AnnoncesCard matricule={matricule} />}
            <CecrGauge
              value={computeJaugePosition(niveauInitial, data.tauxEvolutionMensuel)}
              displayValue={data.tauxEvolutionMensuel}
              subtitle={`Évolution du mois — départ ${PALIER_LABELS[niveauInitial]}`}
            />
            <QuickActions prochaineSeance={data.prochaineSeance} />
            <MonDossier
              dateInscription={data.dateInscription}
              seancesRestantes={data.seancesTotal - data.seancesEffectuees}
              seancesTotal={data.seancesTotal}
              echeanceRenouvellement={data.abonnementExpireAt}
            />
            <ParametresPanel className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
