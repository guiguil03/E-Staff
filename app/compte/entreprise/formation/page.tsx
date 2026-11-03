import type { Metadata } from "next";
import EntrepriseShell from "@/components/compte-entreprise/EntrepriseShell";
import FormationEntreprise from "@/components/compte-entreprise/FormationEntreprise";

export const metadata: Metadata = {
  title: "Formation — Espace Entreprise — e-Staf",
  robots: { index: false, follow: false },
};

export default function FormationPage() {
  return (
    <EntrepriseShell title="Formation" subtitle="Déposez vos supports de formation pour vos équipes.">
      <FormationEntreprise />
    </EntrepriseShell>
  );
}
