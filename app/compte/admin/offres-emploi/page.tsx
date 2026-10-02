import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import OffresEmploiPanel from "@/components/compte-admin/OffresEmploiPanel";
import MediaWallPanel from "@/components/compte-admin/MediaWallPanel";

export const metadata: Metadata = {
  title: "Offres & Médias — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Offres & Médias"
      subtitle="Offres d'emploi et médias affichés sur la vitrine Studio Métier (/offres/carrieres)."
      roles={["rh"]}
    >
      <div className="space-y-6">
        <OffresEmploiPanel />
        <MediaWallPanel />
      </div>
    </RhShell>
  );
}
