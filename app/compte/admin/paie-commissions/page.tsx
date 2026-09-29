import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import BudgetDecaissementPanel from "@/components/compte-admin/BudgetDecaissementPanel";
import PaieFormateursPanel from "@/components/compte-admin/PaieFormateursPanel";

export const metadata: Metadata = {
  title: "Paie & Commissions — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

// Les commissions Connecteurs (récurrente % + démarrage) sont couvertes par
// BudgetDecaissementPanel -> DetailCommissionsApporteursModal, adossées aux
// mêmes ContratB2B que la facturation client (voir ProductionService
// getCommissionsApporteurs/getCommissionsDemarrage) — retrait du panneau
// "Coming Soon" qui annonçait ces deux points comme non couverts (2026-09-29).
export default function Page() {
  return (
    <RhShell
      title="Paie & Commissions"
      subtitle="Argent qui sort — budget de production, décaissements et paie des agents/superviseurs/formateurs."
      roles={["rh"]}
    >
      <div className="space-y-6">
        <BudgetDecaissementPanel />
        <PaieFormateursPanel />
      </div>
    </RhShell>
  );
}
