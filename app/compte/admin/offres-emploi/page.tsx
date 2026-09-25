import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import OffresEmploiPanel from "@/components/compte-admin/OffresEmploiPanel";

export const metadata: Metadata = {
  title: "Offres d'emploi — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Offres d'emploi"
      subtitle="Offres affichées sur la vitrine Studio Métier : places, date limite, publication."
      roles={["rh"]}
    >
      <OffresEmploiPanel />
    </RhShell>
  );
}
