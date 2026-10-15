import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ConnecteursPanel from "@/components/compte-admin/ConnecteursPanel";

export const metadata: Metadata = {
  title: "Connecteurs — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Connecteurs"
      subtitle="Demandes de partenariat reçues via « Devenir Connecteur »."
      roles={["rh"]}
    >
      <ConnecteursPanel />
    </RhShell>
  );
}
