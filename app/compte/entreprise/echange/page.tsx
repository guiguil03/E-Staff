import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import EchangeSuperviseur from "@/components/compte-entreprise/EchangeSuperviseur";

export const metadata: Metadata = {
  title: "Échange superviseur — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function EchangePage() {
  return (
    <EntrepriseShell title="Échange avec le superviseur" subtitle="Vos bilans hebdomadaires et vos échanges.">
      <EchangeSuperviseur />
    </EntrepriseShell>
  );
}
