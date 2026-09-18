import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import CyclePanel from "@/components/compte-admin/CyclePanel";

export const metadata: Metadata = {
  title: "Cycle complet — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Cycle complet"
      subtitle="Du dépôt de candidature à la production — coordonnées, test, paiement, affectation formation."
      roles={["rh"]}
    >
      <CyclePanel />
    </RhShell>
  );
}
