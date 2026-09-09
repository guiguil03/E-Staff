import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import InscriptionsPanel from "@/components/compte-admin/InscriptionsPanel";

export const metadata: Metadata = {
  title: "Inscriptions — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Inscriptions"
      subtitle="Suivi des inscrits (tous funnels), contrats et confirmation des paiements."
    >
      <InscriptionsPanel />
    </RhShell>
  );
}
