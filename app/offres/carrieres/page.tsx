import type { Metadata } from "next";
import StudioMetier from "@/components/studio-metier/StudioMetier";

export const metadata: Metadata = {
  title: "Ma carrière — Offres d'emploi | e-Staf",
  description:
    "Découvrez nos offres d'emploi ouvertes, postulez en quelques clics et lisez le parcours de ceux qui ont trouvé leur emploi grâce à e-Staf.",
};

export default function CarrieresPage() {
  return <StudioMetier />;
}
