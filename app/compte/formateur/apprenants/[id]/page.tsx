import type { Metadata } from "next";
import ApprenantFichePage from "@/components/compte-formateur/ApprenantFichePage";

export const metadata: Metadata = {
  title: "Fiche apprenant — e-Staf",
  robots: { index: false, follow: false },
};

export default function FormateurApprenantPage({ params }: { params: { id: string } }) {
  return <ApprenantFichePage apprenantId={params.id} />;
}
