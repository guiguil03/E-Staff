import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import AgentsAcquisitionPanel from "@/components/compte-admin/AgentsAcquisitionPanel";

export const metadata: Metadata = {
  title: "Agents d'Acquisition — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Agents d'Acquisition"
      subtitle="Recommandations, conversions et réinscriptions par agent, avec commissions."
      roles={["rh"]}
    >
      <AgentsAcquisitionPanel />
    </RhShell>
  );
}
