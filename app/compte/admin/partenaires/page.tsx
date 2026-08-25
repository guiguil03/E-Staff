import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import PartenairesPanel from "@/components/compte-admin/PartenairesPanel";

export const metadata: Metadata = {
  title: "Partenaires — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Partenaires"
      subtitle="Répertoire des apporteurs d'affaires et suivi des candidatures Connecteur."
    >
      <PartenairesPanel />
    </RhShell>
  );
}
