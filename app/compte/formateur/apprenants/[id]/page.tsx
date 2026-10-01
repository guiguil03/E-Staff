import type { Metadata } from "next";
import ApprenantFichePage from "@/components/compte-formateur/ApprenantFichePage";

export const metadata: Metadata = {
  title: "Fiche apprenant — e-Staf",
  robots: { index: false, follow: false },
};

export default async function FormateurApprenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApprenantFichePage apprenantId={id} />;
}
