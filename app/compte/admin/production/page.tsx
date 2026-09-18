import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ProductionPanels from "@/components/compte-admin/ProductionPanels";

export const metadata: Metadata = {
  title: "Production — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Production"
      subtitle="Agents diplômés en mission, contrats B2B et superviseurs."
      roles={["rh"]}
    >
      <ProductionPanels />
    </RhShell>
  );
}
