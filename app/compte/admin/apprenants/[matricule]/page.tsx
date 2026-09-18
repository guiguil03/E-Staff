import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ApprenantCasierPanel from "@/components/compte-admin/ApprenantCasierPanel";

export const metadata: Metadata = {
  title: "Casier Apprenant — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ matricule: string }>;
}) {
  const { matricule } = await params;
  return (
    <RhShell title="Casier Apprenant" subtitle={`Historique complet — ${matricule}`} roles={["rh"]}>
      <ApprenantCasierPanel matricule={matricule} />
    </RhShell>
  );
}
