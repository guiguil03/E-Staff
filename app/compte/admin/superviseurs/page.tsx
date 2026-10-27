import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import SuperviseursPanel from "@/components/compte-admin/SuperviseursPanel";

export const metadata: Metadata = {
  title: "Superviseurs — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell
      title="Superviseurs"
      subtitle="Comptes des superviseurs : création, identifiants, accès à leur espace, absences et casier."
      roles={["rh"]}
    >
      <SuperviseursPanel />
    </RhShell>
  );
}
