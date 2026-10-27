import type { Metadata } from "next";
import AgentShell from "@/components/compte-agent/AgentShell";
import MonCasierAgent from "@/components/compte-agent/MonCasierAgent";

export const metadata: Metadata = {
  title: "Mon casier — Espace Agent — e-Staf",
  robots: { index: false, follow: false },
};

export default function MonCasierAgentPage() {
  return (
    <AgentShell
      title="Mon casier"
      subtitle="Vos résultats de test, les retours de vos clients, votre contrat et vos paiements."
    >
      <MonCasierAgent />
    </AgentShell>
  );
}
