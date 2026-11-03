import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import SalleEntretien from "@/components/compte-entreprise/SalleEntretien";

export const metadata: Metadata = {
  title: "Entretiens — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function EntretiensPage() {
  return (
    <EntrepriseShell title="Entretiens" subtitle="Planifiez et passez vos entretiens virtuels.">
      <SalleEntretien />
    </EntrepriseShell>
  );
}
