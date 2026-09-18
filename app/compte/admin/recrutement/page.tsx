import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import RecrutementPanels from "@/components/compte-admin/RecrutementPanels";

export const metadata: Metadata = {
  title: "Recrutement — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Recrutement"
      subtitle="Validation RH des candidats, contrats et confirmation des paiements."
      roles={["rh"]}
    >
      <RecrutementPanels />
    </RhShell>
  );
}
