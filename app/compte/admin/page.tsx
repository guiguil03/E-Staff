import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import VueEnsemblePanel from "@/components/compte-admin/VueEnsemblePanel";

export const metadata: Metadata = {
  title: "Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Vue d'ensemble"
      subtitle="Talents, vagues de production et pilotage global."
      roles={["rh"]}
    >
      <VueEnsemblePanel />
    </RhShell>
  );
}
