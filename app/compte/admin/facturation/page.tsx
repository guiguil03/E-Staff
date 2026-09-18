import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import FacturationPanel from "@/components/compte-admin/FacturationPanel";
import EncaissementsFormationPanel from "@/components/compte-admin/EncaissementsFormationPanel";

export const metadata: Metadata = {
  title: "Facturation & Encaissement — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Facturation & Encaissement"
      subtitle="Argent qui rentre — facturation des contrats B2B et suivi des règlements clients."
      roles={["rh"]}
    >
      <div className="space-y-10">
        <FacturationPanel />
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Encaissements — Académie</h2>
          <p className="mt-1 font-sans text-sm text-white/50">
            Versements reçus des apprenants pour leur formation, ventilés par type de cours.
          </p>
          <div className="mt-4">
            <EncaissementsFormationPanel />
          </div>
        </div>
      </div>
    </RhShell>
  );
}
