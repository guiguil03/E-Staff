import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import AcademiePanels from "@/components/compte-admin/AcademiePanels";

export const metadata: Metadata = {
  title: "Académie & Vagues — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Académie & Gestion des Vagues"
      subtitle="Groupes de formation, registre des apprenants et matricules."
      roles={["admin"]}
    >
      <AcademiePanels />
    </RhShell>
  );
}
