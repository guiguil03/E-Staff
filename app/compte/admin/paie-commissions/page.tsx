import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import FinancialDashboard from "@/components/compte-admin/FinancialDashboard";
import ComingSoonPanel from "@/components/compte-admin/ComingSoonPanel";

export const metadata: Metadata = {
  title: "Paie & Commissions — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Paie & Commissions"
      subtitle="Facturation des contrats B2B et suivi des règlements."
    >
      <div className="space-y-6">
        <FinancialDashboard />
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
