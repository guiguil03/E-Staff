import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import FormateurCasierPanel from "@/components/compte-admin/FormateurCasierPanel";

export const metadata: Metadata = {
  title: "Casier Formateur — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RhShell
      title="Casier Formateur"
      subtitle="Vagues encadrées et performance."
      roles={["admin", "rh"]}
    >
      <FormateurCasierPanel id={id} />
    </RhShell>
  );
}
