import type { Metadata } from "next";
import AgentShell from "@/components/compte-agent/AgentShell";
import AgentDashboard from "@/components/compte-agent/AgentDashboard";
import SuiviActiviteAgent from "@/components/compte-agent/SuiviActiviteAgent";

export const metadata: Metadata = {
  title: "Mes performances — Espace Agent — e-Staf",
  robots: { index: false, follow: false },
};

export default function CompteAgentPage() {
  return (
    <AgentShell
      title="Mes performances"
      subtitle="Objectifs atteints, temps travaillé et production de votre mission."
    >
      <div className="space-y-8">
        <SuiviActiviteAgent />
        <AgentDashboard />
      </div>
    </AgentShell>
  );
}
