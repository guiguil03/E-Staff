import type { Metadata } from "next";
import SuperviseurShell from "@/components/compte-superviseur/SuperviseurShell";
import MonCasierSuperviseur from "@/components/compte-superviseur/MonCasierSuperviseur";

export const metadata: Metadata = {
  title: "Mon casier — Espace Superviseur — e-Staf",
  robots: { index: false, follow: false },
};

export default function MonCasierSuperviseurPage() {
  return (
    <SuperviseurShell
      title="Mon casier"
      subtitle="Votre équipe, vos performances par client, vos absences et vos paiements."
    >
      <MonCasierSuperviseur />
    </SuperviseurShell>
  );
}
