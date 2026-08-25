import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import PersonneCasierPanel from "@/components/compte-admin/PersonneCasierPanel";

export const metadata: Metadata = {
  title: "Fiche Candidat — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return (
    <RhShell
      title="Fiche complète"
      subtitle="Tout le parcours de cette personne, du test à la production."
    >
      <PersonneCasierPanel attemptId={attemptId} />
    </RhShell>
  );
}
