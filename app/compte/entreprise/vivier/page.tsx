import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import VivierTalents from "@/components/compte-entreprise/VivierTalents";

export const metadata: Metadata = {
  title: "Vivier de talents — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function VivierPage() {
  return (
    <EntrepriseShell title="Vivier de talents" subtitle="Choisissez les profils qui rejoindront votre équipe.">
      <VivierTalents />
    </EntrepriseShell>
  );
}
