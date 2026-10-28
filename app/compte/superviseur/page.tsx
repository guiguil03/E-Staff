import type { Metadata } from "next";
import SuperviseurShell from "@/components/compte-superviseur/SuperviseurShell";
import SuperviseurDashboard from "@/components/compte-superviseur/SuperviseurDashboard";

export const metadata: Metadata = {
  title: "Tableau de bord — Espace Superviseur — e-Staf",
  robots: { index: false, follow: false },
};

export default function CompteSuperviseurPage() {
  return (
    <SuperviseurShell
      title="Tableau de bord"
      subtitle="Votre équipe en direct, la validation des heures, vos réunions et votre rémunération."
    >
      <SuperviseurDashboard />
    </SuperviseurShell>
  );
}
