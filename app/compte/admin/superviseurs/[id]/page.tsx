import type { Metadata } from "next";
import RhShell from "@/components/compte-admin/RhShell";
import SuperviseurCasierPanel from "@/components/compte-admin/SuperviseurCasierPanel";

export const metadata: Metadata = {
  title: "Casier Superviseur — Portail RH — e-Staf",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RhShell title="Casier Superviseur" subtitle="Agents supervisés, actifs et passés." roles={["rh"]}>
      <SuperviseurCasierPanel id={id} />
    </RhShell>
  );
}
