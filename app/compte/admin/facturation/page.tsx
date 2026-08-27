import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import FacturationPanel from "@/components/compte-admin/FacturationPanel";

export const metadata: Metadata = {
  title: "Facturation & Encaissement — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Facturation & Encaissement"
      subtitle="Argent qui rentre — facturation des contrats B2B et suivi des règlements clients."
    >
      <FacturationPanel />
    </RhShell>
  );
}
