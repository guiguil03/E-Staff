"use client";

import ProfileHeader from "./ProfileHeader";
import EvaluationCumulee from "./EvaluationCumulee";
import ComparativeChart from "./ComparativeChart";
import CecrGauge from "./CecrGauge";
import OperationalTracking from "./OperationalTracking";
import QuickActions from "./QuickActions";
import MonDossier from "./MonDossier";
import MesNotationsTable from "./MesNotationsTable";
import ParametresPanel from "./ParametresPanel";
import {
  ALERTE_PEDAGOGIQUE,
  ASSIDUITE,
  CECR_GAUGE,
  COMMENTAIRE_FORMATEUR,
  DIAGNOSTIC_INITIAL,
  DOSSIER,
  PROCHAINE_SEANCE,
  TAUX_REUSSITE_GLOBAL,
  WEEKLY_AVERAGES,
} from "./exampleData";
import { useRequireRole } from "@/lib/useRequireRole";

// Garde d'accès + assemblage du tableau de bord. Pas de vrai système de
// comptes/matricules individuels pour l'instant (module 7 de la roadmap) —
// le rôle posé en sessionStorage par LoginForm (endpoint /auth/login
// générique) protège cette page.
export default function ApprenantDashboard() {
  const checked = useRequireRole("apprenant");

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl space-y-6">
        <ProfileHeader
          firstName="Fara"
          role="Apprenant Expert"
          diagnosticGlobal={DIAGNOSTIC_INITIAL.global}
          competencies={DIAGNOSTIC_INITIAL.competencies}
          tauxReussiteGlobal={TAUX_REUSSITE_GLOBAL}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <EvaluationCumulee />
            <ComparativeChart
              points={WEEKLY_AVERAGES.map((w) => ({ label: w.label, value: w.moyenne }))}
              niveauInitial={DIAGNOSTIC_INITIAL.global}
            />
            <OperationalTracking
              assiduite={ASSIDUITE}
              alerteCompetence={ALERTE_PEDAGOGIQUE.competence}
              commentaire={COMMENTAIRE_FORMATEUR}
            />
          </div>

          <div className="space-y-6">
            <CecrGauge value={CECR_GAUGE.value} />
            <QuickActions
              prochaineSeanceTitle={PROCHAINE_SEANCE.title}
              hoursFromNow={PROCHAINE_SEANCE.hoursFromNow}
            />
            <MonDossier
              dateInscription={DOSSIER.dateInscription}
              seancesRestantes={DOSSIER.seancesRestantes}
              seancesTotal={DOSSIER.seancesTotal}
              echeanceRenouvellement={DOSSIER.echeanceRenouvellement}
              quotaAnnulations={DOSSIER.quotaAnnulations}
              annulationsUtilisees={DOSSIER.annulationsUtilisees}
            />
          </div>
        </div>

        <MesNotationsTable />

        <ParametresPanel />
      </div>
    </div>
  );
}
