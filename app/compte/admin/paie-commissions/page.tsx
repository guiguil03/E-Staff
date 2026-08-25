import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ComingSoonPanel from "@/components/compte-admin/ComingSoonPanel";

export const metadata: Metadata = {
  title: "Paie & Commissions — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Paie & Commissions"
      subtitle="Contrats cadres, facturation client et commissions partenaires."
    >
      <div className="space-y-6">
        <ComingSoonPanel
          title="Contrats cadres & facturation B2B"
          items={[
            "Fiches entreprises clientes détaillées (contacts, SLA, grilles tarifaires)",
            "Suivi des contrats cadres et avenants, alertes de renouvellement",
            "Tableau de bord de facturation mensuelle et suivi des règlements",
          ]}
        />
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
