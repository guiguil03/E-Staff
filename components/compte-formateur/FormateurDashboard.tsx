"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import TopBar, { type CockpitGroupe } from "./TopBar";
import AdmissionTestsCard from "./AdmissionTestsCard";
import GroupEvolutionChart from "./GroupEvolutionChart";
import TeachColumn from "./TeachColumn";
import GradingQueueSummaryCard from "./GradingQueueSummaryCard";
import {
  SearchApprenantCard,
  BroadcastCard,
  VivierC1Card,
  WeeklyReportCard,
} from "./AdminColumn";
import GroupDetailPanel from "./GroupDetailPanel";
import WeeklyReportPanel from "./WeeklyReportPanel";
import PaymentAlertsTable from "./PaymentAlertsTable";
import { apiGet } from "@/lib/api";
import { ACCOUNT_MATRICULE_KEY } from "@/lib/accountSession";
import { useRequireRole } from "@/lib/useRequireRole";
import ViewAsBanner from "@/components/ViewAsBanner";

function formateurHeaders(): HeadersInit {
  const matricule =
    typeof window !== "undefined" ? sessionStorage.getItem(ACCOUNT_MATRICULE_KEY) : null;
  return matricule ? { "x-formateur-matricule": matricule } : {};
}

type PanelState = { type: "group"; key: string } | { type: "report" } | null;

// Garde d'accès + assemblage du Cockpit Formateur. Même stopgap que le
// Compte Apprenant : rôle posé en sessionStorage par LoginForm après le
// login de test, en attendant le vrai système de comptes. La correction des
// rendus et la fiche individuelle d'un apprenant vivent sur des pages
// dédiées (/compte/formateur/corriger, /compte/formateur/apprenants/[id])
// plutôt qu'en panneaux embarqués ici.
export default function FormateurDashboard() {
  const router = useRouter();
  const checked = useRequireRole("formateur");
  const [panel, setPanel] = useState<PanelState>(null);
  const [groupes, setGroupes] = useState<CockpitGroupe[]>([]);
  const [globalC1Rate, setGlobalC1Rate] = useState(0);

  useEffect(() => {
    if (!checked) return;
    apiGet<CockpitGroupe[]>("/cockpit/groupes", formateurHeaders())
      .then(setGroupes)
      .catch(() => setGroupes([]));
    apiGet<{ globalRate: number }>("/cockpit/vivier-c1", formateurHeaders())
      .then((data) => setGlobalC1Rate(data.globalRate))
      .catch(() => setGlobalC1Rate(0));
  }, [checked]);

  function goToApprenant(id: string) {
    router.push(`/compte/formateur/apprenants/${id}`);
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-obsidian">
        <p className="font-sans text-sm text-white/50">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian px-4 py-10 sm:px-6 sm:py-14">
      <ViewAsBanner />
      <div className="mx-auto max-w-6xl space-y-6">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Cockpit Formateur
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">
            Bonjour, Hasina
          </h1>
        </Reveal>

        <AdmissionTestsCard />

        {/* Cockpit en bento : grille compacte, chaque bloc garde sa propre
            carte, séparés par un petit espace de transition (gap-3) plutôt
            que le grand espace d'origine (gap-6/space-y-6). */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <TopBar
            globalC1Rate={globalC1Rate}
            groupes={groupes}
            selectedGroup={panel?.type === "group" ? panel.key : null}
            onSelectGroup={(key) => setPanel({ type: "group", key })}
          />

          <div className="lg:col-span-6">
            <GroupEvolutionChart />
          </div>

          <div className="lg:col-span-6">
            <PaymentAlertsTable onSelectApprenant={goToApprenant} />
          </div>

          <div className="lg:col-span-2">
            <TeachColumn />
          </div>
          <div className="lg:col-span-2">
            <GradingQueueSummaryCard />
          </div>
          <div className="lg:col-span-2">
            <SearchApprenantCard onSelectApprenant={goToApprenant} />
          </div>

          <div className="lg:col-span-2">
            <BroadcastCard />
          </div>
          <div className="lg:col-span-2">
            <VivierC1Card onSelectApprenant={goToApprenant} />
          </div>
          <div className="lg:col-span-2">
            <WeeklyReportCard onOpenReport={() => setPanel({ type: "report" })} />
          </div>
        </div>

        {panel?.type === "group" && (
          <GroupDetailPanel
            groupKey={panel.key}
            onSelectApprenant={goToApprenant}
            onClose={() => setPanel(null)}
          />
        )}
        {panel?.type === "report" && <WeeklyReportPanel onClose={() => setPanel(null)} />}
      </div>
    </div>
  );
}
