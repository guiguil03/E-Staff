import type { Metadata } from "next";
import Hero from "@/components/entreprises/former-equipe/Hero";
import Promises from "@/components/entreprises/former-equipe/Promises";
import SecteurSelector from "@/components/entreprises/former-equipe/SecteurSelector";
import OffreExtra from "@/components/entreprises/former-equipe/OffreExtra";

export const metadata: Metadata = {
  title: "Former son équipe | e-Staf",
  description:
    "Montez en compétences vos équipes sans sacrifier votre productivité : formats courts, groupes à taille humaine, suivi RH clés en main, par secteur.",
};

export default function FormerSonEquipePage() {
  return (
    <div className="bg-obsidian">
      <Hero />
      <Promises />
      <SecteurSelector />
      <OffreExtra />
    </div>
  );
}
