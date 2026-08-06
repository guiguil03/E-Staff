import type { Metadata } from "next";
import NoterApprenantDashboard from "@/components/compte-formateur/NoterApprenantDashboard";

export const metadata: Metadata = {
  title: "Noter la séance — e-Staf",
  robots: { index: false, follow: false },
};

export default function NoterApprenantPage({
  params,
  searchParams,
}: {
  params: { apprenantId: string };
  searchParams: { seance?: string; groupe?: string };
}) {
  const seance = Number(searchParams.seance ?? "1");
  const groupe = searchParams.groupe ?? "";
  return (
    <NoterApprenantDashboard apprenantId={params.apprenantId} seance={seance} groupe={groupe} />
  );
}
