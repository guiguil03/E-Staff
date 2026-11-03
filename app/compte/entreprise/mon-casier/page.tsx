import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import MonCasierEntreprise from "@/components/compte-entreprise/MonCasierEntreprise";

export const metadata: Metadata = {
  title: "Mon casier — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function MonCasierEntreprisePage() {
  return (
    <EntrepriseShell title="Mon casier" subtitle="Votre contrat e-Staf et vos factures.">
      <MonCasierEntreprise />
    </EntrepriseShell>
  );
}
