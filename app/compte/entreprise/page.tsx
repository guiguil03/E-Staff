import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import EntrepriseDashboard from "@/components/compte-entreprise/EntrepriseDashboard";

export const metadata: Metadata = {
  title: "Tableau de bord — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function CompteEntreprisePage() {
  return (
    <EntrepriseShell title="Tableau de bord" subtitle="Vos équipes en temps réel, par contrat ou en vision globale.">
      <EntrepriseDashboard />
    </EntrepriseShell>
  );
}
