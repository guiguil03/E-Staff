import type { Metadata } from "next";
import StudioMetier from "@/components/studio-metier/StudioMetier";

export const metadata: Metadata = {
  title: "Studio Métier — Candidater | e-Staf",
  description:
    "Choisissez votre voie parmi nos missions à long terme et à court terme, passez le test de sélection C1, et déposez votre candidature.",
};

export default function CarrieresPage() {
  return <StudioMetier />;
}
