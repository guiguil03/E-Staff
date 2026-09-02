import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import CoordonneesPanel from "@/components/compte-admin/CoordonneesPanel";

export const metadata: Metadata = {
  title: "Coordonnées — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Coordonnées"
      subtitle="Contact, CV et vidéos de test, regroupés par candidat."
    >
      <CoordonneesPanel />
    </RhShell>
  );
}
