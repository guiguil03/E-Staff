import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ProjetsClientsPanel from "@/components/compte-admin/ProjetsClientsPanel";

export const metadata: Metadata = {
  title: "Projets clients — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Projets clients"
      subtitle="Demandes d'externalisation reçues via « Proposer un projet »."
      roles={["rh"]}
    >
      <ProjetsClientsPanel />
    </RhShell>
  );
}
