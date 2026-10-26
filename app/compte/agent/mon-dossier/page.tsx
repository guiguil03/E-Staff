import type { Metadata } from "next";
import AgentShell from "@/components/compte-agent/AgentShell";
import MonDossierAgent from "@/components/compte-agent/MonDossierAgent";

export const metadata: Metadata = {
  title: "Mon dossier — Espace Agent — e-Staf",
  robots: { index: false, follow: false },
};

export default function MonDossierAgentPage() {
  return (
    <AgentShell
      title="Mon dossier"
      subtitle="Vos informations, votre contrat de travail et l'historique de vos missions."
    >
      <MonDossierAgent />
    </AgentShell>
  );
}
