import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import AgentsPanel from "@/components/compte-admin/AgentsPanel";

export const metadata: Metadata = {
  title: "Agents — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Agents"
      subtitle="Comptes des agents de production : création, identifiants, contrat et suivi."
      roles={["rh"]}
    >
      <AgentsPanel />
    </RhShell>
  );
}
