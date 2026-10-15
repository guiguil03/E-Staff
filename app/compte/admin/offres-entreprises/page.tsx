import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import OffresEntreprisesPanel from "@/components/compte-admin/OffresEntreprisesPanel";

export const metadata: Metadata = {
  title: "Offres Entreprises — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Offres Entreprises"
      subtitle="Lots (Squad Long Terme) et missions ponctuelles affichés sur la page /entreprises."
      roles={["rh"]}
    >
      <OffresEntreprisesPanel />
    </RhShell>
  );
}
