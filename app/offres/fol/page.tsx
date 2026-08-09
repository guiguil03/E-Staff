import type { Metadata } from "next";
import Hero from "@/components/fol/Hero";
import PillarsPanel from "@/components/fol/PillarsPanel";
import ProcessSection from "@/components/fol/ProcessSection";
import StepsSection from "@/components/fol/StepsSection";
import ClosingSection from "@/components/fol/ClosingSection";

export const metadata: Metadata = {
  title: "FOL — Français Oratoire des Leaders | e-Staf",
  description:
    "Le programme phare e-Staf : devenez celui qu'on écoute, qu'on respecte et qu'on suit. Cursus d'élite de 6 mois, sélection exigeante, 5 élus sur 15.",
};

// /offres/fol — the FOL flagship program page, rendered entirely in the
// dark/elite visual universe (near-black + gold), deliberately distinct
// from the rest of the (light-universe) site.
export default function FolPage() {
  return (
    <div className="bg-obsidian">
      <Hero />
      <PillarsPanel />
      <ProcessSection />
      <StepsSection />
      <ClosingSection />
    </div>
  );
}
