"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import CompetencyBars from "./CompetencyBars";
import ComparativeChart from "./ComparativeChart";
import CecrGauge from "./CecrGauge";
import OperationalTracking from "./OperationalTracking";
import QuickActions from "./QuickActions";
import {
  ALERTE_PEDAGOGIQUE,
  ASSIDUITE,
  CECR_GAUGE,
  COMMENTAIRE_FORMATEUR,
  DIAGNOSTIC_INITIAL,
  PROCHAINE_SEANCE,
  SEANCE_ACTUELLE,
  TAUX_REUSSITE_GLOBAL,
  WEEKLY_AVERAGES,
} from "./exampleData";
import { ACCOUNT_ROLE_KEY } from "@/lib/accountSession";

// Garde d'accès + assemblage du tableau de bord. Pas de vrai système de
// comptes/matricules individuels pour l'instant (module 7 de la roadmap) —
// le rôle posé en sessionStorage par LoginForm (endpoint /auth/login
// générique) protège cette page.
export default function ApprenantDashboard() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(ACCOUNT_ROLE_KEY) === "apprenant") {
      setChecked(true);
    } else {
      router.replace("/connexion");
    }
  }, [router]);

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

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <CompetencyBars
              title="Évaluation de la dernière séance"
              competencies={SEANCE_ACTUELLE.competencies}
            />
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
          </div>
        </div>
      </div>
    </div>
  );
}
