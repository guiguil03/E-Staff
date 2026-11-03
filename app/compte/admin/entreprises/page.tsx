import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import EntreprisesPanel from "@/components/compte-admin/EntreprisesPanel";

export const metadata: Metadata = {
  title: "Entreprises — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Entreprises"
      subtitle="Comptes des entreprises clientes : création, identifiants, contrats rattachés et intérêts du vivier de talents."
      roles={["rh"]}
    >
      <EntreprisesPanel />
    </RhShell>
  );
}
