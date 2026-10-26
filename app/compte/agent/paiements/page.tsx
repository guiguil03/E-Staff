import type { Metadata } from "next";
import AgentShell from "@/components/compte-agent/AgentShell";
import PaiementsAgent from "@/components/compte-agent/PaiementsAgent";

export const metadata: Metadata = {
  title: "Mes paiements — Espace Agent — e-Staf",
  robots: { index: false, follow: false },
};

export default function PaiementsAgentPage() {
  return (
    <AgentShell
      title="Mes paiements"
      subtitle="Vos salaires, primes et retenues, période par période."
    >
      <PaiementsAgent />
    </AgentShell>
  );
}
