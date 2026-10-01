import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ForumLivePanel from "@/components/compte-admin/ForumLivePanel";
import ComptesStaffPanel from "@/components/compte-admin/ComptesStaffPanel";

export const metadata: Metadata = {
  title: "Paramètres RH — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Paramètres RH"
      subtitle="Comptes d'accès Admin & RH, et planification du Live mensuel du Forum public."
      roles={["admin"]}
    >
      <div className="space-y-10">
        <ComptesStaffPanel />
        <ForumLivePanel />
      </div>
    </RhShell>
  );
}
