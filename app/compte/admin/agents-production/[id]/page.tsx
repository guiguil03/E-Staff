import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import AgentCasierPanel from "@/components/compte-admin/AgentCasierPanel";

export const metadata: Metadata = {
  title: "Casier agent — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RhShell
      title="Casier agent"
      subtitle="Fiche, contrat, objectifs, relevé journalier et paie de l'agent."
      roles={["rh"]}
    >
      <AgentCasierPanel id={id} />
    </RhShell>
  );
}
