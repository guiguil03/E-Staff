import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ReunionsPanel from "@/components/compte-admin/ReunionsPanel";

export const metadata: Metadata = {
  title: "Réunions — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Réunions"
      subtitle="Convoquez une réunion pour l'équipe interne, les partenaires, ou les deux."
      roles={["admin"]}
    >
      <ReunionsPanel />
    </RhShell>
  );
}
