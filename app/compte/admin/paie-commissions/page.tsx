import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import BudgetDecaissementPanel from "@/components/compte-admin/BudgetDecaissementPanel";
import PaieFormateursPanel from "@/components/compte-admin/PaieFormateursPanel";
import ComingSoonPanel from "@/components/compte-admin/ComingSoonPanel";

export const metadata: Metadata = {
  title: "Paie & Commissions — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Paie & Commissions"
      subtitle="Argent qui sort — budget de production, décaissements et paie des agents/superviseurs/formateurs."
    >
      <div className="space-y-6">
        <BudgetDecaissementPanel />
        <PaieFormateursPanel />
        <ComingSoonPanel
          title="Commissions partenaires"
          items={[
            "Calcul et suivi des commissions versées aux Connecteurs (aucun modèle de deal/commission en base aujourd'hui)",
            "Liaison comptable avec la facturation client",
          ]}
        />
      </div>
    </RhShell>
  );
}
