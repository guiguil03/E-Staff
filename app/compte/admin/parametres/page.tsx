import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import ForumLivePanel from "@/components/compte-admin/ForumLivePanel";

export const metadata: Metadata = {
  title: "Paramètres RH — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <RhShell title="Paramètres RH" subtitle="Planification du Live mensuel du Forum public.">
      <ForumLivePanel />
    </RhShell>
  );
}
