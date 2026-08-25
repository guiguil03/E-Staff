import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ContratCasierPanel from "@/components/compte-admin/ContratCasierPanel";

export const metadata: Metadata = {
  title: "Casier Contrat B2B — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RhShell title="Casier Contrat B2B" subtitle="Agents staffés et facturation, historique complet.">
      <ContratCasierPanel id={id} />
    </RhShell>
  );
}
