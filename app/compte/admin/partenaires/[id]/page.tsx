import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import PartenaireCasierPanel from "@/components/compte-admin/PartenaireCasierPanel";

export const metadata: Metadata = {
  title: "Casier Partenaire — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RhShell title="Casier Partenaire" subtitle="Candidature et questionnaire de pré-qualification.">
      <PartenaireCasierPanel id={id} />
    </RhShell>
  );
}
