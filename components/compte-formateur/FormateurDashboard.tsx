"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import TopBar from "./TopBar";
import GroupEvolutionChart from "./GroupEvolutionChart";
import TeachColumn from "./TeachColumn";
import GradingQueueSummaryCard from "./GradingQueueSummaryCard";
import AdminColumn from "./AdminColumn";
import GroupDetailPanel from "./GroupDetailPanel";
import WeeklyReportPanel from "./WeeklyReportPanel";
import PaymentAlertsTable from "./PaymentAlertsTable";
import { GLOBAL_C1_RATE, GROUPES } from "./exampleData";
import { useRequireRole } from "@/lib/useRequireRole";

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
      <div className="mx-auto max-w-6xl space-y-6">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Cockpit Formateur
          </p>
          <h1 className="mt-1 font-display text-xl font-semibold text-white sm:text-2xl">
            Bonjour, Hasina
          </h1>
        </Reveal>

        <TopBar
          globalC1Rate={GLOBAL_C1_RATE}
          groupes={GROUPES}
          selectedGroup={panel?.type === "group" ? panel.key : null}
          onSelectGroup={(key) => setPanel({ type: "group", key })}
        />

        <GroupEvolutionChart />

        <PaymentAlertsTable onSelectApprenant={goToApprenant} />

        {panel?.type === "group" && (
          <GroupDetailPanel
            groupKey={panel.key}
            onSelectApprenant={goToApprenant}
            onClose={() => setPanel(null)}
          />
        )}
        {panel?.type === "report" && <WeeklyReportPanel onClose={() => setPanel(null)} />}

        <div className="grid gap-6 lg:grid-cols-3">
          <TeachColumn />
          <GradingQueueSummaryCard />
          <AdminColumn
            onSelectApprenant={goToApprenant}
            onOpenReport={() => setPanel({ type: "report" })}
          />
        </div>
      </div>
    </div>
  );
}
