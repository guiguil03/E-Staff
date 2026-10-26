import type { Metadata } from "next";
import AgentShell from "@/components/compte-agent/AgentShell";
import AgentDashboard from "@/components/compte-agent/AgentDashboard";

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
      <AgentDashboard />
    </AgentShell>
  );
}
