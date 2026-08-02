import type { Metadata } from "next";
import Hero from "@/components/entreprises/Hero";
import PromisesSection from "@/components/entreprises/PromisesSection";
import ExpectationsBand from "@/components/entreprises/ExpectationsBand";
import CollaborationSection from "@/components/entreprises/CollaborationSection";
import ContactSection from "@/components/entreprises/ContactSection";

export const metadata: Metadata = {
  title: "Entreprises (B2B) — e-Staf",
  description:
    "e-Staf externalise vos opérations avec des agents qualifiés : locaux équipés, encadrement managérial rigoureux, reporting hebdomadaire et zéro turnover. Squads long terme ou missions ponctuelles.",
};

export default function EntreprisesPage() {
  return (
    <div className="min-h-screen bg-obsidian">
      <Hero />
      <PromisesSection />
      <ExpectationsBand />
      <CollaborationSection />
      <ContactSection />
    </div>
  );
}
